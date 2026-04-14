const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token and returns the payload.
 * @param {string} token - The Google ID token (credential).
 * @returns {Promise<Object>} - The decoded payload.
 */
const verifyGoogleToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
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
