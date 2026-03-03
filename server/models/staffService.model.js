const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const StaffService = sequelize.define(
    "staff_services",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        staff_id: {
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
        tableName: "staff_services",
        indexes: [
            { fields: ["staff_id"] },
            { fields: ["service_id"] },
            { fields: ["status"] }
        ]
    }
);

module.exports = StaffService;
