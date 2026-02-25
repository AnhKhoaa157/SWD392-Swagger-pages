/**
 * Group Controller
 * Handles CRUD operations for groups
 */

const { Group, Class, Topic, GroupMember, User, Submission, Channel } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all groups
 * @route   GET /api/groups
 * @access  Public
 */
const getAllGroups = async (req, res) => {
    try {
        const { classId, topicId, status, search } = req.query;
        
        let whereClause = {};
        
        if (classId) whereClause.classId = classId;
        if (topicId) whereClause.topicId = topicId;
        if (status) whereClause.status = status;
        if (search) {
            whereClause[Op.or] = [
                { groupName: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }
        
        const groups = await Group.findAll({
            where: whereClause,
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['classId', 'className', 'status']
                },
                {
                    model: Topic,
                    as: 'topic',
                    attributes: ['topicId', 'title', 'status']
                },
                {
                    model: GroupMember,
                    as: 'members',
                    include: [{
                        model: User,
                        as: 'student',
                        attributes: ['userId', 'fullName', 'email', 'avatarURL']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            count: groups.length,
            data: groups
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching groups',
            error: error.message
        });
    }
};

/**
 * @desc    Get group by ID
 * @route   GET /api/groups/:id
 * @access  Public
 */
const getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const group = await Group.findByPk(id, {
            include: [
                {
                    model: Class,
                    as: 'class'
                },
                {
                    model: Topic,
                    as: 'topic'
                },
                {
                    model: GroupMember,
                    as: 'members',
                    include: [{
                        model: User,
                        as: 'student',
                        attributes: ['userId', 'fullName', 'email', 'avatarURL', 'isOnline']
                    }]
                },
                {
                    model: Submission,
                    as: 'submissions',
                    attributes: ['submissionId', 'milestoneId', 'grade', 'status', 'submissionAt']
                }
            ]
        });
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: group
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching group',
            error: error.message
        });
    }
};

/**
 * @desc    Create new group
 * @route   POST /api/groups
 * @access  Student
 */
const createGroup = async (req, res) => {
    try {
        const { classId, topicId, groupName, description, maxMembers } = req.body;
        
        if (!classId || !topicId || !groupName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide classId, topicId, and groupName'
            });
        }
        
        // Verify class exists
        const classData = await Class.findByPk(classId);
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        
        // Verify topic exists and is approved
        const topic = await Topic.findByPk(topicId);
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }
        
        if (topic.status !== 'Approved') {
            return res.status(400).json({
                success: false,
                message: 'Topic must be approved before creating a group'
            });
        }
        
        const group = await Group.create({
            classId,
            topicId,
            groupName,
            description,
            maxMembers: maxMembers || 5,
            status: 'Forming'
        });
        
        // Create a private channel for the group
        await Channel.create({
            groupId: group.groupId,
            name: `${groupName}-private`,
            type: 'PRIVATE'
        });
        
        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: group
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating group',
            error: error.message
        });
    }
};

/**
 * @desc    Update group
 * @route   PUT /api/groups/:id
 * @access  Group Leader/Lecturer/Admin
 */
const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const group = await Group.findByPk(id);
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        await group.update(updates);
        
        res.status(200).json({
            success: true,
            message: 'Group updated successfully',
            data: group
        });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating group',
            error: error.message
        });
    }
};

/**
 * @desc    Delete group
 * @route   DELETE /api/groups/:id
 * @access  Lecturer/Admin
 */
const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        
        const group = await Group.findByPk(id);
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        await group.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Group deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting group',
            error: error.message
        });
    }
};

/**
 * @desc    Add member to group
 * @route   POST /api/groups/:id/members
 * @access  Group Leader/Student
 */
const addGroupMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Check if group exists
        const group = await Group.findByPk(id, {
            include: [{ model: GroupMember, as: 'members' }]
        });
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        // Check if group is full
        if (group.members && group.members.length >= group.maxMembers) {
            return res.status(400).json({
                success: false,
                message: 'Group is full'
            });
        }
        
        // Check if user is a student
        const user = await User.findByPk(userId);
        if (!user || user.role !== 'Student') {
            return res.status(404).json({
                success: false,
                message: 'User not found or invalid role'
            });
        }
        
        // Check if already a member
        const existingMember = await GroupMember.findOne({
            where: { groupId: id, studentId: userId }
        });
        
        if (existingMember) {
            return res.status(409).json({
                success: false,
                message: 'User is already a member of this group'
            });
        }
        
        const member = await GroupMember.create({
            groupId: id,
            studentId: userId,
            role: role || 'Member',
            status: 'Active'
        });
        
        res.status(201).json({
            success: true,
            message: 'Member added to group successfully',
            data: member
        });
    } catch (error) {
        console.error('Error adding group member:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding group member',
            error: error.message
        });
    }
};

/**
 * @desc    Remove member from group
 * @route   DELETE /api/groups/:id/members/:memberId
 * @access  Group Leader/Lecturer/Admin
 */
const removeGroupMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        
        const member = await GroupMember.findOne({
            where: { id: memberId, groupId: id }
        });
        
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Group member not found'
            });
        }
        
        await member.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Member removed from group successfully'
        });
    } catch (error) {
        console.error('Error removing group member:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing group member',
            error: error.message
        });
    }
};

/**
 * @desc    Get group members
 * @route   GET /api/groups/:id/members
 * @access  Public
 */
const getGroupMembers = async (req, res) => {
    try {
        const { id } = req.params;
        
        const members = await GroupMember.findAll({
            where: { groupId: id },
            include: [{
                model: User,
                as: 'student',
                attributes: ['userId', 'fullName', 'email', 'avatarURL', 'isOnline', 'status']
            }],
            order: [['role', 'DESC'], ['joinedAt', 'ASC']]
        });
        
        res.status(200).json({
            success: true,
            count: members.length,
            data: members
        });
    } catch (error) {
        console.error('Error fetching group members:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching group members',
            error: error.message
        });
    }
};

module.exports = {
    getAllGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    addGroupMember,
    removeGroupMember,
    getGroupMembers
};
