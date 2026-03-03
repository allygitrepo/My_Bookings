const express = require("express");
const { connectDB } = require("./config/db");
require("dotenv").config();
const PORT = process.env.PORT;
const app = express();

connectDB();

app.get("/", (req, res) => {
    res.json({ message: "MyBookings", status: "Running" });
})

app.listen(PORT, () => {
    console.log("Server running over : ", PORT);

})
