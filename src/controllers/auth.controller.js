const authService = require('../services/auth.service');
const MSG = require('../constants/messages');

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 * Delegates business logic to AuthService
 */

class AuthController {
    // Register new user
    async register(req, res) {
        try {
            const { studentCode, fullName, email, password, confirmPassword } = req.body;

            // Input validation
            if (!fullName || !email || !password || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required (fullName, email, password, confirmPassword)'
                });
            }

            // Validate student code format if provided
            if (studentCode && !/^SE\d{6}$/.test(studentCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Student code must be in format SE followed by 6 digits (e.g., SE150001)'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: MSG.AUTH.PASSWORD_MIN_LENGTH
                });
            }

            // Validate password confirmation
            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Password and confirm password do not match'
                });
            }

            // Call service layer
            const result = await authService.registerUser({ studentCode, fullName, email, password });

            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            // Log error for debugging
            console.error('❌ Registration error:', error);
            
            // Handle service errors
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            // Handle Sequelize validation errors
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: error.errors ? error.errors[0].message : error.message
                });
            }

            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Input validation
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: MSG.AUTH.EMAIL_REQUIRED + ' and ' + MSG.AUTH.PASSWORD_REQUIRED.toLowerCase()
                });
            }

            // Call service layer
            const result = await authService.loginUser(email, password);

            res.json({
                success: true,
                message: MSG.AUTH.LOGIN_SUCCESS,
                data: result
            });
        } catch (error) {
            // Handle service errors
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Refresh access token
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            // Input validation
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: MSG.AUTH.INVALID_REFRESH_TOKEN
                });
            }

            // Call service layer
            const result = await authService.refreshAccessToken(refreshToken);

            res.json({
                success: true,
                message: MSG.AUTH.TOKEN_REFRESHED,
                data: result
            });
        } catch (error) {
            // Handle service errors
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Forgot password - send OTP to email
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            // Input validation
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Call service layer
            const result = await authService.sendPasswordResetOTP(email);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            // Handle service errors
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Reset password with OTP
    async resetPassword(req, res) {
        try {
            const { email, otp, newPassword } = req.body;

            // Input validation
            if (!email || !otp || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, OTP, and new password are required'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: MSG.AUTH.PASSWORD_MIN_LENGTH
                });
            }

            // Call service layer
            const result = await authService.verifyOTPAndResetPassword(email, otp, newPassword);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            // Handle service errors
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Verify OTP
    async verifyOTP(req, res) {
        try {
            const { email, otp } = req.body;

            // Input validation
            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required'
                });
            }

            // Call service layer
            const result = await authService.verifyOTP(email, otp);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            // Handle service errors
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Resend OTP
    async resendOTP(req, res) {
        try {
            const { email } = req.body;

            // Input validation
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Call service layer
            const result = await authService.resendOTP(email);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            // Handle service errors
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Admin/Lecturer Login
    async adminLecturerLogin(req, res) {
        try {
            const { email, password, role } = req.body;

            // Input validation
            if (!email || !password || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, password, and role are required'
                });
            }

            // Validate role
            if (!['manager', 'lecturer'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Role must be either manager or lecturer'
                });
            }

            // Call service layer
            const result = await authService.adminLecturerLogin(email, password, role);

            res.json({
                success: true,
                message: `${role} login successful`,
                data: result
            });
        } catch (error) {
            // Handle service errors
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Logout user
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            // Call service layer - find user by refreshToken
            const result = await authService.logoutUser(refreshToken);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            // Handle service errors
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Heartbeat - cập nhật lastSeenAt để giữ trạng thái Online
    async heartbeat(req, res) {
        try {
            const userId = req.user?.userId || req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }
            const { User } = require('../models');
            await User.update(
                { lastSeenAt: new Date(), isOnline: true, status: 'Online' },
                { where: { id: userId } }
            );
            res.json({ success: true, message: 'Heartbeat received' });
        } catch (error) {
            console.error('Heartbeat error:', error.message);
            res.status(500).json({ success: false, message: MSG.GENERAL.SERVER_ERROR });
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;

            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password, new password, and confirmation are required'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: MSG.AUTH.PASSWORD_MIN_LENGTH
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Password and confirm password do not match'
                });
            }

            const result = await authService.changePassword(
                req.user?.userId || req.user?.id,
                currentPassword,
                newPassword
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = new AuthController();
