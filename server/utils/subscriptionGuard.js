const { Business, Location, Staff, Service, Booking, User, Package, UserSubscription } = require("../models/associations");
const { Op } = require("sequelize");

/**
 * Centralized utility to track resource usage and verify subscription limits.
 */
const subscriptionGuard = {
    /**
     * Calculates current resource consumption for a user.
     * @param {number} userId - The ID of the user (OWNER).
     * @returns {Promise<object>} Usage statistics and limits.
     */
    getUserUsage: async (userId) => {
        const user = await User.findByPk(userId, {
            include: [{ model: Package, as: 'package' }]
        });

        // If no user or no package, they are effectively expired
        if (!user || !user.package) {
            return {
                isExpired: true,
                expiryDate: null,
                portal_payment_charges: 0,
                limits: { bookings: 0 },
                usage: { bookings: 0 },
                flags: {
                    canAddBusiness: false,
                    canAddLocation: false,
                    canAddStaff: false,
                    canAddService: false,
                    canAcceptBooking: false,
                    isWebsiteAllowed: false,
                    isApiAllowed: false
                }
            };
        }

        const pkg = user.package;

        // 1. Get all businesses owned by this user
        const businesses = await Business.findAll({ 
            where: { user_id: userId, status: true },
            attributes: ['id']
        });
        const bizIds = businesses.map(b => b.id);

        // 2. Count Resources
        const [locationCount, staffCount, serviceCount] = await Promise.all([
            bizIds.length > 0 ? Location.count({ where: { business_id: bizIds, status: true } }) : 0,
            bizIds.length > 0 ? Staff.count({ where: { business_id: bizIds, status: true } }) : 0,
            bizIds.length > 0 ? Service.count({ where: { business_id: bizIds, status: true } }) : 0,
        ]);

        // 3. Count Bookings in the current subscription period
        // Find any most recent subscription to show expiry date
        const lastSub = await UserSubscription.findOne({
            where: { user_id: userId },
            order: [['start_date', 'DESC']]
        });

        // specifically find the active one for usage counting
        const activeSub = (lastSub && lastSub.status === 'active') ? lastSub : null;

        let bookingCount = 0;
        let isExpired = false;
        let expiryDate = lastSub ? lastSub.expiry_date : (user.package_expiry || null);

        if (bizIds.length > 0) {
            bookingCount = await Booking.count({
                where: { business_id: bizIds }
            });
        }

        if (activeSub) {
            isExpired = new Date() > new Date(expiryDate);
        } else if (user.package) {
            if (expiryDate) {
                isExpired = new Date() > new Date(expiryDate);
            }
        } else {
            isExpired = true;
        }

        const flags = {
            canAddBusiness: pkg.max_businesses === -1 || businesses.length < pkg.max_businesses,
            canAddLocation: pkg.max_locations === -1 || locationCount < pkg.max_locations,
            canAddStaff: pkg.max_staff === -1 || staffCount < pkg.max_staff,
            canAddService: pkg.max_services === -1 || serviceCount < pkg.max_services,
            canAcceptBooking: pkg.max_bookings === -1 || bookingCount < pkg.max_bookings,
            isWebsiteAllowed: pkg.allow_website_builder,
            isApiAllowed: pkg.allow_api
        };

        // If expired, override all action flags to false
        if (isExpired) {
            Object.keys(flags).forEach(key => flags[key] = false);
        }

        return {
            isExpired,
            expiryDate,
            portal_payment_charges: pkg.portal_payment_charges || 0,
            limits: {
                businesses: pkg.max_businesses,
                locations: pkg.max_locations,
                staff: pkg.max_staff,
                services: pkg.max_services,
                bookings: pkg.max_bookings,
                websiteBuilder: pkg.allow_website_builder,
                apiAccess: pkg.allow_api
            },
            usage: {
                businesses: businesses.length,
                locations: locationCount,
                staff: staffCount,
                services: serviceCount,
                bookings: bookingCount
            },
            flags
        };
    },

    /**
     * Middleware to check limits before resource creation.
     * @param {string} resource - 'business', 'location', 'staff', 'service'
     */
    limitCheck: (resource) => {
        return async (req, res, next) => {
            try {
                // Portal Admins bypass all limits
                if (req.user.role === 'PORTAL_ADMIN') return next();

                const usageData = await subscriptionGuard.getUserUsage(req.user.user_id);
                const flagMap = {
                    business: 'canAddBusiness',
                    location: 'canAddLocation',
                    staff: 'canAddStaff',
                    service: 'canAddService'
                };

                const flag = flagMap[resource];
                if (!usageData.flags[flag]) {
                    return res.status(403).json({
                        success: false,
                        message: `Subscription Limit Reached: You cannot add more ${resource}s on your current plan. Please upgrade to continue.`,
                        limitReached: true
                    });
                }
                next();
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
    },

    /**
     * Helper for public widget to check if a business can accept bookings.
     * @param {number} businessId 
     * @returns {Promise<boolean>}
     */
    canAcceptBookingByBusiness: async (businessId) => {
        try {
            const biz = await Business.findByPk(businessId);
            if (!biz) return { canAcceptBooking: false, isExpired: false };

            const usage = await subscriptionGuard.getUserUsage(biz.user_id);
            return {
                canAcceptBooking: usage.flags.canAcceptBooking,
                isExpired: usage.isExpired
            };
        } catch (error) {
            console.error('[SubscriptionGuard] canAcceptBooking error:', error.message);
            return { canAcceptBooking: false, isExpired: true };
        }
    }
};

module.exports = subscriptionGuard;
