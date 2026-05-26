const nodemailer = require('nodemailer');

const getWelcomeTemplate = (userName, packageName, expiryDate, features = []) => {
    const featureBadges = features.length
        ? features.map(f => `<span style="background:#ede9fe;color:#5b21b6;font-size:12px;padding:4px 10px;border-radius:20px;font-weight:500;">${f}</span>`).join('')
        : `
          <span style="background:#ede9fe;color:#5b21b6;font-size:12px;padding:4px 10px;border-radius:20px;font-weight:500;">Unlimited bookings</span>
          <span style="background:#ede9fe;color:#5b21b6;font-size:12px;padding:4px 10px;border-radius:20px;font-weight:500;">Staff management</span>
          <span style="background:#ede9fe;color:#5b21b6;font-size:12px;padding:4px 10px;border-radius:20px;font-weight:500;">Analytics</span>
        `;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MyBookings</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;">

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:24px 0;">
            <tr>
                <td align="center">
                    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10);">

                        <!-- Header -->
                        <tr>
                            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:44px 20px 36px;text-align:center;">
                                <img src="https://mybookings.allysoftsolutions.com/logo.png" alt="MyBookings" style="width:80px;height:80px;border-radius:12px;margin-bottom:12px;box-shadow:0 4px 10px rgba(0,0,0,0.2);">
                                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:6px;">MyBookings</div>
                                <div style="font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px;">You're all set, ${userName}!</div>
                                <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:8px;">Your premium experience begins now.</div>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:32px 32px 24px;">
                                <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.7;">We're thrilled to have you on board. Here's a summary of your plan:</p>

                                <!-- Plan Card -->
                                <div style="background:#f5f3ff;border-radius:10px;padding:20px 22px;border-left:4px solid #4f46e5;margin-bottom:24px;">
                                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                                        <img src="https://mybookings.allysoftsolutions.com/logo.png" alt="Plan" style="width:36px;height:36px;border-radius:6px;flex-shrink:0;">
                                        <div>
                                            <div style="font-weight:700;color:#4f46e5;font-size:16px;">${packageName}</div>
                                            <div style="color:#6b7280;font-size:13px;margin-top:2px;">Valid until: ${new Date(expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                        </div>
                                    </div>
                                    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                                        ${featureBadges}
                                    </div>
                                </div>

                                <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 28px;">You can now manage bookings, services, and staff with ease. Start exploring your dashboard to set up your business.</p>

                                <!-- CTA -->
                                <div style="text-align:center;">
                                    <a href="https://mybookings.allysoftsolutions.com/" style="display:inline-block;padding:14px 36px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.2px;">Go to Dashboard →</a>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
                                
                                <p style="color:#d1d5db;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} MyBookings by Allysoft Solutions. All rights reserved.</p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>

    </body>
    </html>
    `;
};

const getOtpTemplate = (otp) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email — MyBookings</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;">

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:24px 0;">
            <tr>
                <td align="center">
                    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10);">

                        <!-- Header -->
                        <tr>
                            <td style="background:#111827;padding:28px 20px;text-align:center;">
                                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;">MyBookings</div>
                                <div style="font-size:20px;font-weight:600;color:#fff;">Verify your email</div>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:36px 32px;text-align:center;">

                                <!-- Icon -->
                                <img src="https://mybookings.allysoftsolutions.com/logo.png" alt="Security" style="width:60px;height:60px;border-radius:10px;margin:0 auto 18px;display:block;">

                                <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 6px;">Use this one-time code to complete your sign-up.</p>
                                <p style="color:#6b7280;font-size:13px;margin:0 0 28px;">It expires in <strong style="color:#374151;">5 minutes</strong>. Do not share it with anyone.</p>

                                <!-- OTP Block -->
                                <div style="background:#f3f4f6;border:1.5px dashed #d1d5db;border-radius:12px;padding:28px 20px;margin:0 auto 28px;max-width:260px;">
                                    <div style="letter-spacing:12px;font-size:38px;font-weight:800;color:#111827;font-family:monospace;">${otp}</div>
                                    <div style="color:#9ca3af;font-size:12px;margin-top:10px;">One-Time Password</div>
                                </div>

                                <!-- Warning notice -->
                                <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;text-align:left;margin-bottom:8px;">
                                    <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">⚠️&nbsp; If you didn't request this code, you can safely ignore this email. Your account remains secure.</p>
                                </div>

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
                                <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Questions? Email us at <a href="mailto:support@mybookings.allysoft.in" style="color:#4f46e5;text-decoration:none;">support@mybookings.allysoft.in</a></p>
                                <p style="color:#d1d5db;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} MyBookings by Allysoft Solutions. All rights reserved.</p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>

    </body>
    </html>
    `;
};

const getSettlementPaidTemplate = (userName, businessName, totalAmount, paymentCount, accountDetails = {}, settledAt) => {
    const formattedAmount = parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedDate = new Date(settledAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Mask account number: show last 4 digits only
    const maskedAccount = accountDetails.account_number
        ? '••••' + accountDetails.account_number.slice(-4)
        : null;

    // Build payout destination block
    let payoutDestination = '';
    if (accountDetails.upi_id) {
        payoutDestination += `
            <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px;vertical-align:top;">UPI ID</td>
                <td style="padding:8px 0;font-weight:700;color:#111827;font-size:14px;font-family:monospace;">${accountDetails.upi_id}</td>
            </tr>`;
    }
    if (accountDetails.account_number) {
        payoutDestination += `
            <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">Account Holder</td>
                <td style="padding:8px 0;font-weight:700;color:#111827;font-size:14px;">${accountDetails.account_holder_name || '—'}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">Account No.</td>
                <td style="padding:8px 0;font-weight:700;color:#111827;font-size:14px;font-family:monospace;">${maskedAccount}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">IFSC Code</td>
                <td style="padding:8px 0;font-weight:700;color:#111827;font-size:14px;font-family:monospace;">${accountDetails.ifsc_code || '—'}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">Bank</td>
                <td style="padding:8px 0;font-weight:700;color:#111827;font-size:14px;">${accountDetails.bank_name || '—'}</td>
            </tr>`;
    }
    if (!accountDetails.upi_id && !accountDetails.account_number) {
        payoutDestination = `
            <tr>
                <td colspan="2" style="padding:8px 0;color:#9ca3af;font-size:13px;font-style:italic;">No payout account configured.</td>
            </tr>`;
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Settlement Paid — MyBookings</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;">

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:24px 0;">
            <tr>
                <td align="center">
                    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10);">

                        <!-- Header -->
                        <tr>
                            <td style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:44px 20px 36px;text-align:center;">
                                <img src="https://mybookings.allysoftsolutions.com/logo.png" alt="MyBookings" style="width:80px;height:80px;border-radius:12px;margin-bottom:12px;box-shadow:0 4px 10px rgba(0,0,0,0.2);">
                                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:6px;">MyBookings</div>
                                <div style="font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Settlement Successful!</div>
                                <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:8px;">Your payout has been processed.</div>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:32px 32px 24px;">
                                <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.7;">
                                    Hi <strong>${userName}</strong>, great news! A settlement payout for <strong>${businessName}</strong> has been successfully processed.
                                </p>

                                <!-- Amount Card -->
                                <div style="background:#ecfdf5;border-radius:10px;padding:20px 22px;border-left:4px solid #059669;margin-bottom:24px;text-align:center;">
                                    <div style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Amount Transferred</div>
                                    <div style="font-size:32px;font-weight:800;color:#059669;letter-spacing:-0.5px;">₹${formattedAmount}</div>
                                    <div style="color:#6b7280;font-size:13px;margin-top:6px;">${paymentCount} booking${paymentCount > 1 ? 's' : ''} settled</div>
                                </div>

                                <!-- Details Table -->
                                <div style="background:#f9fafb;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
                                    <div style="font-weight:700;color:#374151;font-size:14px;margin-bottom:12px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Transaction Details</div>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px;">Business</td>
                                            <td style="padding:8px 0;font-weight:700;color:#111827;font-size:14px;">${businessName}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Settled On</td>
                                            <td style="padding:8px 0;font-weight:700;color:#111827;font-size:14px;">${formattedDate}</td>
                                        </tr>
                                    </table>
                                </div>

                                <!-- Payout Account -->
                                <div style="background:#f9fafb;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
                                    <div style="font-weight:700;color:#374151;font-size:14px;margin-bottom:12px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Payout Account</div>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        ${payoutDestination}
                                    </table>
                                </div>

                                <p style="color:#6b7280;font-size:13px;line-height:1.7;margin:0 0 28px;">
                                    The above amount has been transferred after deducting applicable platform fees. If you have any questions regarding this settlement, please reach out to our support team.
                                </p>

                                <!-- CTA -->
                                <div style="text-align:center;">
                                    <a href="https://mybookings.allysoftsolutions.com/" style="display:inline-block;padding:14px 36px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.2px;">View Dashboard →</a>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
                                <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Questions? Email us at <a href="mailto:support@mybookings.allysoft.in" style="color:#059669;text-decoration:none;">support@mybookings.allysoft.in</a></p>
                                <p style="color:#d1d5db;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} MyBookings by Allysoft Solutions. All rights reserved.</p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>

    </body>
    </html>
    `;
};

module.exports = { getWelcomeTemplate, getOtpTemplate, getSettlementPaidTemplate };