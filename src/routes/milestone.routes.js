/**
 * Milestone Routes
 */

const express = require('express');
const router = express.Router();
const {
    getAllMilestones,
    getMilestoneById,
    createMilestone,
    updateMilestone,
    deleteMilestone
} = require('../controllers/milestone.controller');

router.route('/').get(getAllMilestones).post(createMilestone);
router.route('/:id').get(getMilestoneById).put(updateMilestone).delete(deleteMilestone);

module.exports = router;
