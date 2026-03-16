/**
 * Task Routes
 * API endpoints for task management and group task board
 */

const express = require('express');
const router = express.Router();
const {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
} = require('../controllers/task.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Group task board management (Student-owned CRUD, Lecturer visibility)
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks visible to current user
 *     description: Students see tasks in their groups only; Lecturers see tasks from their class groups
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: Filter tasks by group ID
 *     responses:
 *       200:
 *         description: List of tasks
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
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE]
 *                       priority:
 *                         type: string
 *                         enum: [LOW, MEDIUM, HIGH]
 *                       groupId:
 *                         type: integer
 *                       assigneeId:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getAllTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticate, getTaskById);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create new task (Student only - in their group)
 *     tags: [Tasks]
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
 *               - groupId
 *             properties:
 *               title:
 *                 type: string
 *                 example: Complete project proposal
 *               description:
 *                 type: string
 *                 example: Finalize and submit project proposal
 *               groupId:
 *                 type: integer
 *                 example: 1
 *               assigneeId:
 *                 type: integer
 *                 description: Group member ID
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 default: MEDIUM
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE]
 *                 default: TODO
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - must be student member of group
 */
router.post('/', authenticate, authorize('student'), createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task (Student only - creator can update)
 *     tags: [Tasks]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               assigneeId:
 *                 type: integer
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only task creator can update
 */
router.put('/:id', authenticate, authorize('student'), updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task (Student only - creator can delete)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only task creator can delete
 */
router.delete('/:id', authenticate, authorize('student'), deleteTask);

module.exports = router;
