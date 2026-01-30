// ============================================
// FILE: send-email.js (Backend - Node.js)
// ============================================

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));

// ==================== EMAIL CONFIGURATION ====================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    },
    // Optional: untuk debug
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
});

// Test koneksi
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email service error:', error);
    } else {
        console.log('✅ Email service ready');
    }
});

// ==================== RATE LIMITING ====================
const sendAttempts = {};

function canSendCode(email) {
    const now = Date.now();
    
    if (!sendAttempts[email]) {
        sendAttempts[email] = [now];
        return { allowed: true, message: 'Code sent' };
    }
    
    // Filter attempts dalam 5 menit terakhir
    const recentAttempts = sendAttempts[email].filter(
        time => now - time < 5 * 60 * 1000
    );
    
    // Max 3 attempts per 5 minutes
    if (recentAttempts.length >= 3) {
        const oldestAttempt = recentAttempts[0];
        const waitTime = Math.ceil((5 * 60 * 1000 - (now - oldestAttempt)) / 1000);
        return {
            allowed: false,
            message: `Please wait ${waitTime} seconds before trying again`
        };
    }
    
    recentAttempts.push(now);
    sendAttempts[email] = recentAttempts;
    
    return { allowed: true, message: 'Code sent' };
}

// Cleanup old attempts setiap jam
setInterval(() => {
    const now = Date.now();
    Object.keys(sendAttempts).forEach(email => {
        sendAttempts[email] = sendAttempts[email].filter(
            time => now - time < 60 * 60 * 1000 // Keep 1 hour of data
        );
        if (sendAttempts[email].length === 0) {
            delete sendAttempts[email];
        }
    });
}, 60 * 60 * 1000);

// ==================== EMAIL TEMPLATE ====================
function getVerificationEmailHTML(verificationCode, userName = '') {
    return `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .card { background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #7c3aed; margin: 0; font-size: 28px; }
                .header p { color: #666; margin: 5px 0 0 0; font-size: 14px; }
                .content { margin: 20px 0; color: #333; line-height: 1.6; }
                .code-box { 
                    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                    padding: 30px;
                    text-align: center;
                    border-radius: 8px;
                    margin: 30px 0;
                }
                .code-box p { color: rgba(255,255,255,0.9); margin: 0 0 10px 0; font-size: 14px; }
                .code { color: white; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; }
                .info-box { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .info-box p { color: #666; margin: 0; font-size: 14px; }
                .warning { color: #999; font-size: 13px; line-height: 1.6; margin: 20px 0; }
                .footer { border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px; }
                .footer a { color: #7c3aed; text-decoration: none; }
                .icon { font-size: 20px; margin-right: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="card">
                    <div class="header">
                        <h1>🔐 Chaos of Evoourth's</h1>
                        <p>Reset Password Request</p>
                    </div>

                    <div class="content">
                        <p>Halo${userName ? ' ' + userName : ''},</p>
                        <p>Kami menerima permintaan untuk mereset password akun Anda pada platform Chaos of Evoourth's.</p>
                    </div>

                    <div class="code-box">
                        <p>Kode Verifikasi Anda</p>
                        <div class="code">${verificationCode}</div>
                    </div>

                    <div class="info-box">
                        <p><span class="icon">⏱️</span> Kode ini berlaku selama <strong>10 menit</strong></p>
                    </div>

                    <div class="warning">
                        <p><strong>⚠️ Penting:</strong></p>
                        <p>Jika Anda tidak meminta reset password, abaikan email ini dan password Anda akan tetap aman. Jangan bagikan kode ini kepada siapa pun.</p>
                    </div>

                    <div class="footer">
                        <p>© 2024 Chaos of Evoourth's. All rights reserved.<br>
                        <a href="https://chaosoevoourths.com">Visit our website</a></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ==================== ROUTES ====================

/**
 * POST /api/send-verification-email
 * Send verification code to user email
 */
app.post('/api/send-verification-email', async (req, res) => {
    try {
        const { recipientEmail, verificationCode, userName } = req.body;

        // Validation
        if (!recipientEmail || !verificationCode) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Rate limiting check
        const rateLimitCheck = canSendCode(recipientEmail);
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({
                success: false,
                error: rateLimitCheck.message,
                retryAfter: 300
            });
        }

        // Prepare email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@chaosoevoourths.com',
            to: recipientEmail,
            subject: '🔐 Kode Reset Password - Chaos of Evoourth\'s',
            html: getVerificationEmailHTML(verificationCode, userName),
            text: `Kode verifikasi Anda: ${verificationCode}\n\nKode ini berlaku selama 10 menit.`
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email sent to ${recipientEmail}:`, info.messageId);

        return res.json({
            success: true,
            message: 'Verification code sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Error sending email:', error);

        // Don't expose internal errors to client
        let errorMessage = 'Failed to send verification code';
        if (error.code === 'EAUTH') {
            errorMessage = 'Email service authentication failed';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Email service timeout';
        }

        return res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

/**
 * POST /api/send-contact-email
 * Send contact form email (contoh tambahan)
 */
app.post('/api/send-contact-email', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
            replyTo: email,
            subject: `Contact Form: ${subject}`,
            html: `
                <h2>New Contact Message</h2>
                <p><strong>From:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: 'Message sent successfully'
        });

    } catch (error) {
        console.error('❌ Error sending contact email:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    }
});

/**
 * GET /api/email-status
 * Check email service status
 */
app.get('/api/email-status', (req, res) => {
    transporter.verify((error) => {
        if (error) {
            return res.status(500).json({
                success: false,
                status: 'Error',
                message: error.message
            });
        } else {
            return res.json({
                success: true,
                status: 'Connected',
                message: 'Email service is ready'
            });
        }
    });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email service: ${process.env.EMAIL_USER}`);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    process.exit(0);
});
