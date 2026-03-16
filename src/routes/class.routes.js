/**
 * Class Routes
 * Routes for class CRUD operations
 */

const express = require('express');
const router = express.Router();
const {
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
} = require('../controllers/class.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: Class management (Manager creates classes - Lecturer teaches them)
 */

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Get all classes
 *     description: Students see all available classes; Lecturers see their own classes; Manager sees all classes
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: integer
 *         description: Filter by semester ID
 *       - in: query
 *         name: lecturerId
 *         schema:
 *           type: integer
 *         description: Filter by lecturer ID
 *     responses:
 *       200:
 *         description: List of classes
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
 *                       className:
 *                         type: string
 *                       lecturerId:
 *                         type: integer
 *                       semesterId:
 *                         type: integer
 *                       capacity:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.route('/').get(authenticate, getAllClasses).post(authenticate, authorize('manager'), createClass);

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create new class (Manager only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - className
 *               - lecturerId
 *               - semesterId
 *             properties:
 *               className:
 *                 type: string
 *                 example: SE1111 Web Development
 *               description:
 *                 type: string
 *               lecturerId:
 *                 type: integer
 *                 description: ID of lecturer teaching this class
 *               semesterId:
 *                 type: integer
 *                 description: ID of semester this class belongs to
 *               capacity:
 *                 type: integer
 *                 description: Maximum students in class
 *       responses:
 *         201:
 *           description: Class created successfully
 *         400:
 *           description: Bad request
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden - manager access required
 */

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     tags: [Classes]
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
 *         description: Class details
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 */
router.route('/:id').get(authenticate, getClassById).put(authenticate, authorize('manager'), updateClass).delete(authenticate, authorize('manager'), deleteClass);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Update class (Manager only)
 *     tags: [Classes]
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
 *               className:
 *                 type: string
 *               description:
 *                 type: string
 *               lecturerId:
 *                 type: integer
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - manager access required
 */

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Delete class (Manager only)
 *     tags: [Classes]
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
 *         description: Class deleted successfully
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - manager access required
 */

module.exports = router;
