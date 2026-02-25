/**
 * ChatEngine Module - Channel Model (MySQL/Sequelize)
 * Represents chat channels (public class channels or private group channels)
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Channel = sequelize.define('Channel', {
    channelId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'channel_id'
    },
    classId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'classes',
            key: 'class_id'
        },
        field: 'class_id'
    },
    groupId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'groups',
            key: 'group_id'
        },
        field: 'group_id'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Channel name is required' },
            len: {
                args: [1, 100],
                msg: 'Channel name cannot exceed 100 characters'
            }
        }
    },
    type: {
        type: DataTypes.ENUM('PUBLIC', 'PRIVATE'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['PUBLIC', 'PRIVATE']],
                msg: 'Type must be PUBLIC or PRIVATE'
            }
        }
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        field: 'created_by'
    },
    status: {
        type: DataTypes.ENUM('Active', 'Archived', 'Deleted'),
        defaultValue: 'Active'
    }
}, {
    tableName: 'channels',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['class_id'] },
        { fields: ['group_id'] },
        { fields: ['type'] },
        { fields: ['status'] },
        { fields: ['created_by'] },
        { fields: ['created_at'] }
    ]
});

module.exports = Channel;
