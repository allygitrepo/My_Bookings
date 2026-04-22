const Payment = require("../models/payment.model");
const Booking = require("../models/booking.model");
const { Op } = require("sequelize");
const crypto = require("crypto");
const razorpayService = require("../services/razorpay.service");

const getBusinessId = (req) => {
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const paymentController = {
    create: async (req, res) => {
        try {
            const data = { ...req.body };
            if (!data.transaction_id) {
                data.transaction_id = 'txn_' + crypto.randomBytes(4).toString('hex');
            }
            const booking = await Booking.findByPk(data.booking_id);
            if (!data.business_id && booking) {
                data.business_id = booking.business_id;
            }
            const row = await Payment.create(data);
            res.status(201).json({ success: true, message: "Payment created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const offset = (page - 1) * limit;
            const whereClause = { };

            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Bypass filter for Portal Admin: whereClause remains empty
            } else if (req.user?.user_id) {
                // Fetch all businesses owned by this user
                const Business = require("../models/business.model");
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                const businessIds = businesses.map(b => b.id);
                whereClause.business_id = { [Op.in]: businessIds.length > 0 ? businessIds : [-1] };
            } else {
                whereClause.business_id = -1;
            }

            // Filter payments via bookings belonging to these businesses
            const businessBookings = await Booking.findAll({
                where: whereClause,
                attributes: ['id']
            });
            const bookingIds = businessBookings.map(b => b.id);

            // Fetch payments
            const paymentWhere = {};
            if (Object.keys(whereClause).length > 0) {
                // If there were filters, we must restrict by booking IDs
                if (bookingIds.length === 0) {
                    return res.json({
                        success: true,
                        message: "Payments fetched successfully",
                        totalRecords: 0,
                        totalPages: 0,
                        currentPage: page,
                        data: []
                    });
                }
                paymentWhere.booking_id = { [Op.in]: bookingIds };
            }
            // else: Portal Admin (empty whereClause) sees all payments without restriction


            const { count, rows } = await Payment.findAndCountAll({
                where: paymentWhere,
                limit,
                offset
            });

            res.json({
                success: true,
                message: "Payments fetched successfully",
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
            const row = await Payment.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Payment not found" });
            res.json({ success: true, message: "Payment fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await Payment.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Payment not found" });
            await row.update(req.body);
            res.json({ success: true, message: "Payment updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await Payment.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Payment not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "Payment deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- Razorpay Integration ---

    createRazorpayOrder: async (req, res) => {
        try {
            const { amount, booking_id, business_id } = req.body;
            if (!amount || !booking_id) {
                return res.status(400).json({ success: false, message: "Amount and Booking ID are required" });
            }

            const order = await razorpayService.createOrder(amount, booking_id, {
                booking_id: String(booking_id),
                business_id: String(business_id || '')
            });

            res.json({ success: true, order });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    verifyRazorpayPayment: async (req, res) => {
        try {
            const { 
                razorpay_order_id, 
                razorpay_payment_id, 
                razorpay_signature,
                booking_id,
                amount,
                paid_amount
            } = req.body;

            const isVerified = razorpayService.verifySignature(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            );

            if (!isVerified) {
                return res.status(400).json({ success: false, message: "Invalid payment signature" });
            }

            // Fetch booking to get business_id
            const booking = await Booking.findByPk(booking_id);
            if (!booking) {
                return res.status(404).json({ success: false, message: "Booking not found" });
            }

            // Create payment record
            const paymentRecord = await Payment.create({
                booking_id: booking_id,
                business_id: booking.business_id,
                amount: amount,
                paid_amount: paid_amount || amount,
                payment_method: 'Razorpay',
                transaction_id: razorpay_payment_id,
                payment_status: true
            });

            // Update booking status
            await booking.update({ payment_status: true });

            res.json({ 
                success: true, 
                message: "Payment verified and recorded successfully", 
                data: paymentRecord 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = paymentController;
