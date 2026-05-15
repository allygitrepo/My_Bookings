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
        logo: {
            type: DataTypes.STRING,
            allowNull: true
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
        account_holder_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        account_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ifsc_code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        bank_name: {
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
        slug: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        selected_template: {
            type: DataTypes.STRING,
            defaultValue: 'template1'
        },
        website_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        has_multiple_locations: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true
        },
        state: {
            type: DataTypes.STRING,
            allowNull: true
        },
        location_type: {
            type: DataTypes.ENUM('Physical', 'Online'),
            defaultValue: 'Physical'
        },
        meeting_link: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        website_type: {
            type: DataTypes.ENUM('website', 'portfolio'),
            defaultValue: 'website'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        suspended_reason: {
            type: DataTypes.TEXT,
            allowNull: true
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
            { fields: ["slug"], unique: true },
            { fields: ["status"] }
        ]
    }
);

module.exports = Business;
