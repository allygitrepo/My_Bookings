const { Op } = require("sequelize");
const { Package, User, UserSubscription } = require("../models/associations");

const packageController = {
    getAll: async (req, res) => {
        try {
            const { activeOnly, publicOnly } = req.query;
            const where = {};
            
            // Explicitly filter for active packages if requested
            if (activeOnly === 'true' || activeOnly === true) {
                where.status = true;
            }

            // Filter out private packages if publicOnly requested or if caller is not Super Admin
            const isSuperAdmin = req.user?.role === 'PORTAL_ADMIN';
            if (publicOnly === 'true' || publicOnly === true || !isSuperAdmin) {
                where[Op.or] = [
                    { is_private: false },
                    { is_private: null }
                ];
            }

            const rows = await Package.findAll({
                where,
                order: [['amount', 'ASC']]
            });
            res.json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getAvailable: async (req, res) => {
        try {
            const userId = req.user.user_id;
            // Private packages must not show in public/user available package list
            const packages = await Package.findAll({
                where: {
                    status: true,
                    [Op.or]: [
                        { is_private: false },
                        { is_private: null }
                    ]
                },
                order: [['amount', 'ASC']]
            });

            const userSubs = await UserSubscription.findAll({
                where: { user_id: userId },
                attributes: ['package_id']
            });

            const usedPackageIds = userSubs.map(s => s.package_id);

            const data = packages.map(pkg => {
                const isAlreadyUsed = pkg.is_one_time && usedPackageIds.includes(pkg.id);
                return {
                    ...pkg.toJSON(),
                    already_used: isAlreadyUsed
                };
            });

            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const row = await Package.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Package not found" });

            const isSuperAdmin = req.user?.role === 'PORTAL_ADMIN';
            if (row.is_private && !isSuperAdmin) {
                const user = await User.findByPk(req.user.user_id);
                if (String(user?.package_id) !== String(row.id)) {
                    return res.status(403).json({ success: false, message: "This package is private and not publicly accessible." });
                }
            }

            res.json({ success: true, data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            // API creation is now a mandatory feature for all packages
            const row = await Package.create({ ...req.body, allow_api: true });
            res.status(201).json({ success: true, message: "Package created successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const row = await Package.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Package not found" });
            
            // Ensure API creation remains true even if frontend omits it
            await row.update({ ...req.body, allow_api: true });
            res.json({ success: true, message: "Package updated successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const row = await Package.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Package not found" });
            
            // Check if any users are using this package
            const userCount = await User.count({ where: { package_id: row.id } });
            if (userCount > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Cannot delete package as it is currently assigned to users. Disable it instead." 
                });
            }

            await row.destroy();
            res.json({ success: true, message: "Package deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    assignToUser: async (req, res) => {
        try {
            const { userId, packageId } = req.body;
            
            const [user, pkg] = await Promise.all([
                User.findByPk(userId),
                Package.findByPk(packageId)
            ]);

            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

            // Check for one-time restriction defined in the package
            if (pkg.is_one_time) {
                let oneTimePackages = JSON.parse(user.one_time_packages || '[]');
                if (oneTimePackages.includes(parseInt(packageId))) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `The package '${pkg.name}' is a one-time offer and has already been used by this user.` 
                    });
                }
                // Add to history
                oneTimePackages.push(parseInt(packageId));
                user.one_time_packages = JSON.stringify(oneTimePackages);
            }

            // Calculate expiry
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + pkg.duration_days);

            await user.update({
                package_id: pkg.id,
                package_expiry: expiryDate,
                one_time_packages: user.one_time_packages
            });

            // Create a manual subscription record for history/tracking
            await UserSubscription.create({
                user_id: user.id,
                package_id: pkg.id,
                amount: 0, // Assigned for free by admin
                status: 'active',
                start_date: new Date(),
                expiry_date: expiryDate,
                razorpay_payment_id: 'MANUAL_ASSIGN'
            });

            res.json({ success: true, message: `Package ${pkg.name} assigned to ${user.name} successfully` });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = packageController;
