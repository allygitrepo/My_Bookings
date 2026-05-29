const { DataTypes } = require('sequelize');
const { sequelize } = require("../config/db");

const Template = sequelize.define(
    "template_registry",
    {
        template_id: {
            type: DataTypes.STRING(50),
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        path: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        category: {
            type: DataTypes.ENUM('website', 'portfolio'),
            defaultValue: 'website'
        },
        version: {
            type: DataTypes.STRING(20),
            defaultValue: '1.0.0'
        },
        is_external: {
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
        tableName: "template_registry",
        indexes: [
            { fields: ["category"] },
            { fields: ["is_external"] }
        ]
    }
);

module.exports = Template;
