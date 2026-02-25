/**
 * AcademicCore Module - Submission Model (MySQL/Sequelize)
 * Represents project submissions by groups for milestones
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Submission = sequelize.define('Submission', {
    submissionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'submission_id'
    },
    groupId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'groups',
            key: 'group_id'
        },
        field: 'group_id'
    },
    milestoneId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'milestones',
            key: 'milestone_id'
        },
        field: 'milestone_id'
    },
    linkRepo: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'link_repo'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    grade: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: {
                args: [0],
                msg: 'Grade cannot be negative'
            },
            max: {
                args: [100],
                msg: 'Grade cannot exceed 100'
            }
        }
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    gradedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'user_id'
        },
        field: 'graded_by'
    },
    gradedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'graded_at'
    },
    submissionAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'submission_at'
    },
    status: {
        type: DataTypes.ENUM('Draft', 'Submitted', 'Graded', 'Late', 'Resubmission'),
        defaultValue: 'Draft'
    }
}, {
    tableName: 'submissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['group_id'] },
        { fields: ['milestone_id'] },
        { fields: ['group_id', 'milestone_id'] },
        { fields: ['status'] },
        { fields: ['submission_at'] },
        { fields: ['graded_by'] },
        {
            fields: ['group_id', 'milestone_id'],
            unique: true,
            name: 'unique_group_milestone'
        }
    ]
});

module.exports = Submission;
