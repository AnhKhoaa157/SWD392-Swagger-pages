const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const semesterRoutes = require('./semester.routes');
const classRoutes = require('./class.routes');
const topicRoutes = require('./topic.routes');
const groupRoutes = require('./group.routes');
const milestoneRoutes = require('./milestone.routes');
const submissionRoutes = require('./submission.routes');
const channelRoutes = require('./channel.routes');
const messageRoutes = require('./message.routes');

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Academic Core routes
router.use('/semesters', semesterRoutes);
router.use('/classes', classRoutes);
router.use('/topics', topicRoutes);
router.use('/groups', groupRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/submissions', submissionRoutes);

// Chat Engine routes
router.use('/channels', channelRoutes);
router.use('/messages', messageRoutes);

module.exports = router;
