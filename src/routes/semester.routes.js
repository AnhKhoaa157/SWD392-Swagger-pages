/**
 * Semester Routes
 * Routes for semester CRUD operations
 */

const express = require('express');
const router = express.Router();
const {
    getAllSemesters,
    getSemesterById,
    createSemester,
    updateSemester,
    deleteSemester,
    getActiveSemester
} = require('../controllers/semester.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/semesters:
 *   get:
 *     summary: Get all semesters
 *     tags: [Semesters]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Upcoming, Active, Completed]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of semesters
 */
router.get('/', authenticate, getAllSemesters);

/**
 * @swagger
 * /api/semesters/active:
 *   get:
 *     summary: Get active semester
 *     tags: [Semesters]
 *     responses:
 *       200:
 *         description: Active semester details
 */
router.get('/active', authenticate, getActiveSemester);

/**
 * @swagger
 * /api/semesters/{id}:
 *   get:
 *     summary: Get semester by ID
 *     tags: [Semesters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Semester details
 *       404:
 *         description: Semester not found
 */
router.get('/:id', authenticate, getSemesterById);

/**
 * @swagger
 * /api/semesters:
 *   post:
 *     summary: Create new semester (Manager only)
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Semester created
 */
router.post('/', authenticate, authorize('manager'), createSemester);

/**
 * @swagger
 * /api/semesters/{id}:
 *   put:
 *     summary: Update semester (Manager only)
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, authorize('manager'), updateSemester);

/**
 * @swagger
 * /api/semesters/{id}:
 *   delete:
 *     summary: Delete semester (Manager only)
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, authorize('manager'), deleteSemester);

module.exports = router;
