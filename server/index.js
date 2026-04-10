const express = require("express");
const { connectDB } = require("./config/db");
require("dotenv").config();
const routes = require("./routes/routes.index");
const createDefaultAdmin = require("./config/createDefaultAdmin");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect Database and Sync Models
connectDB().then(() => {
    createDefaultAdmin();
});

// Middlewares
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

// Routes
routes(app);

app.get("/", (req, res) => {
    res.json({ message: "MyBookings API", status: "Running" });
});

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
