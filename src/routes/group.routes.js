/**
 * Group Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
    getAllGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    addGroupMember,
    removeGroupMember,
    getGroupMembers
} = require('../controllers/group.controller');

router.route('/').get(authenticate, getAllGroups).post(authenticate, authorize('student'), createGroup);
router.route('/:id').get(authenticate, getGroupById).put(authenticate, authorize('student', 'lecturer', 'manager'), updateGroup).delete(authenticate, authorize('lecturer', 'manager'), deleteGroup);
router.route('/:id/members').get(authenticate, getGroupMembers).post(authenticate, authorize('student'), addGroupMember);
router.delete('/:id/members/:memberId', authenticate, authorize('student', 'lecturer', 'manager'), removeGroupMember);

module.exports = router;
