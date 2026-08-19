const { Service, Business, ServiceType, ServiceTypeMapping } = require("../models/associations");
const { Op } = require("sequelize");

const getBusinessId = (req) => {
    if (req.body?.business_id) return req.body.business_id;
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

const syncServiceTypes = async (service_id, business_id, service_types_input) => {
    if (service_types_input === undefined) return;

    let typeInputs = [];
    if (Array.isArray(service_types_input)) {
        typeInputs = service_types_input;
    } else if (typeof service_types_input === 'string' && service_types_input.trim()) {
        typeInputs = service_types_input.split(',').map(t => t.trim()).filter(Boolean);
    }

    const typeIds = [];
    const typeNames = [];

    for (const item of typeInputs) {
        if (!item) continue;
        let typeObj = null;
        if (typeof item === 'number' || (!isNaN(item) && Number.isInteger(Number(item)) && String(item).length < 15)) {
            typeObj = await ServiceType.findOne({ where: { id: Number(item), status: true } });
        } else if (typeof item === 'object' && item.id) {
            typeObj = await ServiceType.findOne({ where: { id: item.id, status: true } });
        } else {
            const nameStr = String(item.name || item).trim();
            if (!nameStr) continue;
            [typeObj] = await ServiceType.findOrCreate({
                where: { business_id, name: nameStr, status: true },
                defaults: { business_id, name: nameStr, status: true }
            });
        }
        if (typeObj) {
            typeIds.push(typeObj.id);
            typeNames.push(typeObj.name);
        }
    }

    // Clear old mappings & add new ones
    await ServiceTypeMapping.destroy({ where: { service_id } });

    if (typeIds.length > 0) {
        const mappings = typeIds.map(type_id => ({
            service_id,
            service_type_id: type_id
        }));
        await ServiceTypeMapping.bulkCreate(mappings);
    }

    // Also update string column on Service table for fast queries/backward compatibility
    const joinedNames = typeNames.join(', ') || null;
    await Service.update({ service_type: joinedNames }, { where: { id: service_id } });
};

const serviceController = {
    create: async (req, res) => {
        try {
            const business_id = getBusinessId(req);
            if (business_id === -1) return res.status(403).json({ success: false, message: "No business associated with your account." });

            const minCharge = (req.body.minimum_booking_charge !== '' && req.body.minimum_booking_charge !== null && req.body.minimum_booking_charge !== undefined) ? Number(req.body.minimum_booking_charge) : 0;
            
            const row = await Service.create({
                ...req.body,
                minimum_booking_charge: minCharge,
                business_id
            });

            if (req.body.service_type || req.body.service_type_ids) {
                await syncServiceTypes(row.id, business_id, req.body.service_type_ids || req.body.service_type);
            }

            const updatedRow = await Service.findOne({
                where: { id: row.id },
                include: [{ model: ServiceType, as: 'serviceTypes', attributes: ['id', 'name'], through: { attributes: [] } }]
            });

            res.status(201).json({ success: true, message: "Service created successfully", data: updatedRow });
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
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                const businessIds = businesses.map(b => b.id);
                whereClause.business_id = { [Op.in]: businessIds.length > 0 ? businessIds : [-1] };
            } else {
                whereClause.business_id = -1;
            }

            const { count, rows } = await Service.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: ServiceType,
                        as: 'serviceTypes',
                        attributes: ['id', 'name'],
                        through: { attributes: [] }
                    }
                ],
                distinct: true,
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
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Service.findOne({
                where: whereClause,
                include: [
                    {
                        model: ServiceType,
                        as: 'serviceTypes',
                        attributes: ['id', 'name'],
                        through: { attributes: [] }
                    }
                ]
            });

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
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                whereClause.business_id = businesses.map(b => b.id);
            }

            const row = await Service.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Service not found" });

            const { business_id: _, ...safeBody } = req.body;
            if (req.body.business_id) {
                safeBody.business_id = req.body.business_id;
            }
            if (safeBody.minimum_booking_charge !== undefined) {
                safeBody.minimum_booking_charge = (safeBody.minimum_booking_charge !== '' && safeBody.minimum_booking_charge !== null) ? Number(safeBody.minimum_booking_charge) : 0;
            }

            await row.update(safeBody);

            if (req.body.service_type !== undefined || req.body.service_type_ids !== undefined) {
                await syncServiceTypes(row.id, row.business_id, req.body.service_type_ids !== undefined ? req.body.service_type_ids : req.body.service_type);
            }

            const updatedRow = await Service.findOne({
                where: { id: row.id },
                include: [{ model: ServiceType, as: 'serviceTypes', attributes: ['id', 'name'], through: { attributes: [] } }]
            });

            res.json({ success: true, message: "Service updated successfully", data: updatedRow });
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
