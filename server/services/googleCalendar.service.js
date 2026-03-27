const { google } = require('googleapis');
const Business = require('../models/business.model');

/**
 * Google Calendar Backend Service
 * Handles OAuth2 token management and event creation.
 */

const createOAuth2Client = () => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('[GoogleAuth] CRITICAL ERROR: Missing Google OAuth Credentials in .env');
        throw new Error('Google OAuth credentials not configured on the server.');
    }

    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        // Redirect URI must match what's in Google Cloud Console
        // For 'auth-code' flow from frontend, this is often 'postmessage' or a specific URI
        'postmessage' 
    );
};

/**
 * Exchanges an authorization code for tokens and saves the refresh token.
 * @param {number} businessId - Local business ID
 * @param {string} code - Auth code from frontend
 */
const saveRefreshToken = async (businessId, code) => {
    const oauth2Client = createOAuth2Client();
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch user profile to capture the linked email
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        const updateData = {};
        if (tokens.refresh_token) updateData.google_refresh_token = tokens.refresh_token;
        if (email) updateData.sync_email = email;

        if (Object.keys(updateData).length > 0) {
            await Business.update(
                updateData,
                { where: { id: businessId } }
            );
            return { 
                success: true, 
                message: tokens.refresh_token ? 'Google Calendar linked successfully' : 'Account verified (no new tokens)',
                email 
            };
        } else {
            return { success: true, message: 'Tokens received (no changes needed)' };
        }
    } catch (error) {
        console.error('Error exchanging auth code:', error);
        throw new Error('Failed to exchange Google Auth code');
    }
};

/**
 * Creates an event in Google Calendar using stored refresh token.
 */
const syncBookingToGoogle = async (booking, context = {}) => {
    const { business, customer, service, staff, location } = context;

    if (!business || !business.google_refresh_token) {
        console.log(`[GoogleSync] Skipping: No refresh token for business ${booking.business_id}`);
        return null;
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
        refresh_token: business.google_refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Format Times
    const startDateTime = `${booking.booking_date}T${booking.start_time}`;
    const endDateTime = `${booking.booking_date}T${booking.end_time || booking.start_time}`;

    const event = {
        summary: `${service?.service_name || 'Appointment'} with ${customer?.name || 'Customer'}`,
        location: location ? `${location.location_name}, ${location.address}, ${location.city}` : 'To be decided',
        description: `Booking ID: ${booking.id}\nStaff: ${staff?.staff_name || 'Any'}\nCustomer Phone: ${customer?.phone || 'N/A'}\nService: ${service?.service_name || 'N/A'}`,
        start: {
            dateTime: new Date(startDateTime).toISOString(),
            timeZone: 'Asia/Kolkata', // Defaulting to IST
        },
        end: {
            dateTime: new Date(endDateTime).toISOString(),
            timeZone: 'Asia/Kolkata',
        },
        reminders: {
            useDefault: true,
        },
    };

    try {
        const calendarId = business.sync_email || 'primary';
        const response = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
        });
        console.log(`[GoogleSync] Event created: ${response.data.htmlLink}`);
        return response.data;
    } catch (error) {
        console.error('[GoogleSync] Error creating event:', error.message);
        throw error;
    }
};

module.exports = {
    saveRefreshToken,
    syncBookingToGoogle
};
