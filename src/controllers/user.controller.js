const userService = require('../services/user.service');
const MSG = require('../constants/messages');

/**
 * User Controller
 * Handles HTTP requests for user operations
 * Delegates business logic to UserService
 */

class UserController {
    // Get all users (Admin only)
    async getAllUsers(req, res) {
        try {
            const users = await userService.getAllUsers();

            res.json({
                success: true,
                message: MSG.USER.LIST_RETRIEVED,
                count: users.length,
                data: users
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: MSG.GENERAL.SERVER_ERROR,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get user by ID
    async getUserById(req, res) {
        try {
            const user = await userService.getUserById(req.params.id);

            // Check permission
            if (!userService.canAccessUser(req.user, req.params.id)) {
                return res.status(403).json({
                    success: false,
                    message: MSG.AUTHORIZATION.OWN_PROFILE_ONLY
                });
            }

            res.json({
                success: true,
                message: MSG.USER.RETRIEVED,
                data: user
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

    // Get current user profile
    async getCurrentUser(req, res) {
        try {
            const user = await userService.getUserById(req.user._id);

            res.json({
                success: true,
                message: MSG.USER.PROFILE_RETRIEVED,
                data: user
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

    // Create new user (Admin only)
    async createUser(req, res) {
        try {
            const { studentCode, name, email, password, role } = req.body;

            // Input validation
            if (!studentCode || !name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required (studentCode, name, email, password)'
                });
            }

            // Validate student code format
            if (!/^SE\d{6}$/.test(studentCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Student code must be in format SE followed by 6 digits (e.g., SE150001)'
                });
            }

            // Call service layer
            const user = await userService.createUser({ studentCode, name, email, password, role });

            res.status(201).json({
                success: true,
                message: MSG.USER.CREATED,
                data: user
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

    // Update user
    async updateUser(req, res) {
        try {
            const userId = req.params.id;
            const { studentCode, name, email, password, role } = req.body;

            // Validate student code format if provided
            if (studentCode && !/^SE\d{6}$/.test(studentCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Student code must be in format SE followed by 6 digits (e.g., SE150001)'
                });
            }

            // Check permission to update
            if (!userService.canAccessUser(req.user, userId)) {
                return res.status(403).json({
                    success: false,
                    message: MSG.AUTHORIZATION.OWN_PROFILE_ONLY
                });
            }

            // Check permission to change role
            if (role && !userService.canChangeRole(req.user)) {
                return res.status(403).json({
                    success: false,
                    message: MSG.AUTHORIZATION.ROLE_CHANGE_ADMIN_ONLY
                });
            }

            // Call service layer
            const user = await userService.updateUser(userId, { studentCode, name, email, password, role });

            res.json({
                success: true,
                message: MSG.USER.UPDATED,
                data: user
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

    // Delete user (Admin only)
    async deleteUser(req, res) {
        try {
            const user = await userService.deleteUser(req.params.id);

            res.json({
                success: true,
                message: MSG.USER.DELETED,
                data: user
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
}

module.exports = new UserController();
