const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const { User } = require('../models');
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
        try {
            const { studentCode, fullName, email, password } = userData;

            // Check if student code already exists (if provided)
            if (studentCode) {
                const existingStudentCode = await User.findOne({ where: { studentCode } });
                if (existingStudentCode) {
                    throw { statusCode: 409, message: 'Student code already exists' };
                }
            }

            // Check if email already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                throw { statusCode: 409, message: MSG.AUTH.EMAIL_EXISTS };
            }

            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Calculate OTP expiration time
            const otpExpireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 10;
            const otpExpires = new Date(Date.now() + otpExpireMinutes * 60 * 1000);

            // Create new user with unverified email
            console.log('📝 Creating user with data:', { studentCode, fullName, email, role: 'student' });
            
            const user = await User.create({
                studentCode: studentCode || null,
                fullName,
                email,
                passwordHash: password,
                role: 'student', // Match database enum values: student, lecturer, manager
                isEmailVerified: false,
                otp,
                otpExpires
            });

            console.log('✅ User created successfully:', user.id);

            // Send OTP email
            try {
                await emailService.sendOTP(email, otp, fullName);
            } catch (error) {
                console.error('❌ Email service error:', error);
                // If email fails, delete the user
                await user.destroy();
                throw {
                    statusCode: error.statusCode || 503,
                    message: error.message || 'Failed to send OTP email. Please try again.'
                };
            }

            return {
                message: `Registration successful! OTP has been sent to ${email}. Please verify within ${otpExpireMinutes} minute${otpExpireMinutes === 1 ? '' : 's'}.`,
                email,
                userId: user.id
            };
        } catch (error) {
            // Log the error
            console.error('❌ RegisterUser service error:', error);
            
            // Re-throw if it's already a formatted error
            if (error.statusCode) {
                throw error;
            }
            
            // Throw a generic error
            throw { statusCode: 500, message: error.message || 'Registration failed' };
        }
    }

    /**
     * Verify OTP and complete registration
     * @param {string} email - User email
     * @param {string} otp - OTP code
     * @returns {Object} - User and tokens
     */
    async verifyOTP(email, otp) {
        // Find user with email and OTP
        const user = await User.findOne({ where: { email: email } });

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
        user.otp = null;
        user.otpExpires = null;

        // Generate tokens
        const tokens = this.generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        // Send welcome email (don't wait for it)
        emailService.sendWelcomeEmail(email, user.fullName).catch(err => {
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
        const user = await User.findOne({ where: { email } });

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
        await emailService.sendOTP(email, otp, user.fullName);

        return {
            message: `New OTP has been sent to ${email}. Please verify within ${otpExpireMinutes} minute${otpExpireMinutes === 1 ? '' : 's'}.`
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
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw { statusCode: 401, message: MSG.AUTH.INVALID_CREDENTIALS };
        }

        // Check if email is verified (skip for MANAGER role)
        if (!user.isEmailVerified && user.role !== 'MANAGER') {
            throw { statusCode: 403, message: 'Please verify your email before logging in' };
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw { statusCode: 401, message: MSG.AUTH.INVALID_CREDENTIALS };
        }

        // Update user status to Online
        user.status = 'Online';
        user.isOnline = true;
        user.lastSeenAt = new Date();

        // Generate tokens
        const tokens = this.generateTokens(user);

        // Save refresh token and online status to database
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return {
            user: user.toJSON(),
            ...tokens
        };
    }

    /**
     * Manager/Lecturer Login with role validation
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} requiredRole - Required role ('MANAGER' or 'LECTURER')
     * @returns {Object} - User and tokens
     */
    async adminLecturerLogin(email, password, requiredRole) {
        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw { statusCode: 401, message: MSG.AUTH.INVALID_CREDENTIALS };
        }

        // Check role authorization
        if (user.role !== requiredRole && user.role !== 'manager') {
            throw { statusCode: 403, message: `Access denied. Only ${requiredRole} users can login here.` };
        }

        // Check if email is verified (skip for manager role)
        if (!user.isEmailVerified && user.role !== 'manager') {
            throw { statusCode: 403, message: 'Please verify your email before logging in' };
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw { statusCode: 401, message: MSG.AUTH.INVALID_CREDENTIALS };
        }

        // Update user status to Online
        user.status = 'Online';
        user.isOnline = true;
        user.lastSeenAt = new Date();

        // Generate tokens
        const tokens = this.generateTokens(user);

        // Save refresh token and online status to database
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return {
            user: user.toJSON(),
            ...tokens
        };
    }

    /**
     * Logout user and update status to Offline
     * @param {string} refreshToken - Refresh token
     * @returns {Object} - Success message
     */
    async logoutUser(refreshToken) {
        if (!refreshToken) {
            throw { statusCode: 400, message: 'Refresh token is required' };
        }

        // Find user by refreshToken (works even when accessToken is expired)
        const user = await User.findOne({ where: { refreshToken } });

        if (!user) {
            // Token not found or already logged out - treat as success
            return { message: 'Logged out successfully' };
        }

        // Update user status to Offline (use update() to force all fields)
        await user.update({
            status: 'Offline',
            isOnline: false,
            lastSeenAt: new Date(),
            refreshToken: null
        });

        return {
            message: 'Logged out successfully'
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
        const user = await User.findByPk(decoded.userId);
        if (!user || user.refreshToken !== refreshToken) {
            throw { statusCode: 403, message: MSG.AUTH.INVALID_REFRESH_TOKEN };
        }

        // Generate new access token
        const accessToken = jwt.sign(
            {
                userId: user.id,
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
        const user = await User.findOne({ where: { email } });

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
        await emailService.sendPasswordResetOTP(email, otp, user.fullName);

        return {
            message: `OTP has been sent to ${email}. Please verify within ${otpExpireMinutes} minute${otpExpireMinutes === 1 ? '' : 's'}.`
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
        const user = await User.findOne({ where: { email } });

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

        // Update password and clear OTP
        user.passwordHash = newPassword;
        user.otp = null;
        user.otpExpires = null;
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
        const user = await User.findOne({ where: { email } });

        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }

        user.passwordHash = newPassword;
        user.refreshToken = null;
        await user.save();

        return {
            message: 'Password has been updated successfully.'
        };
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }

        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw { statusCode: 400, message: 'Current password is incorrect' };
        }

        user.passwordHash = newPassword;
        user.refreshToken = null;
        await user.save();

        return {
            message: 'Password changed successfully. Please login again.'
        };

        // Don't reveal if user exists (security best practice)
        if (!user) {
            return;
        }

        // Update password
        user.passwordHash = newPassword;
        user.refreshToken = null; // Invalidate all refresh tokens
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
                userId: user.id,
                email: user.email,
                role: user.role
            },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        const refreshToken = jwt.sign(
            {
                userId: user.id
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
