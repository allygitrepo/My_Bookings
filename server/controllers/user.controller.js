const Users = require("../models/user.model");
const Business = require("../models/business.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const NAME_REGEX = /^[A-Za-z ]+$/;

// Helper: issue a JWT token with current business_id for a user
const issueToken = async (user) => {
    const business = await Business.findOne({ where: { user_id: user.id, status: true } });
    const businessId = business ? business.id : null;
    const token = jwt.sign(
        { user_id: user.id, business_id: businessId, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    return { token, businessId };
};

const userController = {
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            // Validate name format
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

            // issueToken finds the business and issues a fresh JWT
            const { token, businessId } = await issueToken(user);

            res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    token,
                    user: { id: user.id, name: user.name, email: user.email, business_id: businessId }
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

            const { count, rows } = await Users.findAndCountAll({
                where: { status: true },
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
            const user = await Users.findByPk(req.params.id);
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
                    user: { id: user.id, name: user.name, email: user.email, business_id: businessId }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = userController;
