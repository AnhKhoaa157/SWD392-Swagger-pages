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
 * /api/classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *   post:
 *     summary: Create new class (Manager only)
 *     tags: [Classes]
 */
router.route('/').get(authenticate, getAllClasses).post(authenticate, authorize('manager'), createClass);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     tags: [Classes]
 *   put:
 *     summary: Update class (Manager only)
 *     tags: [Classes]
 *   delete:
 *     summary: Delete class (Manager only)
 *     tags: [Classes]
 */
router.route('/:id').get(authenticate, getClassById).put(authenticate, authorize('manager'), updateClass).delete(authenticate, authorize('manager'), deleteClass);

module.exports = router;
