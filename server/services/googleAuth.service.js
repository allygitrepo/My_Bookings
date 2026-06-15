const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token and returns the payload.
 * @param {string} token - The Google ID token (credential).
 * @returns {Promise<Object>} - The decoded payload.
 */
const verifyGoogleToken = async (token) => {
    try {
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payloadBuf = Buffer.from(parts[1], 'base64');
                const decodedPayload = JSON.parse(payloadBuf.toString());
                console.log("Decoded Token Payload:", decodedPayload);
            }
        } catch (decErr) {
            console.error("Failed to decode token for inspection:", decErr);
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: [
                process.env.GOOGLE_CLIENT_ID,
                "175183335539-98a7nuhghnanrlboa38dse512er3lgb7.apps.googleusercontent.com", // Web Client ID (175183335539)
                "175183335539-vg9oq1olf66jp64bvlal5ut1avebqu50.apps.googleusercontent.com", // Android Client ID (175183335539)
                "259733920973-mo0t9s7nvgso8fsqm6ejd14hspmlpl10.apps.googleusercontent.com"  // Active Client ID (259733920973)
            ],
        });
        const payload = ticket.getPayload();

        return {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            sub: payload.sub, // googleId
        };
    } catch (error) {
        console.error('Error verifying Google token:', error);
        throw new Error('Invalid Google token');
    }
};

module.exports = {
    verifyGoogleToken,
};
