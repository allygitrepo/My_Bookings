const express = require("express");
const { connectDB } = require("./config/db");
const cors = require("cors");
require("dotenv").config();
const routes = require("./routes/routes.index");
const createDefaultAdmin = require("./config/createDefaultAdmin");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect Database and Sync Models
connectDB().then(() => {
    createDefaultAdmin();
});


// app.use((req, res, next) => {
//     console.log(`>>> Incoming: ${req.method} ${req.url}`);
//     next();
// });

// Middlewares
app.use(cors({
    origin: true, // Allow all origins by reflecting the requesting origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Routes
routes(app);

app.get("/", (req, res) => {
    res.json({ message: "MyBookings API", status: "Running" });
});

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
