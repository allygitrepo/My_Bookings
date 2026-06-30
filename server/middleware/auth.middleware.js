const jwt = require("jsonwebtoken");
const ApiKey = require("../models/apiKey.model");
const Users = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];

    // 1. Check for JWT (Dashboard/Admin access)
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fast check: Verify user status in DB to handle real-time bans
            const user = await Users.findByPk(decoded.user_id);
            if (!user || !user.status) {
                return res.status(403).json({
                    success: false,
                    message: "Your account is suspended or inactive."
                });
            }

            req.user = decoded;
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: "Token is not valid" });
        }
    }

    // 2. Check for API Key (Public Widget access)
    if (apiKey) {
        try {
            const keyRecord = await ApiKey.findOne({ where: { api_key: apiKey, status: true } });
            if (keyRecord) {
                // Attach a dummy user or flag to indicate widget access
                req.isWidget = true;
                req.business_id = keyRecord.business_id;
                return next();
            }
        } catch (error) {
            console.error('API Key Auth Error:', error);
        }
    }

    // 3. Fallback if neither is valid
    return res.status(401).json({
        success: false,
        message: "Authorization denied. Provide a valid Bearer token or x-api-key header."
    });
};

module.exports = authMiddleware;
