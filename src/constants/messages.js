/**
 * Response Messages Constants
 * Centralized message management for consistent API responses
 */

module.exports = {
    // Authentication Messages
    AUTH: {
        REGISTER_SUCCESS: 'User account has been created successfully',
        LOGIN_SUCCESS: 'Authentication successful',
        LOGOUT_SUCCESS: 'Logged out successfully',
        TOKEN_REFRESHED: 'Access token refreshed successfully',
        INVALID_CREDENTIALS: 'Invalid email or password',
        EMAIL_REQUIRED: 'Email address is required',
        PASSWORD_REQUIRED: 'Password is required',
        NAME_REQUIRED: 'Full name is required',
        PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters',
        EMAIL_EXISTS: 'This email address is already registered',
        ALL_FIELDS_REQUIRED: 'All fields are required: name, email, and password',
        INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
        RESET_EMAIL_SENT: 'Password reset instructions have been sent to your email',
        RESET_TOKEN_INVALID: 'Password reset token is invalid or has expired',
        PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
        RESET_TOKEN_REQUIRED: 'Reset token is required',
        NEW_PASSWORD_REQUIRED: 'New password is required'
    },

    // User Messages
    USER: {
        CREATED: 'User created successfully',
        UPDATED: 'User profile updated successfully',
        DELETED: 'User account has been deleted',
        NOT_FOUND: 'User not found',
        RETRIEVED: 'User data retrieved successfully',
        LIST_RETRIEVED: 'Users list retrieved successfully',
        PROFILE_RETRIEVED: 'Profile data retrieved successfully'
    },

    // Authorization Messages
    AUTHORIZATION: {
        TOKEN_REQUIRED: 'Authentication token is required',
        INVALID_TOKEN: 'Invalid or expired authentication token',
        FORBIDDEN: 'You do not have permission to perform this action',
        ADMIN_ONLY: 'This action requires administrator privileges',
        OWN_PROFILE_ONLY: 'You can only access your own profile',
        ROLE_CHANGE_ADMIN_ONLY: 'Only administrators can change user roles'
    },

    // Validation Messages
    VALIDATION: {
        INVALID_EMAIL: 'Please provide a valid email address',
        INVALID_ID: 'Invalid ID format',
        MISSING_FIELDS: 'Required fields are missing'
    },

    // General Messages
    GENERAL: {
        SUCCESS: 'Operation completed successfully',
        SERVER_ERROR: 'An internal server error occurred',
        NOT_FOUND: 'The requested resource was not found',
        BAD_REQUEST: 'Invalid request parameters'
    }
};
