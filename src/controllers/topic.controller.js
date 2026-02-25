/**
 * Topic Controller
 * Handles CRUD operations for topics
 */

const { Topic, User, Group } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all topics
 * @route   GET /api/topics
 * @access  Public
 */
const getAllTopics = async (req, res) => {
    try {
        const { status, createdBy, search } = req.query;
        
        let whereClause = {};
        
        if (status) whereClause.status = status;
        if (createdBy) whereClause.createdBy = createdBy;
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
                    as: 'creator',
                    attributes: ['userId', 'fullName', 'email', 'avatarURL', 'role']
                },
                {
                    model: Group,
                    as: 'groups',
                    attributes: ['groupId', 'groupName', 'status']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            count: topics.length,
            data: topics
        });
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching topics',
            error: error.message
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
                    model: Group,
                    as: 'groups',
                    attributes: ['groupId', 'groupName', 'status', 'maxMembers']
                }
            ]
        });
        
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: topic
        });
    } catch (error) {
        console.error('Error fetching topic:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching topic',
            error: error.message
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
        const { createdBy, title, description, descriptionFile, maxGroups } = req.body;
        
        if (!createdBy || !title) {
            return res.status(400).json({
                success: false,
                message: 'Please provide createdBy and title'
            });
        }
        
        // Verify creator exists and is a lecturer
        const creator = await User.findByPk(createdBy);
        if (!creator || creator.role !== 'Lecturer') {
            return res.status(404).json({
                success: false,
                message: 'Creator not found or invalid role'
            });
        }
        
        const topic = await Topic.create({
            createdBy,
            title,
            description,
            descriptionFile,
            maxGroups: maxGroups || 1,
            status: 'Pending'
        });
        
        res.status(201).json({
            success: true,
            message: 'Topic created successfully',
            data: topic
        });
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating topic',
            error: error.message
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
        
        const topic = await Topic.findByPk(id);
        
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }
        
        await topic.update(updates);
        
        res.status(200).json({
            success: true,
            message: 'Topic updated successfully',
            data: topic
        });
    } catch (error) {
        console.error('Error updating topic:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating topic',
            error: error.message
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
        
        const topic = await Topic.findByPk(id);
        
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }
        
        await topic.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Topic deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting topic:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting topic',
            error: error.message
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
                message: 'Topic not found'
            });
        }
        
        topic.status = 'Approved';
        await topic.save();
        
        res.status(200).json({
            success: true,
            message: 'Topic approved successfully',
            data: topic
        });
    } catch (error) {
        console.error('Error approving topic:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving topic',
            error: error.message
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
                message: 'Topic not found'
            });
        }
        
        topic.status = 'Rejected';
        await topic.save();
        
        res.status(200).json({
            success: true,
            message: 'Topic rejected successfully',
            data: topic
        });
    } catch (error) {
        console.error('Error rejecting topic:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting topic',
            error: error.message
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
    rejectTopic
};
