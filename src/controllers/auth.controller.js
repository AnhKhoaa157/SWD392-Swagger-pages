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
            if (!['Admin', 'Lecturer'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Role must be either Admin or Lecturer'
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
            const userId = req.user.userId;
            await require('../models').User.update(
                { lastSeenAt: new Date(), isOnline: true, status: 'Online' },
                { where: { userId } }
            );
            res.json({ success: true, message: 'Heartbeat received' });
        } catch (error) {
            res.status(500).json({ success: false, message: MSG.GENERAL.SERVER_ERROR });
        }
    }
}

module.exports = new AuthController();
