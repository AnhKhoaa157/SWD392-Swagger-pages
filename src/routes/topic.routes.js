/**
 * Topic Routes
 * API endpoints for topic/project management
 */

const express = require('express');
const router = express.Router();
const {
    getAllTopics,
    getTopicById,
    createTopic,
    updateTopic,
    deleteTopic,
    approveTopic,
    rejectTopic,
    registerTopicForGroup
} = require('../controllers/topic.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Topics
 *   description: Project/Topic management (Lecturer creates → Manager approves → Groups register)
 */

/**
 * @swagger
 * /api/topics:
 *   get:
 *     summary: Get all topics with optional filters
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by status
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: integer
 *         description: Filter by semester ID
 *     responses:
 *       200:
 *         description: List of topics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       topicName:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [PENDING, APPROVED, REJECTED]
 *                       classId:
 *                         type: integer
 *                       proposedBy:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */
router.route('/').get(authenticate, getAllTopics).post(authenticate, authorize('lecturer'), createTopic);

/**
 * @swagger
 * /api/topics/{id}:
 *   get:
 *     summary: Get topic by ID
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Topic details
 *       404:
 *         description: Topic not found
 *       401:
 *         description: Unauthorized
 */
router.route('/:id').get(authenticate, getTopicById).put(authenticate, authorize('lecturer'), updateTopic).delete(authenticate, authorize('lecturer', 'manager'), deleteTopic);

/**
 * @swagger
 * /api/topics:
 *   post:
 *     summary: Create new topic (Lecturer only)
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicName
 *               - classId
 *             properties:
 *               topicName:
 *                 type: string
 *                 example: E-Learning Platform
 *               description:
 *                 type: string
 *                 example: Build an interactive e-learning web application
 *               classId:
 *                 type: integer
 *                 description: Class ID where topic belongs
 *     responses:
 *       201:
 *         description: Topic created successfully (status=PENDING)
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - lecturer access required
 */

/**
 * @swagger
 * /api/topics/{id}:
 *   put:
 *     summary: Update topic (Lecturer only - creator)
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topicName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Topic updated successfully
 *       404:
 *         description: Topic not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only creator can update
 */

/**
 * @swagger
 * /api/topics/{id}:
 *   delete:
 *     summary: Delete topic (Lecturer creator or Manager)
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Topic deleted successfully
 *       404:
 *         description: Topic not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/topics/{id}/approve:
 *   put:
 *     summary: Approve topic (Manager only)
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Topic approved successfully (status changed to APPROVED)
 *       404:
 *         description: Topic not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - manager access required
 */
router.put('/:id/approve', authenticate, authorize('manager'), approveTopic);

/**
 * @swagger
 * /api/topics/{id}/reject:
 *   put:
 *     summary: Reject topic (Manager only)
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Topic rejected successfully (status changed to REJECTED)
 *       404:
 *         description: Topic not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - manager access required
 */
router.put('/:id/reject', authenticate, authorize('manager'), rejectTopic);

/**
 * @swagger
 * /api/topics/{id}/register:
 *   post:
 *     summary: Register topic for group (Student only, topic must be APPROVED)
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *             properties:
 *               groupId:
 *                 type: integer
 *                 description: Student group ID registering for this topic
 *     responses:
 *       200:
 *         description: Topic registered for group successfully
 *       400:
 *         description: Topic not approved or already registered
 *       404:
 *         description: Topic not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - student access required
 */
router.post('/:id/register', authenticate, authorize('student'), registerTopicForGroup);

module.exports = router;
