const { Sequelize } = require('sequelize');
require("dotenv").config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
        logging: false
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');

        try {
            await sequelize.sync({ alter: true });
            console.log('Tables are created successfully');
        } catch (syncErr) {
            console.warn('⚠️ Standard DB sync failed due to legacy table limits. Syncing BusinessTemplate targetedly...');
            try {
                const BusinessTemplate = require("../models/businessTemplate.model");
                const BusinessClosure = require("../models/businessClosure.model");
                const StaffLeave = require("../models/staffLeave.model");
                await BusinessTemplate.sync({ alter: true });
                await BusinessClosure.sync({ alter: true });
                await StaffLeave.sync({ alter: true });
                console.log('✅ Targeted business_templates, business_closures, and staff_leaves table sync completed successfully');
            } catch (targetErr) {
                console.error('❌ Targeted sync failed:', targetErr);
            }
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = { sequelize, connectDB };
