/**
 * Question Model (MySQL/Sequelize)
 * Represents Q&A questions with hierarchical escalation
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Title is required' }
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Content is required' }
        }
    },
    groupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'student_groups',
            key: 'id'
        },
        field: 'group_id'
    },
    askedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        field: 'asked_by'
    },
    status: {
        type: DataTypes.ENUM('WAITING_LECTURER', 'ESCALATED_TO_MANAGER', 'RESOLVED'),
        defaultValue: 'WAITING_LECTURER'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    }
}, {
    tableName: 'questions',
    timestamps: false,
    indexes: [
        { fields: ['group_id'] },
        { fields: ['asked_by'] },
        { fields: ['status'] },
        { fields: ['created_at'] }
    ]
});

module.exports = Question;
