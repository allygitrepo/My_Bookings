const { User: Users, Package } = require("../models/associations");
const Business = require("../models/business.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const emailService = require("../utils/emailService");

const NAME_REGEX = /^[A-Za-z ]+$/;

// Helper: issue a JWT token with current business_id for a user
const issueToken = async (user) => {
    const business = await Business.findOne({ where: { user_id: user.id, status: true } });
    const businessId = business ? business.id : null;
    const token = jwt.sign(
        { user_id: user.id, business_id: businessId, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    return { token, businessId };
};

const userController = {
    sendOtp: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ success: false, message: "Email is required" });

            const existingUser = await Users.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email already exists" });
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Sign a token with OTP (valid for 10 minutes)
            const otpToken = jwt.sign({ email, otp }, process.env.JWT_SECRET, { expiresIn: '10m' });

            const emailRes = await emailService.sendOtpEmail(email, otp);
            if (!emailRes.success) {
                return res.status(500).json({ success: false, message: "Failed to send OTP email" });
            }

            res.status(200).json({
                success: true,
                message: "OTP sent successfully to your email",
                otpToken // Client needs to send this back with the OTP
            });
        } catch (err) {
            res.status(500).json({ success: false, message: "Server Error", error: err.message });
        }
    },

    register: async (req, res) => {
        try {
            const { name, email, password, otp, otpToken } = req.body;

            // 1. Verify OTP
            if (!otp || !otpToken) {
                return res.status(400).json({ success: false, message: "OTP and OTP Token are required" });
            }

            try {
                const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
                if (decoded.otp !== otp || decoded.email !== email) {
                    return res.status(400).json({ success: false, message: "Invalid OTP or email" });
                }
            } catch (error) {
                return res.status(400).json({ success: false, message: "OTP expired or invalid token" });
            }

            // 2. Validate name format
            if (!name || !NAME_REGEX.test(name)) {
                return res.status(400).json({
                    success: false,
                    message: "Name must contain only alphabets and spaces"
                });
            }

            const existingUser = await Users.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await Users.create({
                name,
                email,
                password: hashedPassword,
                status: true
            });

            // Send Welcome Email
            const trialExpiry = new Date();
            trialExpiry.setDate(trialExpiry.getDate() + 30);
            await emailService.sendWelcomeEmail(email, name, "Free Trial", trialExpiry);

            res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: { id: newUser.id, name: newUser.name, email: newUser.email }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: "Server Error", error: err.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await Users.findOne({ where: { email } });

            if (!user) {
                return res.status(400).json({ success: false, message: "Email not found" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Invalid password" });
            }

            // Check if user is suspended
            if (!user.status) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Your account has been suspended. Reason: ${user.suspended_reason || 'No reason provided.'}`
                });
            }

            // issueToken finds the business and issues a fresh JWT
            const { token, businessId } = await issueToken(user);

            res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    token,
                    user: { id: user.id, name: user.name, email: user.email, business_id: businessId, role: user.role, package_id: user.package_id, isPortalAdmin: user.role === 'PORTAL_ADMIN', profile_picture: user.profile_picture }
                }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: "Server Error", error: err.message });
        }
    },

    create: async (req, res) => {
        try {
            const { name, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await Users.create({ name, email, password: hashedPassword, status: true });
            res.status(201).json({ success: true, message: "User created successfully", data: newUser });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const whereClause = { status: true };
            if (req.user?.role === 'PORTAL_ADMIN') {
                delete whereClause.status;
            }

            const { count, rows } = await Users.findAndCountAll({
                where: whereClause,
                limit,
                offset
            });

            res.json({
                success: true,
                message: "Users fetched successfully",
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
            const user = await Users.findByPk(req.params.id, {
                include: [{ model: Package, as: 'package' }]
            });
            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            res.json({ success: true, message: "User fetched successfully", data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const user = await Users.findByPk(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            await user.update(req.body);
            res.json({ success: true, message: "User updated successfully", data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const user = await Users.findByPk(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            await user.update({ status: false });
            res.json({ success: true, message: "User deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Re-issues a fresh JWT with the latest business_id for the authenticated user.
    // Called from the frontend after a business is created.
    refreshToken: async (req, res) => {
        try {
            const user = await Users.findByPk(req.user.user_id);
            if (!user) return res.status(404).json({ success: false, message: "User not found" });

            const { token, businessId } = await issueToken(user);

            res.json({
                success: true,
                message: "Token refreshed",
                data: {
                    token,
                    user: { id: user.id, name: user.name, email: user.email, business_id: businessId, role: user.role, package_id: user.package_id, isPortalAdmin: user.role === 'PORTAL_ADMIN', profile_picture: user.profile_picture }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getUsage: async (req, res) => {
        try {
            const subscriptionGuard = require("../utils/subscriptionGuard");
            const usage = await subscriptionGuard.getUserUsage(req.user.user_id);
            res.json({ success: true, data: usage });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    updateFcmToken: async (req, res) => {
        try {
            const { fcm_token } = req.body;
            if (!fcm_token) return res.status(400).json({ success: false, message: "FCM Token is required" });

            const user = await Users.findByPk(req.user.user_id);
            if (!user) return res.status(404).json({ success: false, message: "User not found" });

            await user.update({ fcm_token });
            res.json({ success: true, message: "FCM Token updated successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ success: false, message: "Email is required" });

            const user = await Users.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ success: false, message: "Email not registered" });
            }

            // Generate a 4-digit OTP
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

            await user.update({
                reset_otp: otp,
                otp_expiry: expiry,
                is_otp_verified: false
            });

            const emailRes = await emailService.sendForgotPasswordOtpEmail(email, otp);
            if (!emailRes.success) {
                return res.status(500).json({ success: false, message: "Failed to send verification email" });
            }

            res.status(200).json({
                success: true,
                message: "Password reset OTP sent to your email"
            });
        } catch (err) {
            res.status(500).json({ success: false, message: "Server Error", error: err.message });
        }
    },

    verifyResetOtp: async (req, res) => {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return res.status(400).json({ success: false, message: "Email and OTP are required" });
            }

            const user = await Users.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (!user.reset_otp || user.reset_otp !== otp) {
                return res.status(400).json({ success: false, message: "Invalid OTP" });
            }

            if (new Date() > new Date(user.otp_expiry)) {
                return res.status(400).json({ success: false, message: "OTP has expired" });
            }

            await user.update({ is_otp_verified: true });

            res.status(200).json({
                success: true,
                message: "OTP verified successfully. You can now reset your password."
            });
        } catch (err) {
            res.status(500).json({ success: false, message: "Server Error", error: err.message });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { email, password, confirmPassword } = req.body;
            if (!email || !password || !confirmPassword) {
                return res.status(400).json({ success: false, message: "All fields are required" });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ success: false, message: "Passwords do not match" });
            }

            const user = await Users.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (!user.is_otp_verified) {
                return res.status(400).json({ success: false, message: "OTP is not verified. Please verify OTP first." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await user.update({
                password: hashedPassword,
                reset_otp: null,
                otp_expiry: null,
                is_otp_verified: false
            });

            res.status(200).json({
                success: true,
                message: "Password reset successfully"
            });
        } catch (err) {
            res.status(500).json({ success: false, message: "Server Error", error: err.message });
        }
    }
};

module.exports = userController;
