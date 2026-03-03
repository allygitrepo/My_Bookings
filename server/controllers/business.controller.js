const Business = require("../models/business.model");

const businessController = {
    create: async (req, res) => {
        try {
            const row = await Business.create({
                ...req.body,
                user_id: req.user.user_id  // Always enforce from JWT
            });
            res.status(201).json({ success: true, message: "Business created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const whereClause = { status: true };
            // Widget: filter by specific business id; Admin: filter by user_id from JWT
            // Use -1 sentinel when IDs are null to prevent data leaks
            if (req.isWidget) {
                whereClause.id = req.business_id ?? -1;
            } else {
                whereClause.user_id = req.user?.user_id ?? -1;
            }

            const { count, rows } = await Business.findAndCountAll({
                where: whereClause,
                limit,
                offset
            });

            res.json({
                success: true,
                message: "Businesses fetched successfully",
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
            const whereClause = { id: req.params.id, status: true };
            if (!req.isWidget && req.user) whereClause.user_id = req.user.user_id;

            const row = await Business.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Business not found" });
            res.json({ success: true, message: "Business fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const whereClause = { id: req.params.id, status: true };
            if (!req.isWidget && req.user) whereClause.user_id = req.user.user_id;

            const row = await Business.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Business not found" });

            const { user_id, ...safeBody } = req.body; // prevent overwriting user_id
            await row.update(safeBody);
            res.json({ success: true, message: "Business updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const whereClause = { id: req.params.id, status: true };
            if (!req.isWidget && req.user) whereClause.user_id = req.user.user_id;

            const row = await Business.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Business not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "Business deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = businessController;
