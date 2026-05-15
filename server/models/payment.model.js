const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const Payment = sequelize.define(
    "payments",
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
        business_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        amount: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        paid_amount: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        payment_method: {
            type: DataTypes.STRING,
            allowNull: true
        },
        platform_fees: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: 0
        },
        final_amount: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: 0
        },
        transaction_id: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        payment_status: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
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
        tableName: "payments",
        indexes: [
            { fields: ["booking_id"] },
            { fields: ["status"] }
        ]
    }
);

module.exports = Payment;
