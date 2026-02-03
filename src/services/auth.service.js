const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const User = require('../models/user.model');
const emailService = require('./email.service');
const MSG = require('../constants/messages');

/**
 * Authentication Service
 * Handles business logic for authentication operations
 */

class AuthService {
    /**
     * Register a new user with OTP verification
     * @param {Object} userData - User registration data
     * @returns {Object} - Message to check email
     */
    async registerUser(userData) {
        const { studentCode, name, email, password } = userData;

        // Check if student code already exists
        const existingStudentCode = await User.findOne({ studentCode });
        if (existingStudentCode) {
            throw { statusCode: 409, message: 'Student code already exists' };
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw { statusCode: 409, message: MSG.AUTH.EMAIL_EXISTS };
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Calculate OTP expiration time
        const otpExpireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 10;
        const otpExpires = new Date(Date.now() + otpExpireMinutes * 60 * 1000);

        // Determine if user is admin based on email from env
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const isAdmin = email === adminEmail;
        
        // Create new user
        const user = await User.create({
            studentCode,
            name,
            email,
            password,
            role: isAdmin ? 'admin' : 'user',
            isEmailVerified: isAdmin, // Admin emails are auto-verified
            otp: isAdmin ? undefined : otp, // No OTP for admins
            otpExpires: isAdmin ? undefined : otpExpires
        });

        // If admin, skip OTP and return tokens immediately
        if (isAdmin) {
            const tokens = this.generateTokens(user);

            return {
                message: 'Admin account created successfully!',
                user: {
                    id: user._id,
                    studentCode: user.studentCode,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn
            };
        }

        // For regular users, send OTP email
        try {
            await emailService.sendOTP(email, otp, name);
        } catch (error) {
            // If email fails, delete the user
            await User.findByIdAndDelete(user._id);
            throw { statusCode: 500, message: 'Failed to send OTP email. Please try again.' };
        }

        return {
            message: `Registration successful! OTP has been sent to ${email}. Please verify within ${otpExpireMinutes} minutes.`,
            email,
            userId: user._id
        };
    }

    /**
     * Verify OTP and complete registration
     * @param {string} email - User email
     * @param {string} otp - OTP code
     * @returns {Object} - User and tokens
     */
    async verifyOTP(email, otp) {
        // Find user with email and OTP
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }

        if (user.isEmailVerified) {
            throw { statusCode: 400, message: 'Email already verified. Please login.' };
        }

        if (!user.otp || !user.otpExpires) {
            throw { statusCode: 400, message: 'No OTP found. Please request a new one.' };
        }

        // Check if OTP expired
        if (new Date() > user.otpExpires) {
            throw { statusCode: 400, message: 'OTP has expired. Please request a new one.' };
        }

        // Verify OTP
        if (user.otp !== otp) {
            throw { statusCode: 400, message: 'Invalid OTP code' };
        }

        // Mark email as verified and clear OTP
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;

        // Generate tokens
        const tokens = this.generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        // Send welcome email (don't wait for it)
        emailService.sendWelcomeEmail(email, user.name).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

        return {
            message: 'Email verified successfully!',
            user: user.toJSON(),
            ...tokens
        };
    }

    /**
     * Resend OTP
     * @param {string} email - User email
     * @returns {Object} - Success message
     */
    async resendOTP(email) {
        const user = await User.findOne({ email });

        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }

        if (user.isEmailVerified) {
            throw { statusCode: 400, message: 'Email already verified. Please login.' };
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Calculate OTP expiration time
        const otpExpireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 10;
        const otpExpires = new Date(Date.now() + otpExpireMinutes * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send OTP email
        await emailService.sendOTP(email, otp, user.name);

        return {
            message: `New OTP has been sent to ${email}. Please verify within ${otpExpireMinutes} minutes.`
        };
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} - User and tokens
     */
    async loginUser(email, password) {
        // Find user by email (include password for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw { statusCode: 401, message: MSG.AUTH.INVALID_CREDENTIALS };
        }

        // Check if email is verified (skip for admin account)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        if (!user.isEmailVerified && email !== adminEmail) {
            throw { statusCode: 403, message: 'Please verify your email before logging in' };
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw { statusCode: 401, message: MSG.AUTH.INVALID_CREDENTIALS };
        }

        // Generate tokens
        const tokens = this.generateTokens(user);

        // Save refresh token to database
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return {
            user: user.toJSON(),
            ...tokens
        };
    }

