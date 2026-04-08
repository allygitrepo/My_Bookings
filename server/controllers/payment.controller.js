const Payment = require("../models/payment.model");
const Booking = require("../models/booking.model");
const { Op } = require("sequelize");

const getBusinessId = (req) => {
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const paymentController = {
    create: async (req, res) => {
        try {
            const row = await Payment.create(req.body);
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
            } else if (req.user?.user_id) {
                // Fetch all businesses owned by this user
                const Business = require("../models/business.model");
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                const businessIds = businesses.map(b => b.id);
                whereClause.business_id = businessIds.length > 0 ? businessIds : -1;
            } else {
                whereClause.business_id = -1;
            }

            // Filter payments via bookings belonging to these businesses
            const businessBookings = await Booking.findAll({
                where: whereClause,
                attributes: ['id']
            });
            const bookingIds = businessBookings.map(b => b.id);

            // If no bookings, return empty (avoids showing all payments when bookingIds is [])
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

            const { count, rows } = await Payment.findAndCountAll({
                where: { booking_id: { [Op.in]: bookingIds } },
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
    }
};

module.exports = paymentController;
