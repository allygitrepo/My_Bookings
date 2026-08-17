const Payment = require("../models/payment.model");
const Booking = require("../models/booking.model");
const { Op } = require("sequelize");
const crypto = require("crypto");
const razorpayService = require("../services/razorpay.service");
const { emitToBusiness } = require("../services/socket.service");
const Business = require("../models/business.model");
const User = require("../models/user.model");
const Package = require("../models/package.model");
const whatsappService = require("../services/whatsapp.service");
const fcmService = require("../services/fcm.service");

const getBusinessId = (req) => {
    if (req.isWidget) return req.business_id ?? -1;
    return req.user?.business_id ?? -1;
};

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
                const serviceNames = fullBooking.services && fullBooking.services.length > 0
                    ? fullBooking.services.map(s => s.service_name).join(", ")
                    : "Services";

                await fcmService.sendNotification(
                    owner.fcm_token,
                    "Booking Payment Confirmed",
                    `${clientName} has paid and confirmed their booking of ${serviceNames} with ${staffName} at ${bookingTime}`,
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

const handlePaymentSuccess = async (payment) => {
    try {
        if (payment.payment_status) {
            const booking = await Booking.findByPk(payment.booking_id);
            if (booking) {
                // Update booking status
                if (!booking.payment_status) {
                    await booking.update({ payment_status: true });
                }

                // WhatsApp notification
                try {
                    await whatsappService.sendBookingNotification(payment.booking_id);
                } catch (waErr) {
                    console.error("Error sending WhatsApp notification:", waErr.message);
                }

                // App & socket notification
                try {
                    await sendBookingSuccessNotifications(payment.booking_id);
                } catch (notifErr) {
                    console.error("Error calling sendBookingSuccessNotifications:", notifErr);
                }
            }
        }
    } catch (err) {
        console.error("Error in handlePaymentSuccess:", err);
    }
};

const paymentController = {
    sendBookingSuccessNotifications,
    create: async (req, res) => {
        try {
            const data = { ...req.body };
            if (!data.transaction_id) {
                data.transaction_id = 'txn_' + crypto.randomBytes(4).toString('hex');
            }
            const booking = await Booking.findByPk(data.booking_id);
            if (!data.business_id && booking) {
                data.business_id = booking.business_id;
            }
            const row = await Payment.create(data);
            if (row.payment_status) {
                await handlePaymentSuccess(row);
            }
            res.status(201).json({ success: true, message: "Payment created successfully", data: row });

            // Emit Socket Event
            emitToBusiness(row.business_id, "paymentUpdated", row);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const offset = (page - 1) * limit;
            const whereClause = { };

            if (req.isWidget) {
                whereClause.business_id = req.business_id ?? -1;
            } else if (req.user?.role === 'PORTAL_ADMIN') {
                // Bypass filter for Portal Admin: whereClause remains empty
            } else if (req.user?.user_id) {
                // Fetch all businesses owned by this user
                const Business = require("../models/business.model");
                const businesses = await Business.findAll({ where: { user_id: req.user.user_id, status: true }, attributes: ['id'] });
                const businessIds = businesses.map(b => b.id);
                whereClause.business_id = { [Op.in]: businessIds.length > 0 ? businessIds : [-1] };
            } else {
                whereClause.business_id = -1;
            }

            // Filter payments via bookings belonging to these businesses
            const businessBookings = await Booking.findAll({
                where: whereClause,
                attributes: ['id']
            });
            const bookingIds = businessBookings.map(b => b.id);

            // Fetch payments
            const paymentWhere = {};
            if (Object.keys(whereClause).length > 0) {
                // If there were filters, we must restrict by booking IDs
                if (bookingIds.length === 0) {
                    return res.json({
                        success: true,
                        message: "Payments fetched successfully",
                        totalRecords: 0,
                        totalPages: 0,
                        currentPage: page,
                        data: []
                    });
                }
                paymentWhere.booking_id = { [Op.in]: bookingIds };
            }
            // else: Portal Admin (empty whereClause) sees all payments without restriction


            const { count, rows } = await Payment.findAndCountAll({
                where: paymentWhere,
                limit,
                offset
            });

            res.json({
                success: true,
                message: "Payments fetched successfully",
                totalRecords: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                data: rows
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const row = await Payment.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Payment not found" });
            res.json({ success: true, message: "Payment fetched successfully", data: row });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const row = await Payment.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Payment not found" });
            const wasPaid = row.payment_status;
            await row.update(req.body);
            if (row.payment_status && !wasPaid) {
                await handlePaymentSuccess(row);
            }
            res.json({ success: true, message: "Payment updated successfully", data: row });

            // Emit Socket Event
            emitToBusiness(row.business_id, "paymentUpdated", row);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const row = await Payment.findByPk(req.params.id);
            if (!row) return res.status(404).json({ success: false, message: "Payment not found" });
            await row.update({ status: false });
            res.json({ success: true, message: "Payment deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- Razorpay Integration ---

    createRazorpayOrder: async (req, res) => {
        try {
            const { amount, booking_id, business_id } = req.body;
            if (!amount || !booking_id) {
                return res.status(400).json({ success: false, message: "Amount and Booking ID are required" });
            }

            const Razorpay = require('razorpay');
            
            // Resolve target business_id
            let targetBizId = business_id;
            if (!targetBizId && booking_id) {
                const b = await Booking.findByPk(booking_id);
                if (b) targetBizId = b.business_id;
            }

            let keyId = process.env.RAZORPAY_KEY_ID;
            let keySecret = process.env.RAZORPAY_KEY_SECRET;

            if (targetBizId) {
                const biz = await Business.findByPk(targetBizId);
                if (biz && biz.razorpay_enabled && biz.razorpay_key_id && biz.razorpay_key_secret) {
                    keyId = biz.razorpay_key_id;
                    keySecret = biz.razorpay_key_secret;
                }
            }

            if (!keyId || !keySecret) {
                return res.status(400).json({ success: false, message: "Razorpay keys not configured for this business" });
            }

            const rzpInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
            const order = await rzpInstance.orders.create({
                amount: Math.round(parseFloat(amount) * 100),
                currency: "INR",
                receipt: `booking_${booking_id}_${Date.now()}`,
                notes: {
                    booking_id: String(booking_id),
                    business_id: String(targetBizId || '')
                }
            });

            res.json({ success: true, order, key_id: keyId });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    verifyRazorpayPayment: async (req, res) => {
        try {
            const { 
                razorpay_order_id, 
                razorpay_payment_id, 
                razorpay_signature,
                booking_id,
                amount,
                paid_amount
            } = req.body;

            // Fetch booking to get business_id
            const booking = await Booking.findByPk(booking_id);
            if (!booking) {
                return res.status(404).json({ success: false, message: "Booking not found" });
            }

            let keySecret = process.env.RAZORPAY_KEY_SECRET;
            if (booking.business_id) {
                const biz = await Business.findByPk(booking.business_id);
                if (biz && biz.razorpay_enabled && biz.razorpay_key_secret) {
                    keySecret = biz.razorpay_key_secret;
                }
            }

            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", keySecret)
                .update(body.toString())
                .digest("hex");

            const isVerified = (expectedSignature === razorpay_signature);

            if (!isVerified) {
                return res.status(400).json({ success: false, message: "Invalid payment signature" });
            }

            // Check if payment record already exists (could be from webhook)
            const existingPayment = await Payment.findOne({ where: { transaction_id: razorpay_payment_id } });
            if (existingPayment) {
                return res.json({ success: true, message: "Payment already processed", data: existingPayment });
            }

            // Calculate platform fees based on business package
            const business = await Business.findByPk(booking.business_id, {
                include: [{
                    model: User,
                    as: 'owner',
                    include: [{ model: Package, as: 'package' }]
                }]
            });

            const chargesPercent = parseFloat(business?.owner?.package?.portal_payment_charges || 0);
            const calc_paid_amount = parseFloat(paid_amount || amount);
            const platform_fees = (calc_paid_amount * chargesPercent) / 100;
            const final_amount = calc_paid_amount - platform_fees;

            // Create payment record
            const paymentRecord = await Payment.create({
                booking_id: booking_id,
                business_id: booking.business_id,
                amount: amount,
                paid_amount: calc_paid_amount,
                platform_fees: platform_fees,
                final_amount: final_amount,
                payment_method: 'Razorpay',
                transaction_id: razorpay_payment_id,
                payment_status: true
            });

            await handlePaymentSuccess(paymentRecord);

            await handlePaymentSuccess(paymentRecord);

            res.json({ 
                success: true, 
                message: "Payment verified and recorded successfully", 
                data: paymentRecord 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    createStripeCheckoutSession: async (req, res) => {
        try {
            const { amount, booking_id, business_id, service_name } = req.body;
            if (!amount || !booking_id) {
                return res.status(400).json({ success: false, message: "Amount and Booking ID are required" });
            }

            let targetBizId = business_id;
            if (!targetBizId && booking_id) {
                const b = await Booking.findByPk(booking_id);
                if (b) targetBizId = b.business_id;
            }

            let secretKey = process.env.STRIPE_SECRET_KEY;
            if (targetBizId) {
                const biz = await Business.findByPk(targetBizId);
                if (biz && biz.stripe_enabled && biz.stripe_secret_key) {
                    secretKey = biz.stripe_secret_key;
                }
            }

            if (!secretKey) {
                return res.status(400).json({ success: false, message: "Stripe secret key not configured for this business" });
            }

            const Stripe = require('stripe');
            const stripeInstance = new Stripe(secretKey.trim());
            const clientOrigin = req.headers.origin || 'http://localhost:5173';

            const session = await stripeInstance.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: service_name || 'Booking Appointment',
                            description: `Booking #${booking_id}`
                        },
                        unit_amount: Math.round(parseFloat(amount) * 100),
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${clientOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking_id}`,
                cancel_url: `${clientOrigin}/payment-cancel?booking_id=${booking_id}`,
                metadata: {
                    booking_id: String(booking_id),
                    business_id: String(targetBizId || '')
                }
            });

            res.json({
                success: true,
                url: session.url
            });
        } catch (error) {
            console.error('Stripe Checkout Error:', error.message);
            res.json({ success: false, message: error.message });
        }
    },

    verifyStripePayment: async (req, res) => {
        try {
            const { payment_intent_id, booking_id, amount, paid_amount } = req.body;
            const booking = await Booking.findByPk(booking_id);
            if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

            let secretKey = process.env.STRIPE_SECRET_KEY;
            if (booking.business_id) {
                const biz = await Business.findByPk(booking.business_id);
                if (biz && biz.stripe_enabled && biz.stripe_secret_key) {
                    secretKey = biz.stripe_secret_key;
                }
            }

            if (secretKey && !payment_intent_id.startsWith('pi_stripe_')) {
                try {
                    const Stripe = require('stripe');
                    const stripeInstance = new Stripe(secretKey.trim());
                    const intent = await stripeInstance.paymentIntents.retrieve(payment_intent_id);

                    if (intent.status !== 'succeeded') {
                        return res.json({ success: false, message: `Stripe payment status: ${intent.status}` });
                    }
                } catch (stripeErr) {
                    console.warn('Stripe Verify Warning:', stripeErr.message);
                }
            }

            const existingPayment = await Payment.findOne({ where: { transaction_id: payment_intent_id } });
            if (existingPayment) {
                return res.json({ success: true, message: "Payment already recorded", data: existingPayment });
            }

            const calc_paid_amount = parseFloat(paid_amount || amount);
            const paymentRecord = await Payment.create({
                booking_id,
                business_id: booking.business_id,
                amount,
                paid_amount: calc_paid_amount,
                platform_fees: 0,
                final_amount: calc_paid_amount,
                payment_method: 'Stripe',
                transaction_id: payment_intent_id,
                payment_status: true
            });

            await handlePaymentSuccess(paymentRecord);
            res.json({ success: true, message: "Stripe payment recorded successfully", data: paymentRecord });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    handleWebhook: async (req, res) => {
        try {
            const signature = req.headers["x-razorpay-signature"];
            const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

            if (!signature) {
                return res.status(400).json({ success: false, message: "Missing signature" });
            }

            if (!secret) {
                return res.status(400).json({ success: false, message: "Webhook secret not configured" });
            }

            const webhookBody = req.rawBody || JSON.stringify(req.body);

            const isValid = razorpayService.validateWebhookSignature(
                webhookBody,
                signature,
                secret
            );

            if (!isValid) {
                console.error('Webhook Error: Invalid signature. Verify that RAZORPAY_WEBHOOK_SECRET matches the secret in Razorpay Dashboard.');
                return res.status(400).json({ success: false, message: "Invalid webhook signature" });
            }

            const event = req.body.event;
            const payload = req.body.payload;


            if (event === "payment.captured" || event === "order.paid") {
                const paymentData = payload.payment.entity;
                const paymentId = paymentData.id;
                const amount = paymentData.amount / 100; // convert from paise

                // Retrieve booking ID from notes
                const bookingId = paymentData.notes?.booking_id;

                if (bookingId) {
                    const booking = await Booking.findByPk(bookingId);
                    if (booking) {
                        // Check if payment already exists
                        const existingPayment = await Payment.findOne({ where: { transaction_id: paymentId } });
                        if (!existingPayment) {
                            const business = await Business.findByPk(booking.business_id, {
                                include: [{
                                    model: User,
                                    as: 'owner',
                                    include: [{ model: Package, as: 'package' }]
                                }]
                            });

                            const chargesPercent = parseFloat(business?.owner?.package?.portal_payment_charges || 0);
                            const platform_fees = (amount * chargesPercent) / 100;
                            const final_amount = amount - platform_fees;

                            const paymentRecord = await Payment.create({
                                booking_id: bookingId,
                                business_id: booking.business_id,
                                amount: amount,
                                paid_amount: amount,
                                platform_fees: platform_fees,
                                final_amount: final_amount,
                                payment_method: 'Razorpay_Webhook',
                                transaction_id: paymentId,
                                payment_status: true
                            });

                            await handlePaymentSuccess(paymentRecord);
                        } else {
                        }
                    }
                }
            }

            res.json({ success: true, message: "Webhook processed" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = paymentController;
