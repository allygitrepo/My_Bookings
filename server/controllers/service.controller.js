const Service = require("../models/service.model");

const serviceController = {
    create: async (req, res) => {
        try {
            const row = await Service.create(req.body);
            res.status(201).json({ success: true, message: "Service created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const rows = await Service.findAll({ where: { status: true } });
            res.json({ success: true, message: "Services fetched successfully", data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const row = await Service.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Service not found" });
            res.json({ success: true, message: "Service fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await Service.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Service not found" });
            await row.update(req.body);
            res.json({ success: true, message: "Service updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await Service.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Service not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "Service deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = serviceController;
