/**
 * Task Routes
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

router.get('/', authenticate, getAllTasks);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, authorize('student'), createTask);
router.put('/:id', authenticate, authorize('student'), updateTask);
router.delete('/:id', authenticate, authorize('student'), deleteTask);

module.exports = router;
