const { Sequelize } = require("sequelize");
const path = require("path");

require("dotenv").config();

const sequelize = new Sequelize(
    process.env.DB_NAME || "my_bookings",
    process.env.DB_USER || "root",
    process.env.DB_PASS || "",
    {
        host: process.env.DB_HOST || "localhost",
        dialect: "mysql",
        logging: false
    }
);

async function check() {
    try {
        const [results] = await sequelize.query("SELECT * FROM template_projects");
        console.log("TemplateProjects:", JSON.stringify(results, null, 2));
        const [businesses] = await sequelize.query("SELECT id, business_name, selected_template, slug FROM Businesses");
        console.log("Businesses:", JSON.stringify(businesses, null, 2));
    } catch (e) {
        console.error("Error checking db:", e);
    } finally {
        await sequelize.close();
    }
}

check();
