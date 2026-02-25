/**
 * AcademicCore Module - Topic Model (MySQL/Sequelize)
 * Represents project topics/ideas proposed by lecturers
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Topic = sequelize.define('Topic', {
    topicId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'topic_id'
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
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Topic title is required' },
            len: {
                args: [1, 200],
                msg: 'Topic title cannot exceed 200 characters'
            }
        }
    },
    descriptionFile: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'description_file'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Assigned'),
        defaultValue: 'Pending'
    },
    maxGroups: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: {
                args: [1],
                msg: 'At least 1 group can select this topic'
            }
        },
        field: 'max_groups'
    }
}, {
    tableName: 'topics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['created_by'] },
        { fields: ['status'] },
        { fields: ['created_at'] }
    ]
});

module.exports = Topic;
