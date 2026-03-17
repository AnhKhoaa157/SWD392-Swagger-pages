const nodemailer = require('nodemailer');

const DEFAULT_EMAIL_TIMEOUT_MS = parseInt(process.env.EMAIL_TIMEOUT_MS, 10) || 10000;

const createEmailError = (message, code = 'EMAIL_DELIVERY_FAILED', statusCode = 503) => {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    return error;
};

const withTimeout = async (promise, timeoutMs, label) => {
    let timeoutId;

    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`${label} timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            })
        ]);
    } finally {
        clearTimeout(timeoutId);
    }
};

/**
 * Email Service
 * Handles sending emails using nodemailer
 */
class EmailService {
    constructor() {
        this.initError = null;

        try {
            const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];
            const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

            if (missingEnvVars.length > 0) {
                throw createEmailError(
                    `Missing email configuration: ${missingEnvVars.join(', ')}`,
                    'EMAIL_NOT_CONFIGURED',
                    503
                );
            }

            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT),
                secure: Number(process.env.EMAIL_PORT) === 465,
                connectionTimeout: DEFAULT_EMAIL_TIMEOUT_MS,
                greetingTimeout: DEFAULT_EMAIL_TIMEOUT_MS,
                socketTimeout: DEFAULT_EMAIL_TIMEOUT_MS,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
            console.log('✅ Email transporter initialized successfully');
        } catch (error) {
            console.error('❌ Email transporter initialization failed:', error);
            this.initError = error;
            this.transporter = null;
        }
    }

    /**
     * Send OTP email to user
     * @param {string} email - Recipient email
     * @param {string} otp - OTP code
     * @param {string} name - User name
     */
    async sendOTP(email, otp, name) {
        if (!this.transporter) {
            const initMessage = this.initError?.message || 'Email service is not configured';
            console.error('❌ Email transporter not initialized:', initMessage);
            throw createEmailError(
                `OTP email service is unavailable. ${initMessage}`,
                this.initError?.code || 'EMAIL_NOT_CONFIGURED',
                this.initError?.statusCode || 503
            );
        }
        
        const mailOptions = {
            from: `"SWD392 System" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Verify Your Email - SWD392',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p>Hi ${name},</p>
                    <p>Thank you for registering with SWD392 System. Please use the following OTP code to verify your email:</p>
                    
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #4CAF50; letter-spacing: 5px; margin: 0;">${otp}</h1>
                    </div>
                    
                    <p>This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES || 1} minute${process.env.OTP_EXPIRE_MINUTES == 1 ? '' : 's'}.</p>
                    
                    <p style="color: #666; font-size: 12px;">
                        If you didn't create an account, please ignore this email.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        This is an automated email, please do not reply.
                    </p>
                </div>
            `
        };

        try {
            const info = await withTimeout(
                this.transporter.sendMail(mailOptions),
                DEFAULT_EMAIL_TIMEOUT_MS,
                'OTP email send'
            );
            console.log(`✓ OTP email sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
            if (error.message.includes('timed out')) {
                throw createEmailError('OTP email delivery timed out. Please try again in a moment.', 'EMAIL_TIMEOUT', 504);
            }
            throw createEmailError('Failed to send OTP email. Please verify SMTP settings on server.', 'EMAIL_DELIVERY_FAILED', 503);
        }
    }

    /**
     * Send OTP for password reset
     * @param {string} email - Recipient email
     * @param {string} otp - OTP code
     * @param {string} name - User name
     */
    async sendPasswordResetOTP(email, otp, name) {
        if (!this.transporter) {
            const initMessage = this.initError?.message || 'Email service is not configured';
            throw createEmailError(
                `Password reset email service is unavailable. ${initMessage}`,
                this.initError?.code || 'EMAIL_NOT_CONFIGURED',
                this.initError?.statusCode || 503
            );
        }

        const mailOptions = {
            from: `"SWD392 System" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Password Reset OTP - SWD392',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hi ${name},</p>
                    <p>You requested to reset your password. Please use the following OTP code:</p>
                    
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #FF5722; letter-spacing: 5px; margin: 0;">${otp}</h1>
                    </div>
                    
                    <p>This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minute${process.env.OTP_EXPIRE_MINUTES == 1 ? '' : 's'}.</p>
                    
                    <p style="color: #666; font-size: 12px;">
                        If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        This is an automated email, please do not reply.
                    </p>
                </div>
            `
        };

        try {
            const info = await withTimeout(
                this.transporter.sendMail(mailOptions),
                DEFAULT_EMAIL_TIMEOUT_MS,
                'Password reset email send'
            );
            console.log(`✓ Password reset OTP sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Failed to send password reset OTP to ${email}:`, error.message);
            if (error.message.includes('timed out')) {
                throw createEmailError('Password reset email delivery timed out. Please try again in a moment.', 'EMAIL_TIMEOUT', 504);
            }
            throw createEmailError('Failed to send password reset OTP. Please verify SMTP settings on server.', 'EMAIL_DELIVERY_FAILED', 503);
        }
    }

    /**
     * Send welcome email after successful verification
     * @param {string} email - Recipient email
     * @param {string} name - User name
     */
    async sendWelcomeEmail(email, name) {
        const mailOptions = {
            from: `"SWDHubs System" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Welcome to SWDHubs!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to SWDHubs!</h2>
                    <p>Hi ${name},</p>
                    <p>Your email has been successfully verified. You can now access all features of the SWDHubs System.</p>
                    
                    <p>Happy learning!</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        This is an automated email, please do not reply.
                    </p>
                </div>
            `
        };

        try {
            const info = await withTimeout(
                this.transporter.sendMail(mailOptions),
                DEFAULT_EMAIL_TIMEOUT_MS,
                'Welcome email send'
            );
            console.log(`✓ Welcome email sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
            // Don't throw error for welcome email, it's not critical
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
