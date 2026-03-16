/**
 * Group Routes
 * API endpoints for student group management
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

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Student group management (self-created, members can join/leave)
 */

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get all groups
 *     description: Students see their own groups; Lecturers see groups in their classes
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       groupName:
 *                         type: string
 *                       classId:
 *                         type: integer
 *                       leaderId:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.route('/').get(authenticate, getAllGroups).post(authenticate, authorize('student'), createGroup);

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create new group (Student only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupName
 *               - classId
 *             properties:
 *               groupName:
 *                 type: string
 *                 example: Project Team A
 *               classId:
 *                 type: integer
 *                 example: 1
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - student access required
 */

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get group by ID with members
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Group details with members
 *       404:
 *         description: Group not found
 *       401:
 *         description: Unauthorized
 */
router.route('/:id').get(authenticate, getGroupById).put(authenticate, authorize('student', 'lecturer', 'manager'), updateGroup).delete(authenticate, authorize('lecturer', 'manager'), deleteGroup);

/**
 * @swagger
 * /api/groups/{id}:
 *   put:
 *     summary: Update group (Leader or Manager)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       404:
 *         description: Group not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/groups/{id}:
 *   delete:
 *     summary: Delete group (Lecturer in class or Manager only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       404:
 *         description: Group not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/groups/{id}/members:
 *   get:
 *     summary: Get group members
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of group members
 *       404:
 *         description: Group not found
 *       401:
 *         description: Unauthorized
 */
router.route('/:id/members').get(authenticate, getGroupMembers).post(authenticate, authorize('student'), addGroupMember);

/**
 * @swagger
 * /api/groups/{id}/members:
 *   post:
 *     summary: Add member to group (Student can add themselves)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *             properties:
 *               memberId:
 *                 type: integer
 *                 description: User ID to add to group
 *     responses:
 *       200:
 *         description: Member added successfully
 *       400:
 *         description: Bad request or member already in group
 *       404:
 *         description: Group not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/groups/{id}/members/{memberId}:
 *   delete:
 *     summary: Remove member from group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       404:
 *         description: Group or member not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - leader or manager access required
 */
router.delete('/:id/members/:memberId', authenticate, authorize('student', 'lecturer', 'manager'), removeGroupMember);

module.exports = router;
