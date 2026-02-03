const User = require('../models/user.model');
const MSG = require('../constants/messages');

/**
 * User Service
 * Handles business logic for user operations
 */

class UserService {
    /**
     * Get all users
     * @returns {Array} - List of all users
     */
    async getAllUsers() {
        const users = await User.find().sort({ createdAt: -1 });
        return users;
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Object} - User object
     */
    async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw { statusCode: 404, message: MSG.USER.NOT_FOUND };
        }
        return user;
    }

    /**
     * Create new user
     * @param {Object} userData - User data
     * @returns {Object} - Created user
     */
    async createUser(userData) {
        const { studentCode, name, email, password, role } = userData;

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

        // Create user
        const user = await User.create({ studentCode, name, email, password, role });
        return user;
    }

    /**
     * Update user
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Object} - Updated user
     */
    async updateUser(userId, updateData) {
        const { studentCode, name, email, password, role } = updateData;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            throw { statusCode: 404, message: MSG.USER.NOT_FOUND };
        }

        // Check if student code is being changed and already exists
        if (studentCode && studentCode !== user.studentCode) {
            const existingStudentCode = await User.findOne({ studentCode });
            if (existingStudentCode) {
                throw { statusCode: 409, message: 'Student code already exists' };
            }
        }

        // Check if email is being changed and already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw { statusCode: 409, message: MSG.AUTH.EMAIL_EXISTS };
            }
        }

        // Update fields
        if (studentCode) user.studentCode = studentCode;
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (password) user.password = password; // Will be hashed by pre-save hook

        await user.save();
        return user;
    }

    /**
     * Delete user
     * @param {string} userId - User ID
     * @returns {Object} - Deleted user
     */
    async deleteUser(userId) {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            throw { statusCode: 404, message: MSG.USER.NOT_FOUND };
        }
        return user;
    }

    /**
     * Check if user has permission to access resource
     * @param {Object} currentUser - Current logged in user
     * @param {string} targetUserId - Target user ID
     * @returns {boolean} - Has permission
     */
    canAccessUser(currentUser, targetUserId) {
        // Admin can access any user, regular users can only access themselves
        return currentUser.role === 'admin' || currentUser._id.toString() === targetUserId;
    }

    /**
     * Check if user can change role
     * @param {Object} currentUser - Current logged in user
     * @returns {boolean} - Can change role
     */
    canChangeRole(currentUser) {
        return currentUser.role === 'admin';
    }
}

module.exports = new UserService();
