/**
 * ChatEngine Module - Reaction Model (MySQL/Sequelize)
 * Represents emoji reactions to messages
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Reaction = sequelize.define('Reaction', {
    reactionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'reaction_id'
    },
    messageId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'messages',
            key: 'message_id'
        },
        field: 'message_id'
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        field: 'user_id'
    },
    emoji: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Emoji is required' }
        }
    },
    emojiName: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'emoji_name'
    }
}, {
    tableName: 'reactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['message_id', 'user_id', 'emoji'],
            unique: true,
            name: 'unique_message_user_emoji'
        },
        { fields: ['message_id'] },
        { fields: ['user_id'] },
        { fields: ['emoji'] },
        { fields: ['created_at'] }
    ]
});

// Static Methods
Reaction.getReactionSummary = async function(messageId) {
    return await this.findAll({
        where: { messageId },
        attributes: [
            'emoji',
            [sequelize.fn('COUNT', sequelize.col('emoji')), 'count']
        ],
        group: ['emoji'],
        order: [[sequelize.literal('count'), 'DESC']],
        include: [{
            model: require('./user.model'),
            as: 'user',
            attributes: ['userId', 'fullName', 'avatarURL']
        }]
    });
};

Reaction.toggleReaction = async function(messageId, userId, emoji) {
    const existing = await this.findOne({ where: { messageId, userId, emoji } });
    
    if (existing) {
        await existing.destroy();
        return { action: 'removed', reaction: existing };
    } else {
        const reaction = await this.create({ messageId, userId, emoji });
        return { action: 'added', reaction };
    }
};

module.exports = Reaction;
