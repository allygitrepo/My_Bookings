const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const Business = sequelize.define(
    "businesses",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        business_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        business_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        upi_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        sync_email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        google_refresh_token: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        google_sync_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
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
        tableName: "businesses",
        indexes: [
            { fields: ["user_id"] },
            { fields: ["status"] }
        ]
    }
);

module.exports = Business;
