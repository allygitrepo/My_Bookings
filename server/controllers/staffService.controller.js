const StaffService = require("../models/staffService.model");

const staffServiceController = {
    create: async (req, res) => {
        try {
            const row = await StaffService.create(req.body);
            res.status(201).json({ success: true, message: "StaffService created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const rows = await StaffService.findAll({ where: { status: true } });
            res.json({ success: true, message: "StaffServices fetched successfully", data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const row = await StaffService.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "StaffService not found" });
            res.json({ success: true, message: "StaffService fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await StaffService.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "StaffService not found" });
            await row.update(req.body);
            res.json({ success: true, message: "StaffService updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await StaffService.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "StaffService not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "StaffService deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = staffServiceController;
