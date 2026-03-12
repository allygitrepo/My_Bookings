const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const ServiceLocation = sequelize.define(
    "service_location",
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
        location_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    },
    {
        timestamps: true,
        tableName: "service_locations",
        indexes: [
            { fields: ["service_id"] },
            { fields: ["location_id"] },
            { fields: ["status"] }
        ]
    }
);

module.exports = ServiceLocation;
