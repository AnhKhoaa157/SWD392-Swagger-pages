/**
 * Message Controller
 * Handles CRUD operations for messages
 */

const { Message, Channel, User, Reaction, Attachment } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all messages
 * @route   GET /api/messages
 * @access  Public
 */
const getAllMessages = async (req, res) => {
    try {
        const { channelId, senderId, search, limit = 50, offset = 0 } = req.query;
        
        let whereClause = {};
        
        if (channelId) whereClause.channelId = channelId;
        if (senderId) whereClause.senderId = senderId;
        if (search) {
            whereClause.content = { [Op.like]: `%${search}%` };
        }
        
        // Only show non-deleted messages by default
        whereClause.deletedAt = null;
        
        const messages = await Message.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'fullName', 'email', 'avatarURL', 'role']
                },
                {
                    model: Channel,
                    as: 'channel',
                    attributes: ['channelId', 'name', 'type']
                },
                {
                    model: Message,
                    as: 'parent',
                    attributes: ['messageId', 'content', 'senderId']
                },
                {
                    model: Message,
                    as: 'replies',
                    attributes: ['messageId', 'content', 'senderId', 'createdAt']
                },
                {
                    model: Reaction,
                    as: 'reactions',
                    attributes: ['reactionId', 'emoji', 'userId']
                },
                {
                    model: Attachment,
                    as: 'attachments',
                    attributes: ['attachmentId', 'fileName', 'fileType', 'filePath', 'fileSize']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};

/**
 * @desc    Get message by ID
 * @route   GET /api/messages/:id
 * @access  Public
 */
const getMessageById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const message = await Message.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'fullName', 'email', 'avatarURL', 'role']
                },
                {
                    model: Channel,
                    as: 'channel',
                    attributes: ['channelId', 'name', 'type']
                },
                {
                    model: Message,
                    as: 'parent',
                    attributes: ['messageId', 'content', 'senderId', 'createdAt']
                },
                {
                    model: Message,
                    as: 'replies',
                    include: [{
                        model: User,
                        as: 'sender',
                        attributes: ['userId', 'fullName', 'avatarURL']
                    }]
                },
                {
                    model: Reaction,
                    as: 'reactions',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'fullName']
                    }]
                },
                {
                    model: Attachment,
                    as: 'attachments'
                }
            ]
        });
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching message',
            error: error.message
        });
    }
};

/**
 * @desc    Create new message
 * @route   POST /api/messages
 * @access  Authenticated User
 */
const createMessage = async (req, res) => {
    try {
        const { channelId, senderId, content, parentMsgId } = req.body;
        
        if (!channelId || !senderId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide channelId, senderId, and content'
            });
        }
        
        // Verify channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }
        
        // Verify sender exists
        const sender = await User.findByPk(senderId);
        if (!sender) {
            return res.status(404).json({
                success: false,
                message: 'Sender not found'
            });
        }
        
        // If it's a reply, verify parent message exists
        if (parentMsgId) {
            const parentMessage = await Message.findByPk(parentMsgId);
            if (!parentMessage) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent message not found'
                });
            }
        }
        
        const message = await Message.create({
            channelId,
            senderId,
            content,
            parentMsgId
        });
        
        // Fetch the created message with associations
        const createdMessage = await Message.findByPk(message.messageId, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'fullName', 'avatarURL']
                },
                {
                    model: Channel,
                    as: 'channel',
                    attributes: ['channelId', 'name', 'type']
                }
            ]
        });
        
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: createdMessage
        });
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating message',
            error: error.message
        });
    }
};

/**
 * @desc    Update message
 * @route   PUT /api/messages/:id
 * @access  Message Owner
 */
const updateMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }
        
        const message = await Message.findByPk(id);
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        // Check if message was deleted
        if (message.deletedAt) {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit deleted message'
            });
        }
        
        message.content = content;
        message.editedAt = new Date();
        await message.save();
        
        res.status(200).json({
            success: true,
            message: 'Message updated successfully',
            data: message
        });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating message',
            error: error.message
        });
    }
};

/**
 * @desc    Delete message (soft delete)
 * @route   DELETE /api/messages/:id
 * @access  Message Owner/Admin
 */
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        
        const message = await Message.findByPk(id);
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        // Soft delete
        message.deletedAt = new Date();
        await message.save();
        
        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting message',
            error: error.message
        });
    }
};

/**
 * @desc    Get channel messages
 * @route   GET /api/channels/:channelId/messages
 * @access  Channel Members
 */
const getChannelMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { limit = 50, offset = 0, before } = req.query;
        
        let whereClause = {
            channelId,
            deletedAt: null,
            parentMsgId: null // Only get top-level messages, not replies
        };
        
        // If 'before' timestamp is provided, get messages before that time
        if (before) {
            whereClause.createdAt = { [Op.lt]: new Date(before) };
        }
        
        const messages = await Message.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'fullName', 'avatarURL', 'role']
                },
                {
                    model: Message,
                    as: 'replies',
                    attributes: ['messageId', 'content', 'senderId', 'createdAt'],
                    include: [{
                        model: User,
                        as: 'sender',
                        attributes: ['userId', 'fullName', 'avatarURL']
                    }]
                },
                {
                    model: Reaction,
                    as: 'reactions',
                    attributes: ['reactionId', 'emoji', 'userId']
                },
                {
                    model: Attachment,
                    as: 'attachments',
                    attributes: ['attachmentId', 'fileName', 'fileType', 'filePath', 'fileSize']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        console.error('Error fetching channel messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching channel messages',
            error: error.message
        });
    }
};

/**
 * @desc    Add reaction to message
 * @route   POST /api/messages/:id/reactions
 * @access  Authenticated User
 */
const addReaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, emoji } = req.body;
        
        if (!userId || !emoji) {
            return res.status(400).json({
                success: false,
                message: 'Please provide userId and emoji'
            });
        }
        
        // Check if message exists
        const message = await Message.findByPk(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        // Check if reaction already exists
        const existingReaction = await Reaction.findOne({
            where: { messageId: id, userId, emoji }
        });
        
        if (existingReaction) {
            return res.status(409).json({
                success: false,
                message: 'Reaction already exists'
            });
        }
        
        const reaction = await Reaction.create({
            messageId: id,
            userId,
            emoji
        });
        
        res.status(201).json({
            success: true,
            message: 'Reaction added successfully',
            data: reaction
        });
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding reaction',
            error: error.message
        });
    }
};

/**
 * @desc    Remove reaction from message
 * @route   DELETE /api/messages/:id/reactions/:reactionId
 * @access  Reaction Owner
 */
const removeReaction = async (req, res) => {
    try {
        const { id, reactionId } = req.params;
        
        const reaction = await Reaction.findOne({
            where: { reactionId, messageId: id }
        });
        
        if (!reaction) {
            return res.status(404).json({
                success: false,
                message: 'Reaction not found'
            });
        }
        
        await reaction.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Reaction removed successfully'
        });
    } catch (error) {
        console.error('Error removing reaction:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing reaction',
            error: error.message
        });
    }
};

module.exports = {
    getAllMessages,
    getMessageById,
    createMessage,
    updateMessage,
    deleteMessage,
    getChannelMessages,
    addReaction,
    removeReaction
};
