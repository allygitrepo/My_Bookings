const BusinessClosure = require("../models/businessClosure.model");
const Business = require("../models/business.model");
const { Op } = require("sequelize");

const getBusinessId = (req) => {
    if (req.body?.business_id) return req.body.business_id;
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const businessClosureController = {
    create: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            if (business_id === -1) {
                return res.status(403).json({ success: false, message: "No business associated with your request." });
            }

            const { title, start_date, end_date, start_time, end_time, is_all_day, reason } = req.body;

            if (!title || !start_date || !end_date) {
                return res.status(400).json({ success: false, message: "Title, start date, and end date are required." });
            }

            if (new Date(start_date) > new Date(end_date)) {
                return res.status(400).json({ success: false, message: "Start date cannot be after end date." });
            }

            // Check for duplicate / overlapping active closure for this business
            const existingClosure = await BusinessClosure.findOne({
                where: {
                    business_id,
                    status: true,
                    start_date: { [Op.lte]: end_date },
                    end_date: { [Op.gte]: start_date }
                }
            });

            if (existingClosure) {
                return res.status(400).json({
                    success: false,
                    message: `A business closure already exists covering ${existingClosure.start_date} to ${existingClosure.end_date} (${existingClosure.title}).`
                });
            }

            const row = await BusinessClosure.create({
                business_id,
                title,
                start_date,
                end_date,
                start_time: is_all_day ? null : start_time,
                end_time: is_all_day ? null : end_time,
                is_all_day: is_all_day !== undefined ? is_all_day : true,
                reason,
                status: true
            });

            res.status(201).json({ success: true, message: "Business closure created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const whereClause = { status: true };

            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Admin sees all
            } else if (req.user?.user_id) {
                const businesses = await Business.findAll({
                    where: { user_id: req.user.user_id, status: true },
                    attributes: ['id']
                });
                const businessIds = businesses.map(b => b.id);
                whereClause.business_id = { [Op.in]: businessIds.length > 0 ? businessIds : [-1] };
            } else {
                whereClause.business_id = -1;
            }

            const rows = await BusinessClosure.findAll({
                where: whereClause,
                order: [['start_date', 'DESC'], ['id', 'DESC']]
            });

            res.json({
                success: true,
                message: "Business closures fetched successfully",
                data: rows
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const row = await BusinessClosure.findOne({
                where: { id: req.params.id, status: true }
            });
            if (!row) return res.status(404).json({ success: false, message: "Business closure not found" });
            res.json({ success: true, message: "Business closure fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const row = await BusinessClosure.findOne({
                where: { id: req.params.id, status: true }
            });
            if (!row) return res.status(404).json({ success: false, message: "Business closure not found" });

            const { title, start_date, end_date, start_time, end_time, is_all_day, reason } = req.body;

            if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
                return res.status(400).json({ success: false, message: "Start date cannot be after end date." });
            }

            const targetStartDate = start_date ?? row.start_date;
            const targetEndDate = end_date ?? row.end_date;

            const existingClosure = await BusinessClosure.findOne({
                where: {
                    business_id: row.business_id,
                    status: true,
                    id: { [Op.ne]: req.params.id },
                    start_date: { [Op.lte]: targetEndDate },
                    end_date: { [Op.gte]: targetStartDate }
                }
            });

            if (existingClosure) {
                return res.status(400).json({
                    success: false,
                    message: `A business closure already exists covering ${existingClosure.start_date} to ${existingClosure.end_date} (${existingClosure.title}).`
                });
            }

            await row.update({
                title: title ?? row.title,
                start_date: start_date ?? row.start_date,
                end_date: end_date ?? row.end_date,
                start_time: is_all_day ? null : (start_time ?? row.start_time),
                end_time: is_all_day ? null : (end_time ?? row.end_time),
                is_all_day: is_all_day !== undefined ? is_all_day : row.is_all_day,
                reason: reason !== undefined ? reason : row.reason
            });

            res.json({ success: true, message: "Business closure updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const row = await BusinessClosure.findOne({
                where: { id: req.params.id, status: true }
            });
            if (!row) return res.status(404).json({ success: false, message: "Business closure not found" });

            await row.update({ status: false });
            res.json({ success: true, message: "Business closure deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = businessClosureController;
