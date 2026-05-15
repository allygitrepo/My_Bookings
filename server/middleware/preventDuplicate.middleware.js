const crypto = require('crypto');

// In-memory store for request hashes
const requestCache = new Map();

/**
 * Middleware to prevent duplicate requests within a short timeframe (e.g., 2 seconds).
 * It hashes the user, path, and request body.
 */
const preventDuplicate = (windowMs = 2000) => {
    return (req, res, next) => {
        // Only apply to state-changing methods
        if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
            return next();
        }

        // Generate a unique hash for this request
        const userId = req.user?.id || req.ip; // Fallback to IP if not logged in
        const requestData = JSON.stringify({
            userId,
            path: req.path,
            body: req.body
        });
        
        const hash = crypto.createHash('md5').update(requestData).digest('hex');
        const currentTime = Date.now();

        if (requestCache.has(hash)) {
            const lastRequestTime = requestCache.get(hash);
            if (currentTime - lastRequestTime < windowMs) {
                console.warn(`[Duplicate Request Blocked] Path: ${req.path}, Hash: ${hash}`);
                return res.status(429).json({
                    success: false,
                    message: 'Request is already in progress. Please wait a moment.'
                });
            }
        }

        // Save the current request timestamp
        requestCache.set(hash, currentTime);

        // Optional: Clean up cache periodically (e.g., every 5 minutes)
        // For simplicity in this demo, we just set a timeout to remove this specific hash
        setTimeout(() => {
            requestCache.delete(hash);
        }, windowMs);

        next();
    };
};

module.exports = preventDuplicate;
