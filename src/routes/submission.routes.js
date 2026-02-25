/**
 * Submission Routes
 */

const express = require('express');
const router = express.Router();
const {
    getAllSubmissions,
    getSubmissionById,
    createSubmission,
    updateSubmission,
    deleteSubmission,
    gradeSubmission
} = require('../controllers/submission.controller');

router.route('/').get(getAllSubmissions).post(createSubmission);
router.route('/:id').get(getSubmissionById).put(updateSubmission).delete(deleteSubmission);
router.put('/:id/grade', gradeSubmission);

module.exports = router;
