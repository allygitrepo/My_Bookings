const Users = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userController = {
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;
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
                data: newUser
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

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.status(200).json({
                success: true,
                message: "Login successful",
                data: { token }
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
    }
};

module.exports = userController;
