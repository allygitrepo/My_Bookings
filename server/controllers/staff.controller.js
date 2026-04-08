const { Staff, Location, Business } = require("../models/associations");
const StaffLocation = require("../models/staffLocation.model");

// Returns business_id for the current requester. Returns -1 if unknown (prevents leak).
const getBusinessId = (req) => {
    if (req.body?.business_id) return req.body.business_id;
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const staffController = {
    create: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            if (business_id === -1) return res.status(403).json({ success: false, message: "No business associated with your account." });
            
            const { location_ids, ...staffData } = req.body;
            
            const row = await Staff.create({ ...staffData, business_id });
            
            if (location_ids && Array.isArray(location_ids)) {
                const locs = location_ids.map(locId => ({
                    staff_id: row.id,
                    location_id: locId
                }));
                await StaffLocation.bulkCreate(locs);
            }
            
            res.status(201).json({ success: true, message: "Staff created successfully", data: row });
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: "A staff member with this name already exists in your business." });
            }
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
            } else if (req.user?.user_id) {
                // Fetch all businesses owned by this user
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                const businessIds = businesses.map(b => b.id);
                whereClause.business_id = businessIds.length > 0 ? businessIds : -1;
            } else {
                whereClause.business_id = -1;
            }

            const { count, rows } = await Staff.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Location,
                        as: 'locations',
                        attributes: ['id', 'location_name'],
                        through: { attributes: [] }
                    },
                    {
                        model: Business,
                        attributes: ['business_name']
                    }
                ],
                distinct: true,
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
            const whereClause = { id: req.params.id, status: true };
            
            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.user_id) {
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Staff.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
            res.json({ success: true, message: "Staff fetched successfully", data: row });
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
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Staff.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
            
            const { business_id: _, location_ids, ...safeBody } = req.body;
            if (req.body.business_id) {
                safeBody.business_id = req.body.business_id;
            }

            await row.update(safeBody);
            
            if (location_ids && Array.isArray(location_ids)) {
                // Remove old assignments and add new ones
                await StaffLocation.destroy({ where: { staff_id: row.id } });
                const locs = location_ids.map(locId => ({
                    staff_id: row.id,
                    location_id: locId
                }));
                await StaffLocation.bulkCreate(locs);
            }
            
            res.json({ success: true, message: "Staff updated successfully", data: row });
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: "A staff member with this name already exists in your business." });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const whereClause = { id: req.params.id, status: true };
            
            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.user_id) {
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Staff.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
            
            await row.update({ status: false });
            res.json({ success: true, message: "Staff deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = staffController;
