const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const UserSubscription = sequelize.define(
    "user_subscriptions",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        package_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        razorpay_order_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        razorpay_payment_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        razorpay_signature: {
            type: DataTypes.STRING,
            allowNull: true
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'active', 'expired', 'failed'),
            defaultValue: 'pending'
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        expiry_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        timestamps: false,
        tableName: "user_subscriptions"
    }
);

module.exports = UserSubscription;
