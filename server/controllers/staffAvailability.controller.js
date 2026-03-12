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
            const { staff_id, day_of_week, start_time, end_time } = req.body;
            
            const existing = await StaffAvailability.findAll({
                where: { staff_id, day_of_week, status: true }
            });

            const newSlot = { start_time, end_time };
            const clash = existing.find(ex => {
                const s1 = { start_time: newSlot.start_time, end_time: newSlot.end_time };
                const s2 = { start_time: ex.start_time, end_time: ex.end_time };
                
                const getI = (s) => (s.start_time < s.end_time ? [[s.start_time, s.end_time]] : [[s.start_time, '23:59:59'], ['00:00:00', s.end_time]]);
                const i1 = getI(s1);
                const i2 = getI(s2);

                return i1.some(([s1s, s1e]) => i2.some(([s2s, s2e]) => s1s < s2e && s1e > s2s));
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
    bulkCreate: async (req, res) => {
        try {
            const records = req.body; // Array of availability records
            if (!Array.isArray(records) || records.length === 0) {
                return res.status(400).json({ success: false, message: "Invalid records provided" });
            }

            // Simple validation: check for internal overlaps in the batch
            for (let i = 0; i < records.length; i++) {
                for (let j = i + 1; j < records.length; j++) {
                    const r1 = records[i];
                    const r2 = records[j];
                    if (r1.day_of_week === r2.day_of_week) {
                        const getI = (s) => (s.start_time < s.end_time ? [[s.start_time, s.end_time]] : [[s.start_time, '23:59:59'], ['00:00:00', s.end_time]]);
                        if (getI(r1).some(([s1s, s1e]) => getI(r2).some(([s2s, s2e]) => s1s < s2e && s1e > s2s))) {
                            return res.status(400).json({ success: false, message: "Internal clash detected in the provided schedule" });
                        }
                    }
                }
            }

            const rows = await StaffAvailability.bulkCreate(records);
            res.status(201).json({ success: true, message: "StaffAvailabilities created successfully", data: rows });
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
            
            const updatedData = { ...row.toJSON(), ...req.body };
            const { staff_id, day_of_week, start_time, end_time } = updatedData;
            
            const existing = await StaffAvailability.findAll({
                where: { 
                    staff_id, 
                    day_of_week, 
                    status: true,
                    id: { [Op.ne]: req.params.id }
                }
            });

            const clash = existing.find(ex => {
                const s1 = { start_time, end_time };
                const s2 = { start_time: ex.start_time, end_time: ex.end_time };
                
                const getI = (s) => (s.start_time < s.end_time ? [[s.start_time, s.end_time]] : [[s.start_time, '23:59:59'], ['00:00:00', s.end_time]]);
                const i1 = getI(s1);
                const i2 = getI(s2);

                return i1.some(([s1s, s1e]) => i2.some(([s2s, s2e]) => s1s < s2e && s1e > s2s));
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
    },
    deleteByStaff: async (req, res) => {
        try {
            const { staff_id } = req.params;
            await StaffAvailability.update({ status: false }, { where: { staff_id } });
            res.json({ success: true, message: "StaffAvailabilities deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = staffAvailabilityController;
