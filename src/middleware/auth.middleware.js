const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const { User } = require('../models');
const MSG = require('../constants/messages');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: MSG.AUTHORIZATION.TOKEN_REQUIRED
            });
        }

        // Verify token
        jwt.verify(token, jwtConfig.secret, async (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: MSG.AUTHORIZATION.INVALID_TOKEN
                });
            }

            // Get user from database (Sequelize syntax)
            const user = await User.findByPk(decoded.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: MSG.USER.NOT_FOUND
                });
            }

            // Attach user to request (lấy thông tin user mới nhất từ DB)
            req.user = user.toJSON();
            next();
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Authorization Middleware
 * Checks if user has required role
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: MSG.AUTHORIZATION.TOKEN_REQUIRED
            });
        }

        // Normalize roles to handle case-insensitive comparison
        const userRoleLower = req.user.role.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        if (!allowedRoles.includes(userRoleLower)) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize
};
