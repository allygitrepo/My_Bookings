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
                const Booking = require("../models/booking.model");
                const Business = require("../models/business.model");
                const Package = require("../models/package.model");
                const Service = require("../models/service.model");
                const ServiceType = require("../models/serviceType.model");
                const ServiceTypeMapping = require("../models/serviceTypeMapping.model");
                await BusinessTemplate.sync({ alter: true });
                await BusinessClosure.sync({ alter: true });
                await StaffLeave.sync({ alter: true });
                await Booking.sync({ alter: true });
                await Business.sync({ alter: true });
                await Package.sync({ alter: true });
                await Service.sync({ alter: true });
                await ServiceType.sync({ alter: true }).catch(() => ServiceType.sync());
                await ServiceTypeMapping.sync({ alter: true }).catch(() => ServiceTypeMapping.sync());
                try {
                    await sequelize.query("CREATE TABLE IF NOT EXISTS service_types (id BIGINT AUTO_INCREMENT PRIMARY KEY, business_id BIGINT NOT NULL, name VARCHAR(255) NOT NULL, status TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);");
                    await sequelize.query("CREATE TABLE IF NOT EXISTS service_type_mappings (id BIGINT AUTO_INCREMENT PRIMARY KEY, service_id BIGINT NOT NULL, service_type_id BIGINT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);");
                    await sequelize.query("ALTER TABLE services ADD COLUMN service_type VARCHAR(255) NULL");
                } catch (colErr) {
                    // Column or table already exists or error ignored
                }
                console.log('✅ Targeted business_templates, business_closures, staff_leaves, bookings, businesses, packages, services, service_types, and service_type_mappings table sync completed successfully');
            } catch (targetErr) {
                console.error('❌ Targeted sync failed:', targetErr);
            }
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = { sequelize, connectDB };
