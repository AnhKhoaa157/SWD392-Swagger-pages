/**
 * Answer Model (MySQL/Sequelize)
 * Represents answers to Q&A questions
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Answer = sequelize.define('Answer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'questions',
            key: 'id'
        },
        field: 'question_id'
    },
    answeredBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        field: 'answered_by'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Content is required' }
        }
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_public'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    }
}, {
    tableName: 'answers',
    timestamps: false,
    indexes: [
        { fields: ['question_id'] },
        { fields: ['answered_by'] },
        { fields: ['is_public'] }
    ]
});

module.exports = Answer;
