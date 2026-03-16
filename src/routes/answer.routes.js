/**
 * Answer Routes
 * API endpoints for Q&A answers
 */

const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answer.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Answers
 *   description: Q&A Answers Management
 */

/**
 * @swagger
 * /api/questions/{questionId}/answers:
 *   get:
 *     summary: Get all answers for a question
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of answers
 */
router.get('/questions/:questionId/answers', authenticate, answerController.getAnswersByQuestion);

/**
 * @swagger
 * /api/questions/{questionId}/answers:
 *   post:
 *     summary: Create answer to a question
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: questionId
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
 *               - answeredBy
 *             properties:
 *               content:
 *                 type: string
 *               answeredBy:
 *                 type: integer
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *               markAsResolved:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Answer created
 */
router.post('/questions/:questionId/answers', authenticate, authorize('lecturer', 'manager'), answerController.createAnswer);

/**
 * @swagger
 * /api/answers/{id}:
 *   put:
 *     summary: Update answer
 *     tags: [Answers]
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
 *               content:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Answer updated
 */
router.put('/answers/:id', authenticate, authorize('lecturer', 'manager'), answerController.updateAnswer);

/**
 * @swagger
 * /api/answers/{id}/toggle-visibility:
 *   put:
 *     summary: Toggle answer visibility (public/private)
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Visibility toggled
 */
router.put('/answers/:id/toggle-visibility', authenticate, authorize('lecturer', 'manager'), answerController.toggleAnswerVisibility);

/**
 * @swagger
 * /api/answers/{id}:
 *   delete:
 *     summary: Delete answer
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Answer deleted
 */
router.delete('/answers/:id', authenticate, authorize('lecturer', 'manager'), answerController.deleteAnswer);

/**
 * @swagger
 * /api/answers/public:
 *   get:
 *     summary: Get all public answers
 *     tags: [Answers]
 *     responses:
 *       200:
 *         description: List of public answers
 */
router.get('/answers/public', authenticate, answerController.getPublicAnswers);

module.exports = router;
