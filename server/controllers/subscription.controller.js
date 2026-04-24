const { User, Package, UserSubscription } = require("../models/associations");
const razorpayService = require("../services/razorpay.service");
const crypto = require("crypto");

const subscriptionController = {
    createOrder: async (req, res) => {
        try {
            const { packageId } = req.body;
            const userId = req.user.user_id;

            const pkg = await Package.findByPk(packageId);
            if (!pkg) {
                return res.status(404).json({ success: false, message: "Package not found" });
            }

            // 1. Check for One-Time Plan restriction
            if (pkg.is_one_time) {
                const existingSub = await UserSubscription.findOne({
                    where: { user_id: userId, package_id: packageId }
                });
                if (existingSub) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `The '${pkg.name}' plan is a one-time offer and has already been used by your account.` 
                    });
                }
            }

            // 2. Create Razorpay Order
            const order = await razorpayService.createOrder(pkg.amount, `sub_${userId}_${Date.now()}`, {
                package_id: String(packageId),
                user_id: String(userId),
                type: 'subscription'
            });

            // 2. Create pending subscription record
            await UserSubscription.create({
                user_id: userId,
                package_id: packageId,
                razorpay_order_id: order.id,
                amount: pkg.amount,
                status: 'pending'
            });

            res.json({ success: true, order, pkg });
        } catch (error) {
            console.error('Create Subscription Order Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    verifyPayment: async (req, res) => {
        try {
            const { 
                razorpay_order_id, 
                razorpay_payment_id, 
                razorpay_signature,
                packageId 
            } = req.body;
            const userId = req.user.user_id;

            const isVerified = razorpayService.verifySignature(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            );

            if (!isVerified) {
                return res.status(400).json({ success: false, message: "Invalid payment signature" });
            }

            const [user, pkg, subscription] = await Promise.all([
                User.findByPk(userId),
                Package.findByPk(packageId),
                UserSubscription.findOne({ where: { razorpay_order_id } })
            ]);

            if (!user || !pkg || !subscription) {
                return res.status(404).json({ success: false, message: "Required records not found" });
            }

            // Calculate expiry
            const startDate = new Date();
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + pkg.duration_days);

            // Update Subscription Record
            await subscription.update({
                razorpay_payment_id,
                razorpay_signature,
                status: 'active',
                start_date: startDate,
                expiry_date: expiryDate
            });

            // Update User Record
            let oneTimePackages = JSON.parse(user.one_time_packages || '[]');
            if (pkg.is_one_time) {
                if (!oneTimePackages.includes(parseInt(packageId))) {
                    oneTimePackages.push(parseInt(packageId));
                }
            }

            await user.update({
                package_id: pkg.id,
                package_expiry: expiryDate,
                one_time_packages: JSON.stringify(oneTimePackages)
            });

            res.json({ 
                success: true, 
                message: "Subscription activated successfully", 
                data: { package_name: pkg.name, expiry_date: expiryDate } 
            });
        } catch (error) {
            console.error('Verify Subscription Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    activateFree: async (req, res) => {
        try {
            const { packageId } = req.body;
            const userId = req.user.user_id;

            const [user, pkg] = await Promise.all([
                User.findByPk(userId),
                Package.findByPk(packageId)
            ]);

            if (!user || !pkg) {
                return res.status(404).json({ success: false, message: "User or Package not found" });
            }

            // Check for One-Time Plan restriction
            if (pkg.is_one_time) {
                const existingSub = await UserSubscription.findOne({
                    where: { user_id: userId, package_id: packageId }
                });
                if (existingSub) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `The '${pkg.name}' plan is a one-time offer and has already been used by your account.` 
                    });
                }
            }

            if (parseFloat(pkg.amount) > 0) {
                return res.status(400).json({ success: false, message: "This package is not free" });
            }

            // Calculate expiry
            const startDate = new Date();
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + pkg.duration_days);

            // Create/Update Subscription Record
            await UserSubscription.create({
                user_id: userId,
                package_id: packageId,
                amount: 0,
                status: 'active',
                start_date: startDate,
                expiry_date: expiryDate,
                razorpay_order_id: `free_${userId}_${Date.now()}`,
                razorpay_payment_id: 'FREE_PLAN'
            });

            // Update User Record
            await user.update({
                package_id: pkg.id,
                package_expiry: expiryDate
            });

            res.json({ 
                success: true, 
                message: "Free subscription activated successfully", 
                data: { package_name: pkg.name, expiry_date: expiryDate } 
            });
        } catch (error) {
            console.error('Free Activation Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = subscriptionController;
