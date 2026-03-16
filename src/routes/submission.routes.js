/**
 * Submission Routes
 * API endpoints for assignment submissions and grading
 */

const express = require('express');
const router = express.Router();
const {
    getAllSubmissions,
    getSubmissionById,
    createSubmission,
    updateSubmission,
    deleteSubmission,
    gradeSubmission
} = require('../controllers/submission.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Assignment submission and grading management
 */

/**
 * @swagger
 * /api/submissions:
 *   get:
 *     summary: Get all submissions with optional filters
 *     description: Students see their own submissions; Lecturers see submissions from their classes
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: integer
 *         description: Filter by task ID
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: Filter by group ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUBMITTED, GRADED]
 *     responses:
 *       200:
 *         description: List of submissions
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
 *                       taskId:
 *                         type: integer
 *                       groupId:
 *                         type: integer
 *                       submittedBy:
 *                         type: integer
 *                       content:
 *                         type: string
 *                       status:
 *                         type: string
 *                       grade:
 *                         type: number
 *                       feedback:
 *                         type: string
 *                       submittedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getAllSubmissions);

/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     summary: Get submission by ID
 *     tags: [Submissions]
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
 *         description: Submission details
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticate, getSubmissionById);

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Submit assignment (Student only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - groupId
 *               - content
 *             properties:
 *               taskId:
 *                 type: integer
 *               groupId:
 *                 type: integer
 *               content:
 *                 type: string
 *                 description: Submission content (can include file URLs)
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: File URLs or attachments
 *     responses:
 *       201:
 *         description: Submission created successfully (status=SUBMITTED)
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - student access required
 */
router.post('/', authenticate, authorize('student'), createSubmission);

/**
 * @swagger
 * /api/submissions/{id}:
 *   put:
 *     summary: Update submission (Student - before graded, or Lecturer for grading)
 *     tags: [Submissions]
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
 *               content:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only before graded
 */
router.put('/:id', authenticate, authorize('student'), updateSubmission);

/**
 * @swagger
 * /api/submissions/{id}:
 *   delete:
 *     summary: Delete submission (Student - before graded)
 *     tags: [Submissions]
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
 *         description: Submission deleted successfully
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only before graded
 */
router.delete('/:id', authenticate, authorize('student'), deleteSubmission);

/**
 * @swagger
 * /api/submissions/{id}/grade:
 *   put:
 *     summary: Grade submission (Lecturer or Manager only)
 *     tags: [Submissions]
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
 *               - grade
 *             properties:
 *               grade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *                 example: 8.5
 *               feedback:
 *                 type: string
 *                 description: Grading feedback
 *     responses:
 *       200:
 *         description: Submission graded successfully (status changed to GRADED)
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - lecturer or manager access required
 */
router.put('/:id/grade', authenticate, authorize('lecturer', 'manager'), gradeSubmission);

module.exports = router;
