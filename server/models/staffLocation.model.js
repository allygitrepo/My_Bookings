const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const StaffLocation = sequelize.define(
    "staff_location",
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
        tableName: "staff_location",
        indexes: [
            { fields: ["staff_id"] },
            { fields: ["location_id"] },
            { fields: ["status"] }
        ]
    }
);

module.exports = StaffLocation;
