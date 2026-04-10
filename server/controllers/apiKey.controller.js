const ApiKey = require("../models/apiKey.model");
const crypto = require("crypto");

const getBusinessId = (req) => {
    if (req.body?.business_id) return req.body.business_id;
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const apiKeyController = {
    create: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            if (business_id === -1) return res.status(403).json({ success: false, message: "No business associated with your account." });
            
            // Generate API key on server if not provided (frontend might fail to generate in non-secure contexts)
            const api_key = req.body.api_key || ('pk_live_' + crypto.randomUUID().replace(/-/g, ''));
            
            const row = await ApiKey.create({ ...req.body, api_key, business_id });
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

            const whereClause = { status: true };

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

            const { count, rows } = await ApiKey.findAndCountAll({
                where: whereClause,
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
            const whereClause = { id: req.params.id, status: true };
            
            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.user_id) {
                const Business = require("../models/business.model");
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await ApiKey.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "ApiKey not found" });
            res.json({ success: true, message: "ApiKey fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const whereClause = { id: req.params.id, status: true };
            
            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.user_id) {
                const Business = require("../models/business.model");
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await ApiKey.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "ApiKey not found" });
            
            const { business_id: _, ...safeBody } = req.body;
            if (req.body.business_id) {
                safeBody.business_id = req.body.business_id;
            }

            await row.update(safeBody);
            res.json({ success: true, message: "ApiKey updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const whereClause = { id: req.params.id, status: true };
            
            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.user_id) {
                const Business = require("../models/business.model");
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await ApiKey.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "ApiKey not found" });
            
            await row.update({ status: false });
            res.json({ success: true, message: "ApiKey deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = apiKeyController;
