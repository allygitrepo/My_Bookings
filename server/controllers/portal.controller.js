const { User, Business, Booking, Payment, Customer, Service, Package, UserSubscription } = require("../models/associations");
const bcrypt = require("bcryptjs");

const portalController = {
    dashboard: async (req, res) => {
        try {
            const [totalBusinesses, totalUsers, totalBookings, payments, subscriptions] = await Promise.all([
                Business.count({ where: { status: true } }),
                User.count({ where: { status: true } }),
                Booking.count(),
                Payment.findAll({ where: { status: true } }),
                UserSubscription.findAll({ where: { status: 'active' } })
            ]);

            const bookingRevenue = (payments || [])
                .filter(p => p.payment_status === true || p.payment_status === 1)
                .reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);

            const subscriptionRevenue = (subscriptions || [])
                .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

            res.json({
                success: true,
                data: {
                    totalBusinesses,
                    totalUsers,
                    totalBookings,
                    bookingRevenue,
                    subscriptionRevenue,
                    totalRevenue: bookingRevenue + subscriptionRevenue
                }
            });
        } catch (error) {
            console.error('Portal Dashboard Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getPayments: async (req, res) => {
        try {
            const rows = await UserSubscription.findAll({
                include: [
                    { model: User, attributes: ['name', 'email'] },
                    { model: Package, as: 'package', attributes: ['name'] }
                ],
                order: [['created_at', 'DESC']]
            });
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Portal Payments Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    businesses: async (req, res) => {
        try {
            const rows = await Business.findAll({
                include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }],
                order: [['created_at', 'DESC']]
            });
            
            // Note: Since multi-tenancy logic was added previously, 
            // the Business model might have associations. 
            // We'll calculate booking counts manually if needed or via aggregation.
            
            const data = await Promise.all(rows.map(async (biz) => {
                const bookingCount = await Booking.count({ where: { business_id: biz.id } });
                return {
                    ...biz.toJSON(),
                    bookingCount
                };
            }));

            res.json({ success: true, data });
        } catch (error) {
            console.error('Portal Businesses Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    bookings: async (req, res) => {
        try {
            const rows = await Booking.findAll({
                include: [
                    { model: Business, attributes: ['business_name'] },
                    { model: Customer, attributes: ['name'] },
                    { model: Service, attributes: ['service_name', 'price'] }
                ],
                order: [['booking_date', 'DESC'], ['start_time', 'DESC']]
            });
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Portal Bookings Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    users: async (req, res) => {
        try {
            const rows = await User.findAll({
                include: [
                    { model: Package, as: 'package', attributes: ['name'] },
                    { 
                        model: UserSubscription, 
                        as: 'subscriptions', 
                        limit: 1, 
                        order: [['created_at', 'DESC']],
                        attributes: ['razorpay_payment_id']
                    }
                ],
                order: [['created_at', 'DESC']]
            });
            res.json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    createAdmin: async (req, res) => {
        try {
            const { name, email, password } = req.body;
            
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                name,
                email,
                password: hashedPassword,
                role: 'PORTAL_ADMIN',
                status: true
            });

            res.status(201).json({ 
                success: true, 
                message: "Portal Admin created successfully", 
                data: { id: newUser.id, name: newUser.name, email: newUser.email } 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    manageUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, suspended_reason } = req.body;

            // Prevent portal admins from suspending themselves
            if (req.user.user_id === parseInt(id)) {
                return res.status(400).json({ success: false, message: "You cannot suspend your own account." });
            }

            const user = await User.findByPk(id);
            if (!user) return res.status(404).json({ success: false, message: "User not found" });

            await user.update({ status, suspended_reason: status ? null : suspended_reason });

            // Mock Notification
            if (!status) {
                console.log(`[NOTIFICATION] Sending suspension notice to user ${user.email}. Reason: ${suspended_reason}`);
            } else {
                console.log(`[NOTIFICATION] Sending activation notice to user ${user.email}.`);
            }

            res.json({ 
                success: true, 
                message: `User ${status ? 'activated' : 'suspended'} successfully`,
                data: user
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    manageBusiness: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, suspended_reason } = req.body; // true = active, false = suspended/blocked
            const biz = await Business.findByPk(id);
            if (!biz) return res.status(404).json({ success: false, message: "Business not found" });

            await biz.update({ status, suspended_reason: status ? null : suspended_reason });

            // Mock Notification
            const owner = await User.findByPk(biz.owner_id);
            if (owner) {
                if (!status) {
                    console.log(`[NOTIFICATION] Sending suspension notice to business owner ${owner.email} for business ${biz.business_name}. Reason: ${suspended_reason}`);
                } else {
                    console.log(`[NOTIFICATION] Sending activation notice to business owner ${owner.email} for business ${biz.business_name}.`);
                }
            }

            res.json({ success: true, message: `Business ${status ? 'activated' : 'suspended'} successfully` });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getAnalytics: async (req, res) => {
        try {
            const { type, startDate, endDate } = req.query;
            const { sequelize } = require("../config/db");
            const { Op } = require("sequelize");

            let whereCondition = {};
            if (startDate && endDate) {
                // Ensure dates cover the full day
                whereCondition.created_at = {
                    [Op.between]: [
                        new Date(new Date(startDate).setHours(0, 0, 0, 0)),
                        new Date(new Date(endDate).setHours(23, 59, 59, 999))
                    ]
                };
            }

            if (type === 'interaction') {
                const users = await User.findAll({
                    attributes: [
                        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                    ],
                    where: { ...whereCondition, role: 'OWNER' },
                    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
                    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
                });

                const bookings = await Booking.findAll({
                    attributes: [
                        [sequelize.fn('DATE', sequelize.col('bookings.created_at')), 'date'],
                        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('business.user_id'))), 'count']
                    ],
                    include: [{
                        model: Business,
                        attributes: [],
                        required: true
                    }],
                    where: {
                        'created_at': whereCondition.created_at || { [Op.ne]: null }
                    },
                    group: [sequelize.fn('DATE', sequelize.col('bookings.created_at'))],
                    order: [[sequelize.fn('DATE', sequelize.col('bookings.created_at')), 'ASC']]
                });

                return res.json({ success: true, data: { users, bookings } });
            } else if (type === 'revenue') {
                const payments = await Payment.findAll({
                    attributes: [
                        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                        [sequelize.fn('SUM', sequelize.col('paid_amount')), 'amount']
                    ],
                    where: {
                        ...whereCondition,
                        [Op.or]: [{ payment_status: true }, { payment_status: 1 }]
                    },
                    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
                    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
                });

                const subscriptions = await UserSubscription.findAll({
                    attributes: [
                        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                        [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
                    ],
                    where: { ...whereCondition, status: 'active' },
                    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
                    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
                });

                return res.json({ success: true, data: { payments, subscriptions } });
            }

            res.status(400).json({ success: false, message: "Invalid analytics type" });
        } catch (error) {
            console.error('Portal Analytics Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = portalController;
