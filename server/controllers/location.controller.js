const Location = require("../models/location.model");

const locationController = {
    create: async (req, res) => {
        try {
            const row = await Location.create(req.body);
            res.status(201).json({ success: true, message: "Location created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const { count, rows } = await Location.findAndCountAll({
                where: { status: true },
                limit,
                offset
            });

            res.json({
                success: true,
                message: "Locations fetched successfully",
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
            const row = await Location.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Location not found" });
            res.json({ success: true, message: "Location fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await Location.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Location not found" });
            await row.update(req.body);
            res.json({ success: true, message: "Location updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await Location.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Location not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "Location deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = locationController;
