/**
 * Channel Controller
 * Handles CRUD operations for channels
 */

const { Channel, Class, Group, ChannelMember, Message, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all channels
 * @route   GET /api/channels
 * @access  Public
 */
const getAllChannels = async (req, res) => {
    try {
        const { classId, groupId, type, search } = req.query;
        
        let whereClause = {};
        
        if (classId) whereClause.classId = classId;
        if (groupId) whereClause.groupId = groupId;
        if (type) whereClause.type = type;
        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }
        
        const channels = await Channel.findAll({
            where: whereClause,
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['classId', 'className']
                },
                {
                    model: Group,
                    as: 'group',
                    attributes: ['groupId', 'groupName']
                },
                {
                    model: ChannelMember,
                    as: 'members',
                    attributes: ['id', 'userId'],
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'fullName', 'avatarURL']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            count: channels.length,
            data: channels
        });
    } catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching channels',
            error: error.message
        });
    }
};

/**
 * @desc    Get channel by ID
 * @route   GET /api/channels/:id
 * @access  Public
 */
const getChannelById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const channel = await Channel.findByPk(id, {
            include: [
                {
                    model: Class,
                    as: 'class'
                },
                {
                    model: Group,
                    as: 'group'
                },
                {
                    model: ChannelMember,
                    as: 'members',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'fullName', 'email', 'avatarURL', 'isOnline']
                    }]
                },
                {
                    model: Message,
                    as: 'messages',
                    limit: 50,
                    order: [['createdAt', 'DESC']],
                    include: [{
                        model: User,
                        as: 'sender',
                        attributes: ['userId', 'fullName', 'avatarURL']
                    }]
                }
            ]
        });
        
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: channel
        });
    } catch (error) {
        console.error('Error fetching channel:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching channel',
            error: error.message
        });
    }
};

/**
 * @desc    Create new channel
 * @route   POST /api/channels
 * @access  Lecturer/Admin
 */
const createChannel = async (req, res) => {
    try {
        const { classId, groupId, name, type, description } = req.body;
        
        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name and type'
            });
        }
        
        if (type === 'PUBLIC' && !classId) {
            return res.status(400).json({
                success: false,
                message: 'PUBLIC channels require classId'
            });
        }
        
        if (type === 'PRIVATE' && !groupId) {
            return res.status(400).json({
                success: false,
                message: 'PRIVATE channels require groupId'
            });
        }
        
        const channel = await Channel.create({
            classId,
            groupId,
            name,
            type,
            description
        });
        
        res.status(201).json({
            success: true,
            message: 'Channel created successfully',
            data: channel
        });
    } catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating channel',
            error: error.message
        });
    }
};

/**
 * @desc    Update channel
 * @route   PUT /api/channels/:id
 * @access  Lecturer/Admin
 */
const updateChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const channel = await Channel.findByPk(id);
        
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }
        
        await channel.update(updates);
        
        res.status(200).json({
            success: true,
            message: 'Channel updated successfully',
            data: channel
        });
    } catch (error) {
        console.error('Error updating channel:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating channel',
            error: error.message
        });
    }
};

/**
 * @desc    Delete channel
 * @route   DELETE /api/channels/:id
 * @access  Lecturer/Admin
 */
const deleteChannel = async (req, res) => {
    try {
        const { id } = req.params;
        
        const channel = await Channel.findByPk(id);
        
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }
        
        await channel.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Channel deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting channel:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting channel',
            error: error.message
        });
    }
};

/**
 * @desc    Add member to channel
 * @route   POST /api/channels/:id/members
 * @access  Lecturer/Admin
 */
const addChannelMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Check if channel exists
        const channel = await Channel.findByPk(id);
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }
        
        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if already a member
        const existingMember = await ChannelMember.findOne({
            where: { channelId: id, userId }
        });
        
        if (existingMember) {
            return res.status(409).json({
                success: false,
                message: 'User is already a member of this channel'
            });
        }
        
        const member = await ChannelMember.create({
            channelId: id,
            userId
        });
        
        res.status(201).json({
            success: true,
            message: 'Member added to channel successfully',
            data: member
        });
    } catch (error) {
        console.error('Error adding channel member:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding channel member',
            error: error.message
        });
    }
};

/**
 * @desc    Remove member from channel
 * @route   DELETE /api/channels/:id/members/:memberId
 * @access  Lecturer/Admin
 */
const removeChannelMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        
        const member = await ChannelMember.findOne({
            where: { id: memberId, channelId: id }
        });
        
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Channel member not found'
            });
        }
        
        await member.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Member removed from channel successfully'
        });
    } catch (error) {
        console.error('Error removing channel member:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing channel member',
            error: error.message
        });
    }
};

/**
 * @desc    Get channel members
 * @route   GET /api/channels/:id/members
 * @access  Public
 */
const getChannelMembers = async (req, res) => {
    try {
        const { id } = req.params;
        
        const members = await ChannelMember.findAll({
            where: { channelId: id },
            include: [{
                model: User,
                as: 'user',
                attributes: ['userId', 'fullName', 'email', 'avatarURL', 'isOnline', 'status']
            }],
            order: [['joinedAt', 'ASC']]
        });
        
        res.status(200).json({
            success: true,
            count: members.length,
            data: members
        });
    } catch (error) {
        console.error('Error fetching channel members:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching channel members',
            error: error.message
        });
    }
};

module.exports = {
    getAllChannels,
    getChannelById,
    createChannel,
    updateChannel,
    deleteChannel,
    addChannelMember,
    removeChannelMember,
    getChannelMembers
};
