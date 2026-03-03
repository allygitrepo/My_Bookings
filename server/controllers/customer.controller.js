const Customer = require("../models/customer.model");

const customerController = {
    create: async (req, res) => {
        try {
            const row = await Customer.create(req.body);
            res.status(201).json({ success: true, message: "Customer created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const rows = await Customer.findAll({ where: { status: true } });
            res.json({ success: true, message: "Customers fetched successfully", data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const row = await Customer.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Customer not found" });
            res.json({ success: true, message: "Customer fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await Customer.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Customer not found" });
            await row.update(req.body);
            res.json({ success: true, message: "Customer updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await Customer.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Customer not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "Customer deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = customerController;
