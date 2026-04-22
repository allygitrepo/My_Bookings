const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay Order
 * @param {number} amount - Amount in INR (will be converted to paise)
 * @param {string} receipt - Unique receipt ID (usually booking ID)
 * @param {Object} notes - Additional metadata (e.g., business_id)
 */
const createOrder = async (amount, receipt, notes = {}) => {
    try {
        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: "INR",
            receipt: `receipt_${receipt}`,
            notes: notes
        };
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        throw error;
    }
};

/**
 * Verify Razorpay Payment Signature
 */
const verifySignature = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    return expectedSignature === razorpay_signature;
};

module.exports = {
    createOrder,
    verifySignature,
    razorpay
};
