const { ServiceType, Business } = require("../models/associations");
const { Op } = require("sequelize");

const getBusinessId = (req) => {
    if (req.body?.business_id) return req.body.business_id;
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const serviceTypeController = {
    getAll: async (req, res) => {
        try {
            const whereClause = { status: true };

            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Admin sees all
            } else if (req.user?.user_id) {
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                const businessIds = businesses.map(b => b.id);
                whereClause.business_id = { [Op.in]: businessIds.length > 0 ? businessIds : [-1] };
            } else {
                whereClause.business_id = -1;
            }

            const rows = await ServiceType.findAll({
                where: whereClause,
                order: [['name', 'ASC']]
            });

            res.json({ success: true, message: "Service types fetched successfully", data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            if (business_id === -1) return res.status(403).json({ success: false, message: "No business associated with your account." });

            const { name } = req.body;
            if (!name || !name.trim()) {
                return res.status(400).json({ success: false, message: "Service type name is required." });
            }

            const cleanName = name.trim();

            let row = await ServiceType.findOne({
                where: { business_id, name: cleanName, status: true }
            });

            if (!row) {
                row = await ServiceType.create({
                    business_id,
                    name: cleanName,
                    status: true
                });
            }

            res.status(201).json({ success: true, message: "Service type created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const row = await ServiceType.findOne({ where: { id: req.params.id, status: true } });
            if (!row) return res.status(404).json({ success: false, message: "Service type not found" });

            await row.update({ status: false });
            res.json({ success: true, message: "Service type deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = serviceTypeController;
