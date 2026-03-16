/**
 * Topic Routes
 */

const express = require('express');
const router = express.Router();
const {
    getAllTopics,
    getTopicById,
    createTopic,
    updateTopic,
    deleteTopic,
    approveTopic,
    rejectTopic,
    registerTopicForGroup
} = require('../controllers/topic.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.route('/').get(authenticate, getAllTopics).post(authenticate, authorize('lecturer'), createTopic);
router.route('/:id').get(authenticate, getTopicById).put(authenticate, authorize('lecturer'), updateTopic).delete(authenticate, authorize('lecturer', 'manager'), deleteTopic);
router.put('/:id/approve', authenticate, authorize('manager'), approveTopic);
router.put('/:id/reject', authenticate, authorize('manager'), rejectTopic);
router.post('/:id/register', authenticate, authorize('student'), registerTopicForGroup);

module.exports = router;
