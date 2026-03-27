/**
 * Google Calendar API Service
 * Handles creating events using the Google Calendar REST API.
 */

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Creates an event in the user's primary Google Calendar.
 * @param {string} accessToken - OAuth2 access token
 * @param {Object} eventData - Event details
 * @returns {Promise<Object>} - The created event
 */
export const createCalendarEvent = async (accessToken, eventData) => {
    try {
        const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to create Google Calendar event');
        }

        return await response.json();
    } catch (error) {
        console.error('Google Calendar Service Error:', error);
        throw error;
    }
};

/**
 * Transfors a booking object into a Google Calendar Event object.
 * @param {Object} booking - The booking data
 * @param {Object} context - Optional context (customer, service, etc.)
 * @returns {Object} - Google Calendar Event object
 */
export const formatBookingToEvent = (booking, context = {}) => {
    const { customer, service, staff, location } = context;
    
    // Google Calendar expects ISO strings: 2023-05-28T09:00:00Z (or with offset)
    // Assuming booking.booking_date is YYYY-MM-DD and booking.start_time is HH:MM:SS
    const startDateTime = `${booking.booking_date}T${booking.start_time}`;
    const endDateTime = `${booking.booking_date}T${booking.end_time || booking.start_time}`;

    return {
        'summary': `${service?.service_name || 'Appointment'} with ${customer?.name || 'Customer'}`,
        'location': location ? `${location.location_name}, ${location.address}, ${location.city}` : 'To be decided',
        'description': `Booking ID: ${booking.id}\nStaff: ${staff?.staff_name || 'Any'}\nCustomer Phone: ${customer?.phone || 'N/A'}\nService: ${service?.service_name || 'N/A'}`,
        'start': {
            'dateTime': new Date(startDateTime).toISOString(),
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        'end': {
            'dateTime': new Date(endDateTime).toISOString(),
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        'reminders': {
            'useDefault': true,
        },
    };
};
