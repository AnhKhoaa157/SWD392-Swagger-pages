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

// Import auth middleware (will be implemented later)
// const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

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
router.get('/', getAllSemesters);

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
router.get('/active', getActiveSemester);

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
router.get('/:id', getSemesterById);

/**
 * @swagger
 * /api/semesters:
 *   post:
 *     summary: Create new semester
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Upcoming, Active, Completed]
 *     responses:
 *       201:
 *         description: Semester created successfully
 */
router.post('/', createSemester); // Add authentication: authenticateToken, authorizeRoles('Admin')

/**
 * @swagger
 * /api/semesters/{id}:
 *   put:
 *     summary: Update semester
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Semester updated successfully
 */
router.put('/:id', updateSemester); // Add authentication: authenticateToken, authorizeRoles('Admin')

/**
 * @swagger
 * /api/semesters/{id}:
 *   delete:
 *     summary: Delete semester
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Semester deleted successfully
 */
router.delete('/:id', deleteSemester); // Add authentication: authenticateToken, authorizeRoles('Admin')

module.exports = router;
