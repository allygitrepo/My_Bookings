const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const ServiceType = sequelize.define(
    "service_types",
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
        name: {
            type: DataTypes.STRING,
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
        tableName: "service_types",
        indexes: [
            { fields: ["business_id"] },
            { fields: ["status"] }
        ]
    }
);

module.exports = ServiceType;
