
const nodemailer = require('nodemailer');
const { getWelcomeTemplate, getOtpTemplate, getSettlementPaidTemplate, getForgotPasswordOtpTemplate } = require('./emailTemplates');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const emailService = {
    /**
     * Send OTP email for password reset
     */
    sendForgotPasswordOtpEmail: async (email, otp) => {
        try {
            const mailOptions = {
                from: `"MyBookings" <${process.env.SMTP_USER}>`,
                to: email,
                subject: `${otp} is your MyBookings password reset code`,
                html: getForgotPasswordOtpTemplate(otp),
            };

            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending forgot password OTP email:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send OTP email for registration
     */
    sendOtpEmail: async (email, otp) => {
        try {
            const mailOptions = {
                from: `"MyBookings" <${process.env.SMTP_USER}>`,
                to: email,
                subject: `${otp} is your MyBookings verification code`,
                html: getOtpTemplate(otp),
            };

            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending OTP email:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send Welcome/Plan Activation email
     */
    sendWelcomeEmail: async (email, userName, packageName, expiryDate) => {
        try {
            const mailOptions = {
                from: `"MyBookings" <${process.env.SMTP_USER}>`,
                to: email,
                subject: `Welcome to MyBookings! Plan Activated: ${packageName}`,
                html: getWelcomeTemplate(userName, packageName, expiryDate),
            };

            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send Settlement Paid confirmation email to business owner
     * @param {string} email - Owner's email
     * @param {string} userName - Owner's name
     * @param {string} businessName - Business name
     * @param {number} totalAmount - Total payout amount (after platform fees)
     * @param {number} paymentCount - Number of bookings settled
     * @param {object} accountDetails - { upi_id, account_holder_name, account_number, ifsc_code, bank_name }
     */
    sendSettlementEmail: async (email, userName, businessName, totalAmount, paymentCount, accountDetails = {}) => {
        try {
            const formattedAmount = parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const mailOptions = {
                from: `"MyBookings" <${process.env.SMTP_USER}>`,
                to: email,
                subject: `Settlement of ₹${formattedAmount} processed for ${businessName} — MyBookings`,
                html: getSettlementPaidTemplate(userName, businessName, totalAmount, paymentCount, accountDetails, new Date()),
            };

            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending settlement email:', error);
            return { success: false, error: error.message };
        }
    }
};

module.exports = emailService;

