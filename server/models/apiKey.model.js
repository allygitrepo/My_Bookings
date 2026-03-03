const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const ApiKey = sequelize.define(
    "api_keys",
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
        api_key: {
            type: DataTypes.TEXT,
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
        tableName: "api_keys",
    }
);

module.exports = ApiKey;
