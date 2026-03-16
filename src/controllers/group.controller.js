/**
 * Group Controller
 * Handles CRUD operations for student groups
 */

const { StudentGroup, Class, Topic, GroupMember, User } = require('../models');
const { Op } = require('sequelize');
const MSG = require('../constants/messages');

const getRequesterId = (req) => req.user?.userId || req.user?.id;
const getRequesterRole = (req) => String(req.user?.role || '').toLowerCase();

const memberInclude = {
    model: User,
    as: 'members',
    attributes: ['id', 'fullName', 'email', 'isOnline'],
    through: {
        attributes: ['joinedAt']
    }
};

/**
 * @desc    Get all groups
 * @route   GET /api/groups
 * @access  Public
 */
const getAllGroups = async (req, res) => {
    try {
        const { classId, topicId, lecturerId, search } = req.query;
        const requesterRole = getRequesterRole(req);
        const requesterId = getRequesterId(req);

        let whereClause = {};
        const classWhere = {};

        if (classId) whereClause.classId = classId;
        if (topicId) whereClause.topicId = topicId;
        if (lecturerId) classWhere.lecturerId = lecturerId;
        if (requesterRole === 'lecturer' && !lecturerId) {
            classWhere.lecturerId = requesterId;
        }
        if (search) {
            whereClause.groupName = { [Op.like]: `%${search}%` };
        }

        if (requesterRole === 'student') {
            const memberships = await GroupMember.findAll({
                where: { studentId: requesterId },
                attributes: ['groupId']
            });

            const groupIds = memberships.map((item) => item.groupId);
            whereClause.id = groupIds.length > 0 ? { [Op.in]: groupIds } : -1;
        }

        const groups = await StudentGroup.findAll({
            where: whereClause,
            include: [
                {
                    model: Class,
                    as: 'class',
                    where: Object.keys(classWhere).length > 0 ? classWhere : undefined,
                    attributes: ['id', 'className']
                },
                {
                    model: Topic,
                    as: 'topic',
                    attributes: ['id', 'title', 'status']
                },
                memberInclude
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            count: groups.length,
            data: groups
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

        const group = await StudentGroup.findByPk(id, {
            include: [
                {
                    model: Class,
                    as: 'class'
                },
                {
                    model: Topic,
                    as: 'topic'
                },
                memberInclude
            ]
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND
            });
        }

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: group
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
        const { classId, topicId, groupName } = req.body;
        const creatorId = getRequesterId(req);

        if (!classId || !topicId || !groupName) {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'Missing classId, topicId, or groupName'
            });
        }

        // Verify class exists
        const classData = await Class.findByPk(classId);
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Class not found'
            });
        }

        // Verify topic exists and is approved
        const topic = await Topic.findByPk(topicId);
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Topic not found'
            });
        }

        const normalizedTopicStatus = String(topic.status || '').toUpperCase();
        if (normalizedTopicStatus !== 'APPROVED') {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'Topic must be approved before creating a group'
            });
        }

        // Kiểm tra sinh viên đã thuộc nhóm nào trong lớp này chưa
        const existingGroupMember = await GroupMember.findOne({
            include: [{
                model: StudentGroup,
                as: 'group',
                where: { classId }
            }],
            where: { studentId: creatorId }
        });
        if (existingGroupMember) {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'You already belong to a group in this class.'
            });
        }

        const group = await StudentGroup.create({
            classId,
            topicId,
            groupName
        });

        // Thêm creator vào nhóm luôn
        await GroupMember.create({ groupId: group.id, studentId: creatorId });

        res.status(201).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: group
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

        const group = await StudentGroup.findByPk(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND
            });
        }

        await group.update(updates);

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: group
        });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

        const group = await StudentGroup.findByPk(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND
            });
        }

        await group.destroy();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS
        });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'User ID is required'
            });
        }

        // Check if group exists
        const group = await StudentGroup.findByPk(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND
            });
        }

        // Check if user is a student
        const user = await User.findByPk(userId);
        if (!user || user.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'User not found or invalid role'
            });
        }

        // Check if already a member of this group
        const existingMember = await GroupMember.findOne({
            where: { groupId: id, studentId: userId }
        });
        if (existingMember) {
            return res.status(409).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'User is already a member of this group'
            });
        }

        // Lấy classId của group
        const groupClass = group.classId;
        // Kiểm tra user đã thuộc nhóm nào trong lớp này chưa
        const existingGroupInClass = await GroupMember.findOne({
            where: { studentId: userId },
            include: [{
                model: StudentGroup,
                as: 'group',
                where: { classId: groupClass }
            }]
        });
        if (existingGroupInClass) {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'User already belongs to a group in this class.'
            });
        }

        // Kiểm tra số lượng thành viên tối đa
        const memberCount = await GroupMember.count({ where: { groupId: id } });
        if (memberCount >= 5) {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'Group already has maximum 5 members.'
            });
        }

        const member = await GroupMember.create({
            groupId: id,
            studentId: userId
        });

        res.status(201).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: member
        });
    } catch (error) {
        console.error('Error adding group member:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
            where: { groupId: id, studentId: memberId }
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Group member not found'
            });
        }

        await member.destroy();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS
        });
    } catch (error) {
        console.error('Error removing group member:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
                attributes: ['id', 'fullName', 'email', 'isOnline', 'status']
            }],
            order: [['joinedAt', 'ASC']]
        });

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            count: members.length,
            data: members
        });
    } catch (error) {
        console.error('Error fetching group members:', error);
        res.status(500).json({
            success: false,
            message: MSG.GENERAL.SERVER_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorName: process.env.NODE_ENV === 'development' ? error.name : undefined,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
