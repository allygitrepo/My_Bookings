const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const StaffAvailability = sequelize.define(
    "staff_availability",
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
        day_of_week: {
            type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
            allowNull: false
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        end_time: {
            type: DataTypes.TIME,
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
        tableName: "staff_availability",
    }
);

module.exports = StaffAvailability;
