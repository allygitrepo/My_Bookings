const StaffAvailability = require("../models/staffAvailability.model");

const staffAvailabilityController = {
    create: async (req, res) => {
        try {
            const row = await StaffAvailability.create(req.body);
            res.status(201).json({ success: true, message: "StaffAvailability created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const rows = await StaffAvailability.findAll({ where: { status: true } });
            res.json({ success: true, message: "StaffAvailabilities fetched successfully", data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const row = await StaffAvailability.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "StaffAvailability not found" });
            res.json({ success: true, message: "StaffAvailability fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await StaffAvailability.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "StaffAvailability not found" });
            await row.update(req.body);
            res.json({ success: true, message: "StaffAvailability updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await StaffAvailability.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "StaffAvailability not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "StaffAvailability deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = staffAvailabilityController;
