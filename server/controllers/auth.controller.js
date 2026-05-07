const Users = require("../models/user.model");
const Business = require("../models/business.model");
const jwt = require("jsonwebtoken");
const { verifyGoogleToken } = require("../services/googleAuth.service");
const { Op } = require('sequelize');
const emailService = require("../utils/emailService");

/**
 * Helper: issue a JWT token with current business_id for a user
 */
const issueToken = async (user) => {
    // Find first active business
    const business = await Business.findOne({ where: { user_id: user.id, status: true } });
    const businessId = business ? business.id : null;
    
    const token = jwt.sign(
        { 
            user_id: user.id, 
            business_id: businessId, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    return { token, businessId, business };
};

const authController = {
    googleLogin: async (req, res) => {
        try {
            const { credential } = req.body;
            if (!credential) {
                return res.status(400).json({ success: false, message: "Credential is required" });
            }

            // 1. Verify Google token
            const payload = await verifyGoogleToken(credential);
            const { email, name, picture, sub: googleId } = payload;

            // 2. Check if user exists by email or google_id
            let user = await Users.findOne({ 
                where: { 
                    [Op.or]: [
                        { email: email },
                        { google_id: googleId }
                    ]
                } 
            });

            if (!user) {
                // Create new user
                user = await Users.create({
                    name,
                    email,
                    google_id: googleId,
                    avatar: picture,
                    auth_provider: 'google',
                    password: 'google-auth-no-password', // Placeholder password
                    status: true
                });

                // Send Welcome Email for new Google signups
                // Using 30 days as a default trial/reference expiry
                const trialExpiry = new Date();
                trialExpiry.setDate(trialExpiry.getDate() + 30);
                await emailService.sendWelcomeEmail(email, name, "Free Trial", trialExpiry);
            } else {
                // Update existing user if they haven't been linked to google yet
                if (!user.google_id) {
                    await user.update({
                        google_id: googleId,
                        avatar: picture,
                        auth_provider: 'google'
                    });
                }
            }

            // Check if user is suspended
            if (!user.status) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Account suspended: ${user.suspended_reason || 'No reason provided.'}`
                });
            }

            // 3. Ensure user has a business (Check for any business, including suspended ones)
            let allBusinesses = await Business.findAll({ where: { user_id: user.id } });
            let businesses = allBusinesses.filter(b => b.status === true);
            let activeBusiness = null;

            if (allBusinesses.length === 0) {
                // Create default business ONLY if user has absolutely no businesses
                activeBusiness = await Business.create({
                    business_name: "My Business",
                    user_id: user.id,
                    status: true,
                    business_type: 'Other'
                });
                businesses = [activeBusiness];
            } else {
                // If there are active businesses, use the first one. 
                // If all are suspended, use the first suspended one as a reference.
                activeBusiness = businesses.length > 0 ? businesses[0] : allBusinesses[0];
            }

            // 4. Generate JWT session
            const { token } = await issueToken(user);

            // 5. Return success response
            res.status(200).json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                    package_id: user.package_id,
                    isPortalAdmin: user.role === 'PORTAL_ADMIN'
                },
                businesses,
                activeBusiness
            });

        } catch (error) {
            console.error('Google login error:', error);
            res.status(500).json({ 
                success: false, 
                message: "Authentication failed", 
                error: error.message 
            });
        }
    }
};

module.exports = authController;