    /**
     * Refresh access token
     * @param {string} refreshToken - Refresh token
     * @returns {Object} - New access token
     */
    async refreshAccessToken(refreshToken) {
        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
        } catch (error) {
            throw { statusCode: 403, message: MSG.AUTH.INVALID_REFRESH_TOKEN };
        }

        // Find user and validate refresh token
        const user = await User.findById(decoded.userId).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            throw { statusCode: 403, message: MSG.AUTH.INVALID_REFRESH_TOKEN };
        }

        // Generate new access token
        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        return {
            accessToken,
            expiresIn: jwtConfig.expiresIn
        };
    }

    /**
     * Send OTP for password reset
     * @param {string} email - User email
     * @returns {Object} - Success message
     */
    async sendPasswordResetOTP(email) {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }

        if (!user.isEmailVerified) {
            throw { statusCode: 400, message: 'Email not verified. Please complete registration first.' };
        }

        // Generate OTP for password reset
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Calculate OTP expiration time
        const otpExpireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 10;
        const otpExpires = new Date(Date.now() + otpExpireMinutes * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send OTP email for password reset
        await emailService.sendPasswordResetOTP(email, otp, user.name);

        return {
            message: `OTP has been sent to ${email}. Please verify within ${otpExpireMinutes} minutes.`
        };
    }

    /**
     * Verify OTP and reset password
     * @param {string} email - User email
     * @param {string} otp - OTP code
     * @param {string} newPassword - New password
     * @returns {Object} - Success message
     */
    async verifyOTPAndResetPassword(email, otp, newPassword) {
        // Find user with email and OTP
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }

        if (!user.otp || !user.otpExpires) {
            throw { statusCode: 400, message: 'No OTP found. Please request a new one.' };
        }

        // Check if OTP expired
        if (new Date() > user.otpExpires) {
            throw { statusCode: 400, message: 'OTP has expired. Please request a new one.' };
        }

        // Verify OTP
        if (user.otp !== otp) {
            throw { statusCode: 400, message: 'Invalid OTP code' };
        }

        // Update password, verify email, and clear OTP
        user.password = newPassword;
        user.isEmailVerified = true; // Auto-verify email after successful password reset
        user.otp = undefined;
        user.otpExpires = undefined;
        user.refreshToken = undefined; // Invalidate all refresh tokens
        await user.save();

        return {
            message: 'Password has been reset successfully. Please login with your new password.'
        };
    }

    /**
     * Reset password using email
     * @param {string} email - User email
     * @param {string} newPassword - New password
     */
    async resetPassword(email, newPassword) {
        // Find user by email
        const user = await User.findOne({ email });

        // Don't reveal if user exists (security best practice)
        if (!user) {
            return;
        }

        // Update password
        user.password = newPassword;
        user.refreshToken = undefined; // Invalidate all refresh tokens
        await user.save();
    }

    /**
     * Generate access and refresh tokens
     * @param {Object} user - User object
     * @returns {Object} - Access token and refresh token
     */
    generateTokens(user) {
        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        const refreshToken = jwt.sign(
            {
                userId: user._id
            },
            jwtConfig.refreshSecret,
            { expiresIn: jwtConfig.refreshExpiresIn }
        );

        return {
            accessToken,
            refreshToken,
            expiresIn: jwtConfig.expiresIn
        };
    }
}

module.exports = new AuthService();
