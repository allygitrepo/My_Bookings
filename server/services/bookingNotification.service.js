const Booking = require("../models/booking.model");
const Business = require("../models/business.model");
const User = require("../models/user.model");
const fcmService = require("./fcm.service");
const { emitToBusiness } = require("./socket.service");

const sendBookingSuccessNotifications = async (bookingId) => {
    try {
        const { Customer, Service, Staff, Location, Payment } = require("../models/associations");
        const fullBooking = await Booking.findByPk(bookingId, {
            include: [
                { model: Customer, as: 'customer' },
                { model: Service, as: 'services', through: { attributes: [] } },
                { model: Staff, as: 'staff' },
                { model: Location, as: 'location' },
                { model: Business, as: 'business' },
                { model: Payment }
            ]
        });

        if (!fullBooking) return;

        // 1. Emit socket event to update client-side
        emitToBusiness(fullBooking.business_id, "bookingCreated", fullBooking);

        // 2. Send FCM Notification to the Owner
        const business = fullBooking.business;
        if (business && business.user_id) {
            const owner = await User.findByPk(business.user_id);
            if (owner && owner.fcm_token) {
                const clientName = fullBooking.customer?.name || "A Client";
                const staffName = fullBooking.staff?.staff_name || "Staff";
                const bookingTime = fullBooking.start_time;

                await fcmService.sendNotification(
                    owner.fcm_token,
                    "Booking Payment Confirmed",
                    `${clientName} has paid and confirmed their booking of ${staffName} at ${bookingTime}`,
                    {
                        type: "booking_confirmed",
                        booking_id: bookingId.toString()
                    }
                );
            }
        }
    } catch (err) {
        console.error("Error in sendBookingSuccessNotifications:", err);
    }
};

module.exports = {
    sendBookingSuccessNotifications
};
