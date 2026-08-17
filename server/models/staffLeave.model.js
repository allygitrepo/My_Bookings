const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const StaffLeave = sequelize.define(
    "staff_leaves",
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
        business_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        leave_type: {
            type: DataTypes.ENUM('Casual Leave', 'Sick Leave', 'Vacation', 'Unpaid Leave', 'Other'),
            defaultValue: 'Casual Leave'
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: true
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: true
        },
        is_all_day: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        approval_status: {
            type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
            defaultValue: 'Approved'
        },
        reason: {
            type: DataTypes.TEXT,
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
        tableName: "staff_leaves",
        indexes: [
            { fields: ["staff_id"] },
            { fields: ["business_id"] },
            { fields: ["start_date", "end_date"] },
            { fields: ["approval_status"] },
            { fields: ["status"] }
        ]
    }
);

module.exports = StaffLeave;
