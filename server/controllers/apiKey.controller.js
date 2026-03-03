const ApiKey = require("../models/apiKey.model");

const apiKeyController = {
    create: async (req, res) => {
        try {
            const row = await ApiKey.create(req.body);
            res.status(201).json({ success: true, message: "ApiKey created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const { count, rows } = await ApiKey.findAndCountAll({
                where: { status: true },
                limit,
                offset
            });

            res.json({
                success: true,
                message: "ApiKeys fetched successfully",
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
            const row = await ApiKey.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "ApiKey not found" });
            res.json({ success: true, message: "ApiKey fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await ApiKey.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "ApiKey not found" });
            await row.update(req.body);
            res.json({ success: true, message: "ApiKey updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await ApiKey.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "ApiKey not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "ApiKey deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = apiKeyController;
