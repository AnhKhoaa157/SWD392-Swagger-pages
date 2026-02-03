const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails using nodemailer
 */
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    /**
     * Send OTP email to user
     * @param {string} email - Recipient email
     * @param {string} otp - OTP code
     * @param {string} name - User name
     */
    async sendOTP(email, otp, name) {
        // FOR DEVELOPMENT: Print OTP to console if email not configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || process.env.EMAIL_USER === 'your-email@gmail.com') {
            console.log('\n' + '='.repeat(60));
            console.log('📧 OTP EMAIL - REGISTRATION (Development Mode)');
            console.log('='.repeat(60));
            console.log(`📨 To: ${email}`);
            console.log(`👤 Name: ${name}`);
            console.log(`🔑 OTP Code: ${otp}`);
            console.log(`⏰ Expires in: ${process.env.OTP_EXPIRE_MINUTES || 10} minutes`);
            console.log('='.repeat(60) + '\n');
            return { success: true, messageId: 'dev-mode' };
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
                    
                    <p>This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES || 1} minutes.</p>
                    
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
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✓ OTP email sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
            throw new Error('Failed to send OTP email');
        }
    }

    /**
     * Send OTP for password reset
     * @param {string} email - Recipient email
     * @param {string} otp - OTP code
     * @param {string} name - User name
     */
    async sendPasswordResetOTP(email, otp, name) {
        // FOR DEVELOPMENT: Print OTP to console if email not configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || process.env.EMAIL_USER === 'your-email@gmail.com') {
            console.log('\n' + '='.repeat(60));
            console.log('🔐 PASSWORD RESET OTP (Development Mode)');
            console.log('='.repeat(60));
            console.log(`📨 To: ${email}`);
            console.log(`👤 Name: ${name}`);
            console.log(`🔑 OTP Code: ${otp}`);
            console.log(`⏰ Expires in: ${process.env.OTP_EXPIRE_MINUTES || 10} minutes`);
            console.log('='.repeat(60) + '\n');
            return { success: true, messageId: 'dev-mode' };
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
                    
                    <p>This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
                    
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
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✓ Password reset OTP sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Failed to send password reset OTP to ${email}:`, error.message);
            throw new Error('Failed to send password reset OTP');
        }
    }

    /**
     * Send welcome email after successful verification
     * @param {string} email - Recipient email
     * @param {string} name - User name
     */
    async sendWelcomeEmail(email, name) {
        const mailOptions = {
            from: `"SWD392 System" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Welcome to SWD392!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to SWD392!</h2>
                    <p>Hi ${name},</p>
                    <p>Your email has been successfully verified. You can now access all features of the SWD392 System.</p>
                    
                    <p>Happy learning!</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        This is an automated email, please do not reply.
                    </p>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
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
