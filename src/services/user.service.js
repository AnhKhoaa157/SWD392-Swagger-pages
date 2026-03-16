const { User } = require('../models');
const MSG = require('../constants/messages');

/**
 * User Service
 * Handles business logic for user operations
 */

class UserService {
    /**
     * Check if user can access another user's profile
     * @param {Object} currentUser - Current logged-in user
     * @param {string} targetUserId - Target user ID to access
     * @returns {boolean} - True if access is allowed
     */
    canAccessUser(currentUser, targetUserId) {
        // Manager can access any profile
        if (currentUser.role === 'manager') {
            return true;
        }
        // Users can only access their own profile
        return currentUser.userId === parseInt(targetUserId);
    }

    /**
     * Get all users
     * @returns {Array} - List of all users
     */
    async getAllUsers() {
        const users = await User.findAll({ 
            order: [['created_at', 'DESC']],
            attributes: { exclude: ['passwordHash', 'refreshToken', 'otp', 'otpExpires'] }
        });
        return users;
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Object} - User object
     */
    async getUserById(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw { statusCode: 404, message: MSG.USER.NOT_FOUND };
        }
        return user.toJSON();
    }

    /**
     * Create new user
     * @param {Object} userData - User data
     * @returns {Object} - Created user
     */
    async createUser(userData) {
        const { studentCode, fullName, email, password, role } = userData;

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

        // Create user
        const user = await User.create({ 
            studentCode: studentCode || null, 
            fullName, 
            email, 
            passwordHash: password,
            role: role || 'Student',
            isEmailVerified: true // Auto-verify for admin-created users
        });
        return user.toJSON();
    }

    /**
     * Update user
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Object} - Updated user
     */
    async updateUser(userId, updateData) {
        const { studentCode, fullName, email, avatarURL } = updateData;

        // Find user
        const user = await User.findByPk(userId);
        if (!user) {
            throw { statusCode: 404, message: MSG.USER.NOT_FOUND };
        }

        // Check if student code is being changed and already exists
        if (studentCode && studentCode !== user.studentCode) {
            const existingStudentCode = await User.findOne({ 
                where: { studentCode }
            });
            if (existingStudentCode) {
                throw { statusCode: 409, message: 'Student code already exists' };
            }
        }

        // Check if email is being changed and already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                throw { statusCode: 409, message: MSG.AUTH.EMAIL_EXISTS };
            }
        }

        // Update fields
        if (studentCode !== undefined) user.studentCode = studentCode;
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (avatarURL !== undefined) user.avatarURL = avatarURL;

        await user.save();
        return user.toJSON();
    }

    /**
     * Update user role (Manager only)
     * @param {string} userId - User ID
     * @param {string} newRole - New role (student, lecturer, manager)
     * @returns {Object} - Updated user
     */
    async updateUserRole(userId, newRole) {
        // Validate role - use lowercase to match database
        const validRoles = ['student', 'lecturer', 'manager'];
        const normalizedRole = newRole.toLowerCase();
        if (!validRoles.includes(normalizedRole)) {
            throw { statusCode: 400, message: 'Invalid role. Must be student, lecturer, or manager' };
        }

        // Find user
        const user = await User.findByPk(userId);
        if (!user) {
            throw { statusCode: 404, message: MSG.USER.NOT_FOUND };
        }

        // Update role (use lowercase)
        user.role = normalizedRole;
        await user.save();

        return user.toJSON();
    }

    /**
     * Delete user
     * @param {string} userId - User ID
     * @returns {Object} - Deleted user
     */
    async deleteUser(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw { statusCode: 404, message: MSG.USER.NOT_FOUND };
        }
        await user.destroy();
        return user.toJSON();
    }
}

module.exports = new UserService();
