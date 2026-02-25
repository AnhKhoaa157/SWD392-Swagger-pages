/**
 * AcademicCore Module - Class Model (MySQL/Sequelize)
 * Represents a class/course section within a semester
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Class = sequelize.define('Class', {
    classId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'class_id'
    },
    semesterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'semesters',
            key: 'semester_id'
        },
        field: 'semester_id'
    },
    lecturerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        field: 'lecturer_id'
    },
    className: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Class name is required' },
            len: {
                args: [1, 100],
                msg: 'Class name cannot exceed 100 characters'
            }
        },
        field: 'class_name'
    },
    slackSpaceName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: {
            msg: 'Slack space name already exists'
        },
        field: 'slack_space_name'
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive', 'Completed'),
        defaultValue: 'Active'
    }
}, {
    tableName: 'classes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['semester_id'] },
        { fields: ['lecturer_id'] },
        { fields: ['slack_space_name'], unique: true },
        { fields: ['semester_id', 'lecturer_id'] },
        { fields: ['status'] }
    ]
});

module.exports = Class;
