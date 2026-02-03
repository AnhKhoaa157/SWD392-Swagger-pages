const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

module.exports = router;
