const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const BookingService = sequelize.define(
    "booking_services",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        booking_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        service_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        timestamps: false,
        tableName: "booking_services",
        indexes: [
            { fields: ["booking_id"] },
            { fields: ["service_id"] },
            { fields: ["status"] }
        ]
    }
);

module.exports = BookingService;
