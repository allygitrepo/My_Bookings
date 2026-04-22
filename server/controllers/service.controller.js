const Service = require("../models/service.model");
const { Op } = require("sequelize");

const getBusinessId = (req) => {
    if (req.body?.business_id) return req.body.business_id;
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const serviceController = {
    create: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            if (business_id === -1) return res.status(403).json({ success: false, message: "No business associated with your account." });
            const row = await Service.create({ ...req.body, business_id });
            res.status(201).json({ success: true, message: "Service created successfully", data: row });
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

            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Bypass filter for Portal Admin
            } else if (req.user?.user_id) {
                // Fetch all businesses owned by this user
                const Business = require("../models/business.model");
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                const businessIds = businesses.map(b => b.id);
                whereClause.business_id = { [Op.in]: businessIds.length > 0 ? businessIds : [-1] };
            } else {
                whereClause.business_id = -1;
            }

            const { count, rows } = await Service.findAndCountAll({
                where: whereClause,
                limit,
                offset
            });

            res.json({
                success: true,
                message: "Services fetched successfully",
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
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Bypass filter for Portal Admin
            } else if (req.user?.user_id) {
                const Business = require("../models/business.model");
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Service.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Service not found" });
            res.json({ success: true, message: "Service fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const whereClause = { id: req.params.id, status: true };
            
            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Bypass filter for Portal Admin
            } else if (req.user?.user_id) {
                const Business = require("../models/business.model");
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Service.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Service not found" });
            
            const { business_id: _, ...safeBody } = req.body;
            if (req.body.business_id) {
                safeBody.business_id = req.body.business_id;
            }

            await row.update(safeBody);
            res.json({ success: true, message: "Service updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const whereClause = { id: req.params.id, status: true };
            
            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Bypass filter for Portal Admin
            } else if (req.user?.user_id) {
                const Business = require("../models/business.model");
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Service.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Service not found" });
            
            await row.update({ status: false });
            res.json({ success: true, message: "Service deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = serviceController;
