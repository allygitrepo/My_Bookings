const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const TemplateProject = sequelize.define(
    "template_projects",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        templateId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            field: 'template_id'
        },
        displayName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'display_name'
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'website'
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
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
        tableName: "template_projects",
        indexes: [
            { fields: ["template_id"] },
            { fields: ["category"] },
            { fields: ["is_active"] }
        ]
    }
);

module.exports = TemplateProject;
