const axios = require('axios');
const Business = require('../models/business.model');
const Package = require('../models/package.model');
const UserSubscription = require('../models/userSubscription.model');

const BASE_URL = 'http://localhost:3005/wa-mitra/api/v1';
const MASTER_TOKEN = process.env.WA_MITRA_MASTER_TOKEN;

// Import models
const {
    Customer, Service, Staff, Location, Booking, Payment
} = require('../models/associations');

/**
 * WhatsApp Service for WA-Mitra Integration
 */
const whatsappService = {
    /**
     * Get API config with auth headers
     */
    getConfig: () => ({
        headers: {
            'Authorization': `Bearer ${MASTER_TOKEN}`,
            'Content-Type': 'application/json'
        }
    }),

    /**
     * Check if a business has WhatsApp enabled in their package
     */
    canUseWhatsApp: async (businessId) => {
        try {
            const business = await Business.findByPk(businessId);
            if (!business) return false;

            const subscriptionGuard = require('../utils/subscriptionGuard');
            const usage = await subscriptionGuard.getUserUsage(business.user_id);

            return usage.flags.isWhatsappAllowed === true;
        } catch (error) {
            console.error('[WhatsAppService] Error checking permission:', error.message);
            return false;
        }
    },

    /**
     * Initiate or refresh WhatsApp instance/QR
     * @param {string} instanceKey - Optional, if provided refreshes existing instance
     * @param {string} name - Human readable name for the dashboard (sent during refresh)
     */
    initiateInstance: async (instanceKey = null, name = null) => {
        try {
            const payload = instanceKey ? { instanceKey, name } : {};

            // console.log(`[WhatsAppService] Calling API: ${BASE_URL}/instance/initiate`);
            // console.log(`[WhatsAppService] Request Body:`, payload);

            const response = await axios.post(
                `${BASE_URL}/instance/initiate`,
                payload,
                whatsappService.getConfig()
            );

            // console.log(`[WhatsAppService] Got Response:`, response.data);
            return response.data;
        } catch (error) {
            console.error('[WhatsAppService] Initiation error:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Check live status of an instance
     */
    getInstanceStatus: async (instanceKey) => {
        try {
            // console.log(`[WhatsAppService] Calling API: ${BASE_URL}/instance/status?instanceKey=${instanceKey}`);

            const response = await axios.get(
                `${BASE_URL}/instance/status?instanceKey=${instanceKey}`,
                whatsappService.getConfig()
            );

            // console.log(`[WhatsAppService] Got Response:`, response.data);
            return response.data;
        } catch (error) {
            console.error('[WhatsAppService] Status check error:', error.response?.data || error.message);
            return { success: false, status: 'disconnected', error: error.message };
        }
    },

    /**
     * Send a text message
     */
    sendTextMessage: async (businessId, number, message) => {
        try {
            // Check permission
            const allowed = await whatsappService.canUseWhatsApp(businessId);
            if (!allowed) {
                // console.log(`[WhatsAppService] Skipping: Business ${businessId} does not have WhatsApp in their package.`);
                return null;
            }

            const business = await Business.findByPk(businessId);
            if (!business || !business.whatsapp_instance_key) {
                // console.log(`[WhatsAppService] Skipping: Business ${businessId} not linked to WhatsApp.`);
                return null;
            }

            const payload = {
                instanceKey: business.whatsapp_instance_key,
                number: number,
                message: message
            };

            // console.log(`[WhatsAppService] Calling API: ${BASE_URL}/messages/send`);
            // console.log(`[WhatsAppService] Request Body:`, payload);

            const response = await axios.post(
                `${BASE_URL}/messages/send`,
                payload,
                whatsappService.getConfig()
            );

            // console.log(`[WhatsAppService] Got Response:`, response.data);
            return response.data;
        } catch (error) {
            console.error('[WhatsAppService] Send message error:', error.response?.data || error.message);
            // Don't throw error to avoid breaking the main flow (e.g. booking creation)
            return { success: false, error: error.message };
        }
    },

    /**
     * Send booking confirmation notification to customer and staff
     * @param {number} bookingId 
     */
    sendBookingNotification: async (bookingId) => {
        try {

            const fullBooking = await Booking.findByPk(bookingId, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Service, as: 'services', through: { attributes: [] } },
                    { model: Staff, as: 'staff' },
                    { model: Location, as: 'location' },
                    { model: Business, as: 'business' }
                ]
            });

            if (!fullBooking) return;

            // Only send if payment is confirmed/paid
            if (!fullBooking.payment_status) {
                console.log(`[WhatsApp] Skipping: Payment not confirmed for booking ${bookingId}`);
                return;
            }

            // Get total amount from related payments
            const payment = await Payment.findOne({ where: { booking_id: bookingId, payment_status: true } });
            const amount = payment ? payment.paid_amount : 0;

            if (fullBooking.customer?.phone) {
                const bizName = fullBooking.business?.business_name || "the business";
                const svcNames = fullBooking.services?.map(s => s.service_name).join(", ") || "Service";
                const dateStr = new Date(fullBooking.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                // Format times
                const fromTime = fullBooking.start_time.slice(0, 5);
                const toTime = fullBooking.end_time ? fullBooking.end_time.slice(0, 5) : '';
                const timeRange = toTime ? `${fromTime} - ${toTime}` : fromTime;

                const staffName = fullBooking.staff?.staff_name || "our staff";

                // Message to Customer
                const customerMsg = `Hello *${fullBooking.customer.name}*! 👋\n\nYour booking at *${bizName}* is confirmed! ✅\n\n🛠 *Service:* ${svcNames}\n📅 *Date:* ${dateStr}\n🕒 *Time:* ${timeRange}\n👤 *Staff:* ${staffName}\n💰 *Payment:* ₹${amount}\n\nThank you for choosing us!`;

                const cleanPhone = fullBooking.customer.phone.replace(/\D/g, '');
                whatsappService.sendTextMessage(fullBooking.business_id, cleanPhone, customerMsg)
                    .then(res => console.log(`[WhatsApp] Customer notified:`, res?.success))
                    .catch(err => console.error(`[WhatsApp] Customer notification failed:`, err.message));

                // Message to Staff
                if (fullBooking.staff?.phone) {
                    const staffMsg = `Hi *${staffName}*! 📢\n\nYou have a new confirmed booking!\n\n👤 *Customer:* ${fullBooking.customer.name}\n🛠 *Service:* ${svcNames}\n📅 *Date:* ${dateStr}\n🕒 *Time:* ${timeRange}\n💰 *Amount:* ₹${amount}\n\nCheck your dashboard for details.`;
                    const cleanStaffPhone = fullBooking.staff.phone.replace(/\D/g, '');
                    whatsappService.sendTextMessage(fullBooking.business_id, cleanStaffPhone, staffMsg)
                        .then(res => console.log(`[WhatsApp] Staff notified:`, res?.success))
                        .catch(err => console.error(`[WhatsApp] Staff notification failed:`, err.message));
                }
            }
        } catch (error) {
            console.error('[WhatsApp] Notification error:', error.message);
        }
    }
};

module.exports = whatsappService;
