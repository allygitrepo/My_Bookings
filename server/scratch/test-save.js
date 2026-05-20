const { sequelize } = require("../config/db");
// Register associations
require("../models/associations");
const Business = require("../models/business.model");
const businessController = require("../controllers/business.controller");

const req = {
    params: { id: 1 },
    body: {
        selected_template: "doctor_drp_portfolio",
        website_enabled: true
    },
    isWidget: true
};

const res = {
    status: function(code) {
        console.log("Status:", code);
        return this;
    },
    json: function(data) {
        console.log("JSON response:", JSON.stringify(data, null, 2));
    }
};

async function test() {
    try {
        console.log("Running simulated update...");
        await businessController.update(req, res);
        console.log("Simulated update complete.");
    } catch (e) {
        console.error("Error in simulated update:", e);
    } finally {
        await sequelize.close();
    }
}

test();
