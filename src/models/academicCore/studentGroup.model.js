/**
 * StudentGroup Model (MySQL/Sequelize)
 * Represents student project groups
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const StudentGroup = sequelize.define('StudentGroup', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    groupName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Group name is required' }
        },
        field: 'group_name'
    },
    classId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'classes',
            key: 'id'
        },
        field: 'class_id'
    },
    topicId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'topics',
            key: 'id'
        },
        field: 'topic_id'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    }
}, {
    tableName: 'student_groups',
    timestamps: false,
    indexes: [
        { fields: ['class_id'] },
        { fields: ['topic_id'] }
    ]
});

module.exports = StudentGroup;
