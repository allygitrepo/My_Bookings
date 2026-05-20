const express = require("express");
const { connectDB } = require("./config/db");
// Ensure database associations and all models are registered prior to DB sync
require("./models/associations");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const routes = require("./routes/routes.index");
const createDefaultAdmin = require("./config/createDefaultAdmin");

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect Database and Sync Models
connectDB().then(() => {
    createDefaultAdmin();
    // Auto-flatten and update existing template pools on server boot
    try {
        const templateController = require("./controllers/template.controller");
        templateController.initTemplates();
    } catch (err) {
        console.error("Failed to initialize templates on startup:", err);
    }
});

// Middlewares
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json({
    limit: '5mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const http = require("http");
const { initSocket } = require("./services/socket.service");

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Routes
routes(app);

app.get("/", (req, res) => {
    res.json({ message: "MyBookings API", status: "Running" });
});

server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
