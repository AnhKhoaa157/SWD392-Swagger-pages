/**
 * ChatEngine Module - ChannelMember Model (MySQL/Sequelize)
 * Junction table for Channel-User Many-to-Many relationship
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const ChannelMember = sequelize.define('ChannelMember', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        field: 'user_id'
    },
    joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'joined_at'
    },
    role: {
        type: DataTypes.ENUM('Owner', 'Admin', 'Member'),
        defaultValue: 'Member'
    },
    notificationsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'notifications_enabled'
    },
    lastReadAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'last_read_at'
    },
    status: {
        type: DataTypes.ENUM('Active', 'Muted', 'Left'),
        defaultValue: 'Active'
    }
}, {
    tableName: 'channel_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['channel_id', 'user_id'],
            unique: true,
            name: 'unique_channel_user'
        },
        { fields: ['channel_id'] },
        { fields: ['user_id'] },
        { fields: ['status'] },
        { fields: ['joined_at'] }
    ]
});

// Instance Method
ChannelMember.prototype.markAsRead = async function() {
    this.lastReadAt = new Date();
    return await this.save();
};

module.exports = ChannelMember;
