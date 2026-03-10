const StaffAvailability = require("../models/staffAvailability.model");
const Staff = require("../models/staff.model");
const { Op } = require("sequelize");

const getBusinessId = (req) => {
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const staffAvailabilityController = {
    create: async (req, res) => {
        try {
            const { staff_id, day_of_week, start_time, end_time, location_id } = req.body;
            
            // Overlap check: Find any slot on the same day for this staff where (newStart < existingEnd AND newEnd > existingStart)
            const clash = await StaffAvailability.findOne({
                where: {
                    staff_id,
                    day_of_week,
                    status: true,
                    [Op.and]: [
                        { start_time: { [Op.lt]: end_time } },
                        { end_time: { [Op.gt]: start_time } }
                    ]
                }
            });

            if (clash) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Timing clash! This staff is already scheduled from ${clash.start_time} to ${clash.end_time} on ${day_of_week}.` 
                });
            }

            const row = await StaffAvailability.create(req.body);
            res.status(201).json({ success: true, message: "StaffAvailability created successfully", data: row });
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

            // Get staff IDs belonging to this business
            const businessStaff = await Staff.findAll({
                where: { business_id, status: true },
                attributes: ['id']
            });
            const staffIds = businessStaff.map(s => s.id);

            // Return empty if no staff (prevents leak with empty Op.in)
            if (staffIds.length === 0) {
                return res.json({
                    success: true,
                    message: "StaffAvailabilities fetched successfully",
                    totalRecords: 0,
                    totalPages: 0,
                    currentPage: page,
                    data: []
                });
            }

            const { count, rows } = await StaffAvailability.findAndCountAll({
                where: { status: true, staff_id: { [Op.in]: staffIds } },
                limit,
                offset
            });

            res.json({
                success: true,
                message: "StaffAvailabilities fetched successfully",
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
            const row = await StaffAvailability.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "StaffAvailability not found" });
            res.json({ success: true, message: "StaffAvailability fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await StaffAvailability.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "StaffAvailability not found" });
            
            const { staff_id, day_of_week, start_time, end_time } = { ...row.toJSON(), ...req.body };
            
            // Overlap check (excluding current record)
            const clash = await StaffAvailability.findOne({
                where: {
                    id: { [Op.ne]: req.params.id },
                    staff_id,
                    day_of_week,
                    status: true,
                    [Op.and]: [
                        { start_time: { [Op.lt]: end_time } },
                        { end_time: { [Op.gt]: start_time } }
                    ]
                }
            });

            if (clash) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Timing clash! This staff is already scheduled from ${clash.start_time} to ${clash.end_time} on ${day_of_week}.` 
                });
            }

            await row.update(req.body);
            res.json({ success: true, message: "StaffAvailability updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await StaffAvailability.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "StaffAvailability not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "StaffAvailability deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = staffAvailabilityController;
