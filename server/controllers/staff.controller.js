const Staff = require("../models/staff.model");

// Returns business_id for the current requester. Returns -1 if unknown (prevents leak).
const getBusinessId = (req) => {
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const staffController = {
    create: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            if (business_id === -1) return res.status(403).json({ success: false, message: "No business associated with your account." });
            const row = await Staff.create({ ...req.body, business_id });
            res.status(201).json({ success: true, message: "Staff created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            const business_id = getBusinessId(req);

            const { count, rows } = await Staff.findAndCountAll({
                where: { status: true, business_id },
                limit,
                offset
            });

            res.json({
                success: true,
                message: "Staff fetched successfully",
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
            const business_id = getBusinessId(req);
            const row = await Staff.findOne({ where: { id: req.params.id, status: true, business_id } });
            if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
            res.json({ success: true, message: "Staff fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            const row = await Staff.findOne({ where: { id: req.params.id, status: true, business_id } });
            if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
            const { business_id: _, ...safeBody } = req.body;
            await row.update(safeBody);
            res.json({ success: true, message: "Staff updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            const row = await Staff.findOne({ where: { id: req.params.id, status: true, business_id } });
            if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "Staff deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = staffController;
