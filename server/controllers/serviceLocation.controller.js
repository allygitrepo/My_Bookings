const ServiceLocation = require("../models/serviceLocation.model");
const Service = require("../models/service.model");
const { Op } = require("sequelize");

const getBusinessId = (req) => {
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const serviceLocationController = {
    create: async (req, res) => {
        try {
            const row = await ServiceLocation.create(req.body);
            res.status(201).json({ success: true, message: "ServiceLocation created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 200;
            const offset = (page - 1) * limit;
            const business_id = getBusinessId(req);

            const businessServices = await Service.findAll({
                where: { business_id, status: true },
                attributes: ['id']
            });
            const serviceIds = businessServices.map(s => s.id);

            if (serviceIds.length === 0) {
                return res.json({
                    success: true,
                    message: "ServiceLocations fetched successfully",
                    totalRecords: 0,
                    totalPages: 0,
                    currentPage: page,
                    data: []
                });
            }

            const { count, rows } = await ServiceLocation.findAndCountAll({
                where: { status: true, service_id: { [Op.in]: serviceIds } },
                limit,
                offset
            });

            res.json({
                success: true,
                message: "ServiceLocations fetched successfully",
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
            const row = await ServiceLocation.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "ServiceLocation not found" });
            res.json({ success: true, message: "ServiceLocation fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await ServiceLocation.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "ServiceLocation not found" });
            await row.update(req.body);
            res.json({ success: true, message: "ServiceLocation updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await ServiceLocation.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "ServiceLocation not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "ServiceLocation deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = serviceLocationController;
