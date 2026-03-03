const Staff = require("../models/staff.model");

const staffController = {
    create: async (req, res) => {
        try {
            const row = await Staff.create(req.body);
            res.status(201).json({ success: true, message: "Staff created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const { count, rows } = await Staff.findAndCountAll({
                where: { status: true },
                limit,
                offset
            });

            res.json({
                success: true,
                message: "Staff fetched successfully",
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
            const row = await Staff.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
            res.json({ success: true, message: "Staff fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await Staff.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
            await row.update(req.body);
            res.json({ success: true, message: "Staff updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await Staff.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "Staff deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = staffController;
