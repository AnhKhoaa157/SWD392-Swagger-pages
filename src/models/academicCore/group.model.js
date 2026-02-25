/**
 * AcademicCore Module - Group Model (MySQL/Sequelize)
 * Represents project groups/teams within a class
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Group = sequelize.define('Group', {
    groupId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'group_id'
    },
    classId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'classes',
            key: 'class_id'
        },
        field: 'class_id'
    },
    topicId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'topics',
            key: 'topic_id'
        },
        field: 'topic_id'
    },
    groupName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Group name is required' },
            len: {
                args: [1, 100],
                msg: 'Group name cannot exceed 100 characters'
            }
        },
        field: 'group_name'
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Forming', 'Active', 'Completed', 'Disbanded'),
        defaultValue: 'Forming'
    },
    maxMembers: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        validate: {
            min: {
                args: [1],
                msg: 'Group must have at least 1 member'
            },
            max: {
                args: [10],
                msg: 'Group cannot exceed 10 members'
            }
        },
        field: 'max_members'
    }
}, {
    tableName: 'groups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['class_id'] },
        { fields: ['topic_id'] },
        { fields: ['class_id', 'topic_id'] },
        { fields: ['status'] },
        {
            fields: ['class_id', 'group_name'],
            unique: true,
            name: 'unique_class_group_name'
        }
    ]
});

module.exports = Group;
