const StaffService = require("../models/staffService.model");
const Staff = require("../models/staff.model");
const { Op } = require("sequelize");

const getBusinessId = (req) => {
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 200;
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

            // Get staff IDs belonging to these businesses
            const businessStaff = await Staff.findAll({
                where: whereClause,
                attributes: ['id']
            });
            const staffIds = businessStaff.map(s => s.id);

            // Return empty if no staff (prevents leak with empty Op.in)
            if (staffIds.length === 0) {
                return res.json({
                    success: true,
                    message: "StaffServices fetched successfully",
                    totalRecords: 0,
                    totalPages: 0,
                    currentPage: page,
                    data: []
                });
            }

            const { count, rows } = await StaffService.findAndCountAll({
                where: { status: true, staff_id: { [Op.in]: staffIds } },
                limit,
                offset
            });

            res.json({
                success: true,
                message: "StaffServices fetched successfully",
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
