const express = require('express');
const router = express.Router();

// Import routes (ONLY FOR 2 CORE BUSINESS FLOWS)
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const semesterRoutes = require('./semester.routes');
const classRoutes = require('./class.routes');
const topicRoutes = require('./topic.routes');
const groupRoutes = require('./group.routes');
const questionRoutes = require('./question.routes');
const answerRoutes = require('./answer.routes');
const submissionRoutes = require('./submission.routes');
const taskRoutes = require('./task.routes');

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// FLOW 1: Topic Management
router.use('/semesters', semesterRoutes);
router.use('/classes', classRoutes);
router.use('/topics', topicRoutes);
router.use('/groups', groupRoutes);

// FLOW 2: Q&A Hierarchical System
router.use('/questions', questionRoutes);
router.use('/', answerRoutes); // Includes /questions/:id/answers and /answers/:id

// FLOW 3: Submission Management
router.use('/submissions', submissionRoutes);

// FLOW 4: Task Board Management
router.use('/tasks', taskRoutes);

module.exports = router;
