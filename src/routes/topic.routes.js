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
    rejectTopic
} = require('../controllers/topic.controller');

router.route('/').get(getAllTopics).post(createTopic);
router.route('/:id').get(getTopicById).put(updateTopic).delete(deleteTopic);
router.put('/:id/approve', approveTopic);
router.put('/:id/reject', rejectTopic);

module.exports = router;
