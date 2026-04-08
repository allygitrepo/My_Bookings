const Booking = require("../models/booking.model");
const Business = require("../models/business.model");
const Customer = require("../models/customer.model");
const Service = require("../models/service.model");
const Staff = require("../models/staff.model");
const Location = require("../models/location.model");
const { syncBookingToGoogle } = require("../services/googleCalendar.service");

const getBusinessId = (req) => {
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const bookingController = {
    create: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            if (business_id === -1) return res.status(403).json({ success: false, message: "No business associated with your account." });
            
            const row = await Booking.create({ ...req.body, business_id });
            
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

            res.status(201).json({ success: true, message: "Booking created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const offset = (page - 1) * limit;
            const business_id = getBusinessId(req);

            const { count, rows } = await Booking.findAndCountAll({
                where: { business_id },
                limit,
                offset
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
            const business_id = getBusinessId(req);
            const row = await Booking.findOne({ where: { id: req.params.id, business_id } });
            if (!row) return res.status(404).json({ success: false, message: "Booking not found" });
            res.json({ success: true, message: "Booking fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            const row = await Booking.findOne({ where: { id: req.params.id, business_id } });
            if (!row) return res.status(404).json({ success: false, message: "Booking not found" });
            const { business_id: _, ...safeBody } = req.body;
            await row.update(safeBody);
            res.json({ success: true, message: "Booking updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            const row = await Booking.findOne({ where: { id: req.params.id, business_id } });
            if (!row) return res.status(404).json({ success: false, message: "Booking not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "Booking deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = bookingController;
