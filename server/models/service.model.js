const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const Service = sequelize.define(
    "services",
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
        service_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        duration_minutes: {
            type: DataTypes.DECIMAL,
            allowNull: true,
            validate: { min: 0 }
        },
        price: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            validate: { min: 0 }
        },
        minimum_booking_charge: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            validate: { min: 0 }
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
        tableName: "services",
        indexes: [
            { fields: ["business_id"] },
            { fields: ["status"] }
        ]
    }
);

module.exports = Service;
