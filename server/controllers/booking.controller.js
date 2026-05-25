const { Booking, Business, Customer, Service, Staff, Location, BookingService } = require("../models/associations");
const { Op } = require("sequelize");
const { emitToBusiness } = require("../services/socket.service");
const whatsappService = require("../services/whatsapp.service");


const getBusinessId = (req) => {
    if (req.body?.business_id) return req.body.business_id;
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const bookingController = {
    create: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            if (business_id === -1) return res.status(403).json({ success: false, message: "No business associated with your account." });
            
            // Subscription Limit Check
            const subscriptionGuard = require("../utils/subscriptionGuard");
            const canBook = await subscriptionGuard.canAcceptBookingByBusiness(business_id);
            if (!canBook) {
                return res.status(403).json({ 
                    success: false, 
                    message: "This business is currently not accepting new bookings due to reached subscription limits. Please contact the business owner.",
                    limitReached: true
                });
            }

            // Extract service_ids and other data
            const { service_ids, ...bookingData } = req.body;

            // --- Handle Customer (Find or Create) ---
            let customer_id = bookingData.customer_id;
            if (!customer_id && (bookingData.phone || bookingData.email)) {
                const [customer] = await Customer.findOrCreate({
                    where: {
                        business_id,
                        [Op.or]: [
                            bookingData.phone ? { phone: bookingData.phone } : null,
                            bookingData.email ? { email: bookingData.email } : null
                        ].filter(Boolean)
                    },
                    defaults: {
                        name: bookingData.name || 'New Customer',
                        phone: bookingData.phone,
                        email: bookingData.email,
                        business_id
                    }
                });
                customer_id = customer.id;
            }

            if (!customer_id) {
                return res.status(400).json({ success: false, message: "Customer identification (ID, Phone, or Email) is required." });
            }
            
            const row = await Booking.create({ 
                ...bookingData, 
                customer_id,
                business_id 
            });

            // Store multiple services if provided
            if (service_ids && Array.isArray(service_ids) && service_ids.length > 0) {
                const bookingServices = service_ids.map(service_id => ({
                    booking_id: row.id,
                    service_id: service_id
                }));
                await BookingService.bulkCreate(bookingServices);
            } else if (req.body.service_id) {
                // Fallback for single service if service_ids array is not provided
                await BookingService.create({
                    booking_id: row.id,
                    service_id: req.body.service_id
                });
            }
            
            /* 
            // Calendar Sync Disabled
            // Background Sync to Google Calendar
            try {
                const [business, customer, service, staff, location] = await Promise.all([
                    Business.findByPk(business_id),
                    Customer.findByPk(row.customer_id),
                    Service.findByPk(row.service_id),
                    Staff.findByPk(row.staff_id),
                    Location.findByPk(row.location_id)
                ]);

                // Fire and forget with status update
                if (business.google_sync_enabled) {
                    syncBookingToGoogle(row, { business, customer, service, staff, location })
                        .then(async (event) => {
                            if (event && event.id) {
                                await row.update({ google_event_id: event.id });
                                console.log(`[GoogleSync] Updated booking ${row.id} with Event ID: ${event.id}`);
                            }
                        })
                        .catch(err => console.error('[GoogleSync] Background error:', err.message));
                } else {
                    console.log(`[GoogleSync] Skipping: Auto-sync disabled for business ${business_id}`);
                }
            } catch (syncErr) {
                console.error('[GoogleSync] Preparation error:', syncErr.message);
            }
            */

            // Fetch full booking details for socket emission (including customer and services)
            const fullBooking = await Booking.findByPk(row.id, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Service, as: 'services', through: { attributes: [] } },
                    { model: Staff, as: 'staff' },
                    { model: Location, as: 'location' },
                    { model: Business, as: 'business' }
                ]
            });

            // --- WhatsApp Notifications ---
            if (fullBooking && fullBooking.payment_status) {
                whatsappService.sendBookingNotification(row.id);
            }
            // ------------------------------


            res.status(201).json({ success: true, message: "Booking created successfully", data: fullBooking || row });

            // Emit Socket Event with full details
            emitToBusiness(business_id, "bookingCreated", fullBooking || row);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const offset = (page - 1) * limit;

            const whereClause = { }; // Bookings don't use 'status: true' consistently or at all? 
            // In getAll original it didn't have status: true.

            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Bypass filter for Portal Admin
            } else if (req.user?.user_id) {
                // Fetch all businesses owned by this user
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                const businessIds = businesses.map(b => b.id);
                whereClause.business_id = { [Op.in]: businessIds.length > 0 ? businessIds : [-1] };
            } else {
                whereClause.business_id = -1;
            }

            const { count, rows } = await Booking.findAndCountAll({
                where: whereClause,
                include: [
                    { model: Service, as: 'services', through: { attributes: [] } }
                ],
                limit,
                offset,
                distinct: true // Required when using limit/offset with include to get correct count
            });

            res.json({
                success: true,
                message: "Bookings fetched successfully",
                totalRecords: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                data: rows
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const whereClause = { id: req.params.id };
            
            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Bypass filter for Portal Admin
            } else if (req.user?.user_id) {
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Booking.findOne({ 
                where: whereClause,
                include: [
                    { model: Service, as: 'services', through: { attributes: [] } }
                ]
            });
            if (!row) return res.status(404).json({ success: false, message: "Booking not found" });
            res.json({ success: true, message: "Booking fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const whereClause = { id: req.params.id };
            
            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Bypass filter for Portal Admin
            } else if (req.user?.user_id) {
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Booking.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Booking not found" });
            
            const { business_id: _, ...safeBody } = req.body;
            if (req.body.business_id) {
                safeBody.business_id = req.body.business_id;
            }

            await row.update(safeBody);
            res.json({ success: true, message: "Booking updated successfully", data: row });

            // Emit Socket Event
            emitToBusiness(row.business_id, "bookingUpdated", row);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const whereClause = { id: req.params.id };
            
            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Bypass filter for Portal Admin
            } else if (req.user?.user_id) {
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Booking.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Booking not found" });
            
            await row.update({ status: false });
            res.json({ success: true, message: "Booking deleted successfully" });

            // Emit Socket Event
            emitToBusiness(row.business_id, "bookingCancelled", { id: row.id });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = bookingController;
