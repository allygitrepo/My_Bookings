const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const Package = sequelize.define(
    "packages",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        duration_days: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30
        },
        portal_payment_charges: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.00,
            comment: "Percentage charges per payment"
        },
        // Restrictions
        max_businesses: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        max_locations: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        max_staff: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        max_services: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 5
        },
        max_bookings: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100,
            comment: "-1 for unlimited"
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        allow_api: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        allow_website_builder: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_one_time: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: "If true, user can only be assigned this package once in a lifetime"
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        timestamps: false,
        tableName: "packages"
    }
);

module.exports = Package;
