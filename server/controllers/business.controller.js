const { Op } = require("sequelize");
const Business = require("../models/business.model");
const User = require("../models/user.model");
const Location = require("../models/location.model");
const slugify = require("../uttils/slugify");
const whatsappService = require("../services/whatsapp.service");


// Helper to ensure slug uniqueness
const generateUniqueSlug = async (name, excludeId = null) => {
    let slug = slugify(name);
    let uniqueSlug = slug;
    let count = 1;

    while (true) {
        const whereClause = { slug: uniqueSlug };
        if (excludeId) whereClause.id = { [Op.ne]: excludeId };

        const existing = await Business.findOne({ where: whereClause });
        if (!existing) break;

        uniqueSlug = `${slug}-${count}`;
        count++;
    }
    return uniqueSlug;
};

const businessController = {
    create: async (req, res) => {
        try {
            const slug = await generateUniqueSlug(req.body.business_name);
            const row = await Business.create({
                ...req.body,
                slug,
                user_id: req.user.user_id  // Always enforce from JWT
            });

            // If it's a single location business, auto-create the location record
            if (!row.has_multiple_locations && row.address) {
                await Location.create({
                    business_id: row.id,
                    location_name: row.business_name, // Use Business Name as requested
                    address: row.address,
                    city: row.city,
                    state: row.state,
                    location_type: row.location_type || 'Physical',
                    meeting_link: row.meeting_link
                });
            }

            res.status(201).json({ success: true, message: "Business created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const whereClause = {};
            // Widget: filter by specific business id and MUST be active
            if (req.isWidget) {
                whereClause.status = true;
                whereClause.id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Portal Admin sees all
            } else {
                // Owners see all their businesses (active or suspended)
                whereClause.user_id = req.user?.user_id ?? -1;
            }

            const { count, rows } = await Business.findAndCountAll({
                where: whereClause,
                include: [{ model: User, as: 'owner', attributes: ['name', 'email', 'profile_picture'] }],
                limit,
                offset
            });

            // Migration/Sync: For businesses without the flag, check if they have multiple locations
            for (let biz of rows) {
                if (biz.has_multiple_locations === null || biz.has_multiple_locations === false) {
                    const locCount = await Location.count({ where: { business_id: biz.id, status: true } });
                    if (locCount > 1) {
                        await biz.update({ has_multiple_locations: true });
                    }
                }
            }

            res.json({
                success: true,
                message: "Businesses fetched successfully",
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
            const whereClause = { id: req.params.id };
            if (req.isWidget) {
                whereClause.status = true;
            } else if (req.user) {
                if (req.user.role !== 'PORTAL_ADMIN') {
                    whereClause.user_id = req.user.user_id;
                }
            }

            const row = await Business.findOne({
                where: whereClause,
                include: [{ model: User, as: 'owner', attributes: ['name', 'email', 'profile_picture'] }]
            });
            if (!row) return res.status(404).json({ success: false, message: "Business not found" });
            res.json({ success: true, message: "Business fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getBySlug: async (req, res) => {
        try {
            const { slug } = req.params;
            const business = await Business.findOne({
                where: { slug, status: true, website_enabled: true },
                include: [{ model: User, as: 'owner', attributes: ['name', 'email', 'profile_picture'] }]
            });

            if (!business) {
                return res.status(404).json({ success: false, message: "Website not found or disabled" });
            }

            // We use the associated models as well (locations, services)
            const Location = require("../models/location.model");
            const Service = require("../models/service.model");

            const [locations, services] = await Promise.all([
                Location.findAll({ where: { business_id: business.id, status: true } }),
                Service.findAll({ where: { business_id: business.id, status: true } })
            ]);

            res.json({
                success: true,
                message: "Public business data fetched",
                data: {
                    business,
                    locations,
                    services
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getPublicById: async (req, res) => {
        try {
            const { id } = req.params;
            const business = await Business.findOne({
                where: { id, status: true, website_enabled: true },
                include: [{ model: User, as: 'owner', attributes: ['name', 'email', 'profile_picture'] }]
            });

            if (!business) {
                return res.status(404).json({ success: false, message: "Website not found or disabled" });
            }

            const Location = require("../models/location.model");
            const Service = require("../models/service.model");

            const [locations, services] = await Promise.all([
                Location.findAll({ where: { business_id: business.id, status: true } }),
                Service.findAll({ where: { business_id: business.id, status: true } })
            ]);

            res.json({
                success: true,
                message: "Public business data fetched by ID",
                data: {
                    business,
                    locations,
                    services
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getPublicUsage: async (req, res) => {
        try {
            const subscriptionGuard = require("../utils/subscriptionGuard");
            const subscriptionStatus = await subscriptionGuard.canAcceptBookingByBusiness(req.params.id);
            res.json({ success: true, ...subscriptionStatus });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const whereClause = { id: req.params.id, status: true };
            if (!req.isWidget && req.user) {
                if (req.user.role !== 'PORTAL_ADMIN') {
                    whereClause.user_id = req.user.user_id;
                }
            }

            const row = await Business.findOne({
                where: whereClause,
                include: [{ model: User, as: 'owner', attributes: ['name', 'email', 'profile_picture'] }]
            });
            if (!row) return res.status(404).json({ success: false, message: "Business not found" });

            const { user_id, ...safeBody } = req.body; // prevent overwriting user_id

            // Regenerate slug if name changed or if it was null
            if (safeBody.business_name && (safeBody.business_name !== row.business_name || !row.slug)) {
                safeBody.slug = await generateUniqueSlug(safeBody.business_name, row.id);
            }

            await row.update(safeBody);

            // If it's single location, sync the location record
            if (!row.has_multiple_locations && (safeBody.address || safeBody.city || safeBody.state || safeBody.business_name)) {
                const mainLoc = await Location.findOne({ where: { business_id: row.id, status: true } });
                if (mainLoc) {
                    await mainLoc.update({
                        location_name: row.business_name,
                        address: row.address,
                        city: row.city,
                        state: row.state,
                        location_type: row.location_type || 'Physical',
                        meeting_link: row.meeting_link
                    });
                } else {
                    // Fallback create if somehow missing
                    await Location.create({
                        business_id: row.id,
                        location_name: row.business_name,
                        address: row.address,
                        city: row.city,
                        state: row.state,
                        location_type: row.location_type || 'Physical',
                        meeting_link: row.meeting_link
                    });
                }
            }

            res.json({ success: true, message: "Business updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const whereClause = { id: req.params.id, status: true };
            if (!req.isWidget && req.user) {
                if (req.user.role !== 'PORTAL_ADMIN') {
                    whereClause.user_id = req.user.user_id;
                }
            }

            const row = await Business.findOne({ where: whereClause });
            if (!row) return res.status(404).json({ success: false, message: "Business not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "Business deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    initiateWhatsApp: async (req, res) => {
        try {
            const { id } = req.params;
            const business = await Business.findOne({ where: { id, user_id: req.user.user_id } });
            if (!business) return res.status(404).json({ success: false, message: "Business not found" });

            // Check if package allows WhatsApp
            const canUse = await whatsappService.canUseWhatsApp(id);
            if (!canUse) return res.status(403).json({ success: false, message: "Your current package does not support WhatsApp notifications." });

            // Ignore old manual keys (starting with Mybookings_) to trigger a fresh server-generated handshake
            let keyToPass = business.whatsapp_instance_key;
            if (keyToPass && keyToPass.startsWith('Mybookings_')) {
                keyToPass = null;
            }

            const data = await whatsappService.initiateInstance(keyToPass, business.business_name);

            // Save instanceKey if it's new (Step 1 returned it)
            if (data.success && data.instanceKey && data.instanceKey !== business.whatsapp_instance_key) {
                await business.update({ whatsapp_instance_key: data.instanceKey });
            }

            // If status is connected, update DB
            if (data.status === 'connected') {
                await business.update({ whatsapp_connected: true });
            } else {
                await business.update({ whatsapp_connected: false });
            }

            // Explicitly pass through profile data if available
            res.json({
                ...data,
                profileImage: data.profileImage || data.profile_picture || null,
                name: data.name || data.pushname || null,
                phone: data.phone || data.phonenumber || null
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getWhatsAppStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const business = await Business.findOne({ where: { id, user_id: req.user.user_id } });
            if (!business || !business.whatsapp_instance_key) {
                return res.json({ success: false, status: 'disconnected', message: "WhatsApp not linked" });
            }

            const data = await whatsappService.getInstanceStatus(business.whatsapp_instance_key);

            // Sync DB status
            if (data.success) {
                const isConnected = data.status === 'connected';
                if (isConnected !== business.whatsapp_connected) {
                    await business.update({ whatsapp_connected: isConnected });
                }
            }

            // Explicitly pass through profile data if available
            res.json({
                ...data,
                profileImage: data.profileImage || data.profile_picture || null,
                name: data.name || data.pushname || null,
                phone: data.phone || data.phonenumber || null
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    disconnectWhatsApp: async (req, res) => {
        try {
            const { id } = req.params;
            const business = await Business.findOne({ where: { id, user_id: req.user.user_id } });
            if (!business) return res.status(404).json({ success: false, message: "Business not found" });

            // Delete from gateway if key exists
            if (business.whatsapp_instance_key) {
                try {
                    await whatsappService.deleteInstance(business.whatsapp_instance_key);
                } catch (apiError) {
                    console.error('[WhatsApp] Gateway deletion failed:', apiError.message);
                    // Continue to clear local DB even if gateway call fails
                }
            }

            // Clear the key from DB
            await business.update({
                whatsapp_instance_key: null,
                whatsapp_connected: false
            });

            res.json({ success: true, message: "WhatsApp disconnected successfully." });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};


module.exports = businessController;
