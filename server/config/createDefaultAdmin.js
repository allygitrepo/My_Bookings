const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

const createDefaultAdmin = async () => {
    try {
        // Check if any PORTAL_ADMIN already exists
        const adminExists = await User.findOne({ where: { role: 'PORTAL_ADMIN' } });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash("@lly4792", 10);
            await User.create({
                name: "Super Admin",
                email: "admin@mybookings.com",
                password: hashedPassword,
                role: "PORTAL_ADMIN",
                status: true
            });
            console.log("-----------------------------------------");
            console.log("Default Admin created: admin@mybookings.com");
            console.log("-----------------------------------------");
        } else {
            console.log("[Seeder] Portal Admin already exists.");
        }
    } catch (error) {
        console.error("[Seeder] Error creating default admin:", error.message);
    }
};

module.exports = createDefaultAdmin;
