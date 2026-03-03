const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const Staff = sequelize.define(
    "staff",
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
        staff_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true
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
        tableName: "staff",
    }
);

module.exports = Staff;
