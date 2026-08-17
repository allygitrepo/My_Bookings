const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const Booking = sequelize.define(
    "bookings",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        business_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        location_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        staff_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        service_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        customer_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        booking_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        google_event_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        payment_status: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        booking_status: {
            type: DataTypes.STRING,
            defaultValue: 'Confirmed',
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
        tableName: "bookings",
        indexes: [
            { fields: ["business_id"] },
            { fields: ["location_id"] },
            { fields: ["staff_id"] },
            { fields: ["service_id"] },
            { fields: ["customer_id"] },
            { fields: ["booking_date"] },
            { fields: ["status"] }
        ]
    }
);

module.exports = Booking;
