
const nodemailer = require('nodemailer');
const { getWelcomeTemplate, getOtpTemplate } = require('./emailTemplates');

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
    }
};

module.exports = emailService;
