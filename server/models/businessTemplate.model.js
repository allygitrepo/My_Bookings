const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const BusinessTemplate = sequelize.define(
    "business_templates",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        temp_id: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'temp_id'
        },
        business_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: 'business_id'
        },
        business_key: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'business_key'
        },
        temp_path: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'temp_path'
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
        tableName: "business_templates",
        indexes: [
            { fields: ["business_id"] },
            { fields: ["temp_id"] }
        ]
    }
);

module.exports = BusinessTemplate;
