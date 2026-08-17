const StaffLeave = require("../models/staffLeave.model");
const Staff = require("../models/staff.model");
const Business = require("../models/business.model");
const { Op } = require("sequelize");

const getBusinessId = (req) => {
    if (req.body?.business_id) return req.body.business_id;
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const staffLeaveController = {
    create: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            if (business_id === -1) {
                return res.status(403).json({ success: false, message: "No business associated with your request." });
            }

            const { staff_id, leave_type, start_date, end_date, start_time, end_time, is_all_day, approval_status, reason } = req.body;

            if (!staff_id || !start_date || !end_date) {
                return res.status(400).json({ success: false, message: "Staff member, start date, and end date are required." });
            }

            if (new Date(start_date) > new Date(end_date)) {
                return res.status(400).json({ success: false, message: "Start date cannot be after end date." });
            }

            // Verify staff belongs to this business
            const staff = await Staff.findOne({ where: { id: staff_id, status: true } });
            if (!staff) {
                return res.status(404).json({ success: false, message: "Staff member not found." });
            }

            // Check for duplicate / overlapping active leave entry for this staff member
            const existingLeave = await StaffLeave.findOne({
                where: {
                    staff_id,
                    status: true,
                    start_date: { [Op.lte]: end_date },
                    end_date: { [Op.gte]: start_date }
                }
            });

            if (existingLeave) {
                return res.status(400).json({
                    success: false,
                    message: `A leave record already exists for ${staff.staff_name} covering ${existingLeave.start_date} to ${existingLeave.end_date}.`
                });
            }

            const row = await StaffLeave.create({
                staff_id,
                business_id,
                leave_type: leave_type || 'Casual Leave',
                start_date,
                end_date,
                start_time: is_all_day ? null : start_time,
                end_time: is_all_day ? null : end_time,
                is_all_day: is_all_day !== undefined ? is_all_day : true,
                approval_status: approval_status || 'Approved',
                reason,
                status: true
            });

            const createdRecord = await StaffLeave.findByPk(row.id, {
                include: [{ model: Staff, attributes: ['id', 'staff_name', 'role', 'phone'] }]
            });

            res.status(201).json({ success: true, message: "Staff leave recorded successfully", data: createdRecord });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const whereClause = { status: true };

            if (req.query.staff_id) {
                whereClause.staff_id = req.query.staff_id;
            }

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

            const rows = await StaffLeave.findAll({
                where: whereClause,
                include: [{ model: Staff, attributes: ['id', 'staff_name', 'role', 'phone'] }],
                order: [['start_date', 'DESC'], ['id', 'DESC']]
            });

            res.json({
                success: true,
                message: "Staff leaves fetched successfully",
                data: rows
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const row = await StaffLeave.findOne({
                where: { id: req.params.id, status: true },
                include: [{ model: Staff, attributes: ['id', 'staff_name', 'role', 'phone'] }]
            });
            if (!row) return res.status(404).json({ success: false, message: "Staff leave record not found" });
            res.json({ success: true, message: "Staff leave fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const row = await StaffLeave.findOne({
                where: { id: req.params.id, status: true }
            });
            if (!row) return res.status(404).json({ success: false, message: "Staff leave record not found" });

            const { staff_id, leave_type, start_date, end_date, start_time, end_time, is_all_day, approval_status, reason } = req.body;

            if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
                return res.status(400).json({ success: false, message: "Start date cannot be after end date." });
            }

            const targetStaffId = staff_id ?? row.staff_id;
            const targetStartDate = start_date ?? row.start_date;
            const targetEndDate = end_date ?? row.end_date;

            const existingLeave = await StaffLeave.findOne({
                where: {
                    staff_id: targetStaffId,
                    status: true,
                    id: { [Op.ne]: req.params.id },
                    start_date: { [Op.lte]: targetEndDate },
                    end_date: { [Op.gte]: targetStartDate }
                }
            });

            if (existingLeave) {
                return res.status(400).json({
                    success: false,
                    message: `A leave record already exists for this staff member covering ${existingLeave.start_date} to ${existingLeave.end_date}.`
                });
            }

            await row.update({
                staff_id: staff_id ?? row.staff_id,
                leave_type: leave_type ?? row.leave_type,
                start_date: start_date ?? row.start_date,
                end_date: end_date ?? row.end_date,
                start_time: is_all_day ? null : (start_time ?? row.start_time),
                end_time: is_all_day ? null : (end_time ?? row.end_time),
                is_all_day: is_all_day !== undefined ? is_all_day : row.is_all_day,
                approval_status: approval_status ?? row.approval_status,
                reason: reason !== undefined ? reason : row.reason
            });

            const updatedRecord = await StaffLeave.findByPk(row.id, {
                include: [{ model: Staff, attributes: ['id', 'staff_name', 'role', 'phone'] }]
            });

            res.json({ success: true, message: "Staff leave updated successfully", data: updatedRecord });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const row = await StaffLeave.findOne({
                where: { id: req.params.id, status: true }
            });
            if (!row) return res.status(404).json({ success: false, message: "Staff leave record not found" });

            await row.update({ status: false });
            res.json({ success: true, message: "Staff leave deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = staffLeaveController;
