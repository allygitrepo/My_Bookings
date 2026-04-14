const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const Users = sequelize.define(
    "users",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('PORTAL_ADMIN', 'OWNER', 'STAFF'),
            defaultValue: 'OWNER'
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        suspended_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        profile_picture: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        },
        google_id: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        avatar: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        auth_provider: {
            type: DataTypes.ENUM('local', 'google'),
            defaultValue: 'local'
        }
    },
    {
        timestamps: false,
        tableName: "users",
        indexes: [
            { fields: ["status"] }
        ]
    }
);

module.exports = Users;
