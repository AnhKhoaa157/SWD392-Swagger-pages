/**
 * Topic Controller
 * Handles CRUD operations for topics
 */

const { Topic, User, StudentGroup, GroupMember } = require('../models');
const { Op } = require('sequelize');
const MSG = require('../constants/messages');

const getRequesterId = (req) => req.user?.userId || req.user?.id;
const getRequesterRole = (req) => String(req.user?.role || '').toLowerCase();

/**
 * @desc    Get all topics
 * @route   GET /api/topics
 * @access  Public
 */
const getAllTopics = async (req, res) => {
    try {
        const { status, proposedBy, lecturerId, search } = req.query;

        let whereClause = {};

        if (status) whereClause.status = status;
        if (proposedBy) whereClause.proposedBy = proposedBy;
        if (lecturerId) whereClause.proposedBy = lecturerId;
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const topics = await Topic.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'proposer',
                    attributes: ['id', 'fullName', 'email', 'role']
                },
                {
                    model: User,
                    as: 'approver',
                    attributes: ['id', 'fullName', 'email', 'role']
                },
                {
                    model: StudentGroup,
                    as: 'groups',
                    attributes: ['id', 'groupName']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            count: topics.length,
            data: topics
        });
    } catch (error) {
        console.error('Error fetching topics:', error);
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
 * @desc    Get topic by ID
 * @route   GET /api/topics/:id
 * @access  Public
 */
const getTopicById = async (req, res) => {
    try {
        const { id } = req.params;

        const topic = await Topic.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['userId', 'fullName', 'email', 'avatarURL', 'role']
                },
                {
                    model: StudentGroup,
                    as: 'groups',
                    attributes: ['id', 'groupName', 'status', 'maxMembers']
                }
            ]
        });

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Topic not found'
            });
        }

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: topic
        });
    } catch (error) {
        console.error('Error fetching topic:', error);
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
 * @desc    Create new topic
 * @route   POST /api/topics
 * @access  Lecturer/Admin
 */
const createTopic = async (req, res) => {
    try {
        const { title, description, descriptionFile } = req.body;

        // User is already authenticated via middleware; get id from JWT
        const proposedById = req.user?.userId || req.user?.id;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'Missing topic title'
            });
        }

        if (!proposedById) {
            return res.status(401).json({
                success: false,
                message: MSG.GENERAL.BAD_REQUEST,
                detail: 'Unauthorized: could not identify user'
            });
        }

        const topic = await Topic.create({
            proposedBy: proposedById,
            title,
            description,
            descriptionFile,
            status: 'PENDING'
        });

        res.status(201).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: topic
        });
    } catch (error) {
        console.error('Error creating topic:', error);
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
 * @desc    Update topic
 * @route   PUT /api/topics/:id
 * @access  Lecturer/Admin
 */
const updateTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const requesterId = getRequesterId(req);
        const requesterRole = getRequesterRole(req);

        const topic = await Topic.findByPk(id);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Topic not found'
            });
        }

        if (requesterRole === 'lecturer' && Number(topic.proposedBy) !== Number(requesterId)) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN,
                detail: 'You can only update topics created by you'
            });
        }

        await topic.update(updates);

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: topic
        });
    } catch (error) {
        console.error('Error updating topic:', error);
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
 * @desc    Delete topic
 * @route   DELETE /api/topics/:id
 * @access  Lecturer/Admin
 */
const deleteTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = getRequesterId(req);
        const requesterRole = getRequesterRole(req);

        const topic = await Topic.findByPk(id);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Topic not found'
            });
        }

        if (requesterRole === 'lecturer' && Number(topic.proposedBy) !== Number(requesterId)) {
            return res.status(403).json({
                success: false,
                message: MSG.AUTHORIZATION.FORBIDDEN,
                detail: 'You can only delete topics created by you'
            });
        }

        await topic.destroy();

        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS
        });
    } catch (error) {
        console.error('Error deleting topic:', error);
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
 * @desc    Approve topic
 * @route   PUT /api/topics/:id/approve
 * @access  Admin
 */
const approveTopic = async (req, res) => {
    try {
        const { id } = req.params;

        const topic = await Topic.findByPk(id);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Topic not found'
            });
        }

        topic.status = 'APPROVED';
        await topic.save();
        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: topic
        });
    } catch (error) {
        console.error('Error approving topic:', error);
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
 * @desc    Reject topic
 * @route   PUT /api/topics/:id/reject
 * @access  Admin
 */
const rejectTopic = async (req, res) => {
    try {
        const { id } = req.params;

        const topic = await Topic.findByPk(id);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: MSG.GENERAL.NOT_FOUND,
                detail: 'Topic not found'
            });
        }

        topic.status = 'REJECTED';
        await topic.save();
        res.status(200).json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: topic
        });
    } catch (error) {
        console.error('Error rejecting topic:', error);
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
 * @desc    Group register a topic (chỉ thành viên trong nhóm mới được đăng ký)
 * @route   POST /api/topics/:id/register
 * @access  Student
 */
const registerTopicForGroup = async (req, res) => {
    try {
        const topicId = req.params.id;
        const { groupId } = req.body;
        const userId = req.user.userId || req.user.id;

        // Kiểm tra tồn tại group và topic
        const group = await StudentGroup.findByPk(groupId);
        if (!group) return res.status(404).json({ success: false, message: MSG.GENERAL.NOT_FOUND, detail: 'Group not found' });

        const topic = await Topic.findByPk(topicId);
        if (!topic) return res.status(404).json({ success: false, message: MSG.GENERAL.NOT_FOUND, detail: 'Topic not found' });

        // Kiểm tra user có phải thành viên của group không
        const isMember = await GroupMember.findOne({ where: { groupId: group.id, studentId: userId } });
        if (!isMember) {
            return res.status(403).json({ success: false, message: MSG.GENERAL.BAD_REQUEST, detail: 'Only group members can register topic for this group' });
        }

        // Kiểm tra trạng thái đề tài phải là APPROVED
        if (topic.status !== 'APPROVED') {
            return res.status(400).json({ success: false, message: MSG.GENERAL.BAD_REQUEST, detail: 'Topic is not approved for registration' });
        }

        // Kiểm tra nhóm đã đăng ký đề tài chưa
        if (group.topicId) {
            return res.status(400).json({ success: false, message: MSG.GENERAL.BAD_REQUEST, detail: 'Group already registered a topic' });
        }

        // Gán topic cho group
        group.topicId = topicId;
        await group.save();

        res.json({
            success: true,
            message: MSG.GENERAL.SUCCESS,
            data: { groupId: group.id, topicId }
        });
    } catch (error) {
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
    getAllTopics,
    getTopicById,
    createTopic,
    updateTopic,
    deleteTopic,
    approveTopic,
    rejectTopic,
    registerTopicForGroup
};
