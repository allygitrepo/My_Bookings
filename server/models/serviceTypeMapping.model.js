const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const ServiceTypeMapping = sequelize.define(
    "service_type_mappings",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        service_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        service_type_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        timestamps: false,
        tableName: "service_type_mappings",
        indexes: [
            { fields: ["service_id"] },
            { fields: ["service_type_id"] }
        ]
    }
);

module.exports = ServiceTypeMapping;
