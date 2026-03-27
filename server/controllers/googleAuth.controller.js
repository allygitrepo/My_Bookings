const { saveRefreshToken } = require('../services/googleCalendar.service');

const googleAuth = async (req, res) => {
    const { businessId, code } = req.body;

    if (!businessId || !code) {
        return res.status(400).json({ success: false, message: 'Business ID and Auth Code are required' });
    }

    try {
        const result = await saveRefreshToken(businessId, code);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Google Auth Controller Error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to authorize Google' });
    }
};

module.exports = {
    googleAuth
};
