/**
 * Group Routes
 */

const express = require('express');
const router = express.Router();
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

router.route('/').get(getAllGroups).post(createGroup);
router.route('/:id').get(getGroupById).put(updateGroup).delete(deleteGroup);
router.route('/:id/members').get(getGroupMembers).post(addGroupMember);
router.delete('/:id/members/:memberId', removeGroupMember);

module.exports = router;
