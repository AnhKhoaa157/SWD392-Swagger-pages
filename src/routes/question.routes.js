/**
 * Question Routes
 * API endpoints for Q&A questions (student ask → lecturer answer or escalate to manager)
 */

const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Q&A Questions Management (Student ask → Lecturer/Manager answer or escalate)
 */

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get all questions (with optional filters)
 *     description: Students see questions in their groups; Lecturers see questions in their classes
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [WAITING_LECTURER, ESCALATED_TO_MANAGER, RESOLVED]
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of questions
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
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       status:
 *                         type: string
 *                       groupId:
 *                         type: integer
 *                       askedBy:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, questionController.getAllQuestions);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get question by ID with answers
 *     tags: [Questions]
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
 *         description: Question details with answers
 *       404:
 *         description: Question not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticate, questionController.getQuestionById);

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create new question (Student only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - groupId
 *               - askedBy
 *             properties:
 *               title:
 *                 type: string
 *                 example: How to implement JWT?
 *               content:
 *                 type: string
 *                 example: I need help understanding JWT implementation...
 *               groupId:
 *                 type: integer
 *               askedBy:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Question created successfully (status=WAITING_LECTURER)
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - student access required
 */
router.post('/', authenticate, authorize('student'), questionController.createQuestion);

/**
 * @swagger
 * /api/questions/{id}/ask-ai:
 *   post:
 *     summary: Get AI-generated answer draft (Lecturer or Manager)
 *     description: Generate a draft response using Gemini AI based on the question context. Lecturer can get AI assist for own class questions.
 *     tags: [Questions]
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
 *         description: AI draft response generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     draft:
 *                       type: string
 *                       description: AI-generated draft answer
 *       404:
 *         description: Question not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - lecturer (for own class) or manager access required
 *       500:
 *         description: AI service error
 */
router.post('/:id/ask-ai', authenticate, authorize('lecturer', 'manager'), questionController.askAIForQuestion);

/**
 * @swagger
 * /api/questions/{id}/escalate:
 *   put:
 *     summary: Escalate question to Manager (Lecturer only)
 *     description: Move question from WAITING_LECTURER to ESCALATED_TO_MANAGER status
 *     tags: [Questions]
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
 *         description: Question escalated successfully
 *       404:
 *         description: Question not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - lecturer access required
 */
router.put('/:id/escalate', authenticate, authorize('lecturer'), questionController.escalateQuestion);

/**
 * @swagger
 * /api/questions/{id}/answers:
 *   post:
 *     summary: Post answer to question (Lecturer or Manager)
 *     description: Post an answer with optional immediate resolve. Manager can answer escalated tickets.
 *     tags: [Questions]
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *               markAsResolved:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Answer posted successfully
 *       404:
 *         description: Question not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - lecturer or manager access required
 */

/**
 * @swagger
 * /api/questions/{id}/resolve:
 *   put:
 *     summary: Mark question as resolved (Lecturer or Manager)
 *     tags: [Questions]
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
 *         description: Question marked as resolved
 *       404:
 *         description: Question not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - lecturer or manager access required
 */
router.put('/:id/resolve', authenticate, authorize('lecturer', 'manager'), questionController.resolveQuestion);

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete question (Manager only)
 *     tags: [Questions]
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
 *         description: Question deleted successfully
 *       404:
 *         description: Question not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - manager access required
 */
router.delete('/:id', authenticate, authorize('manager'), questionController.deleteQuestion);

module.exports = router;
