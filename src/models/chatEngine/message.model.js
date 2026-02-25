/**
 * ChatEngine Module - Message Model (MySQL/Sequelize)
 * Represents chat messages and replies in channels
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Message = sequelize.define('Message', {
    messageId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'message_id'
    },
    channelId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'channels',
            key: 'channel_id'
        },
        field: 'channel_id'
    },
    senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        field: 'sender_id'
    },
    parentMsgId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'messages',
            key: 'message_id'
        },
        field: 'parent_msg_id'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Message content is required' }
        }
    },
    messageType: {
        type: DataTypes.ENUM('Text', 'File', 'System', 'Code', 'Image'),
        defaultValue: 'Text',
        field: 'message_type'
    },
    isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_edited'
    },
    editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'edited_at'
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_deleted'
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at'
    },
    mentions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    }
}, {
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['channel_id', 'created_at'] },
        { fields: ['sender_id'] },
        { fields: ['parent_msg_id'] },
        { fields: ['created_at'] },
        { fields: ['channel_id', 'parent_msg_id'] },
        { fields: ['is_deleted'] }
    ]
});

// Instance Methods
Message.prototype.isThread = function() {
    return !!this.parentMsgId;
};

Message.prototype.softDelete = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return await this.save();
};

module.exports = Message;
