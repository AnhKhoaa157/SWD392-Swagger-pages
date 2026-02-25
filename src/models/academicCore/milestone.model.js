/**
 * AcademicCore Module - Milestone Model (MySQL/Sequelize)
 * Represents project milestones/deadlines for a class
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Milestone = sequelize.define('Milestone', {
    milestoneId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'milestone_id'
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
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Milestone name is required' },
            len: {
                args: [1, 100],
                msg: 'Milestone name cannot exceed 100 characters'
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Deadline is required' },
            isDate: { msg: 'Invalid deadline' }
        }
    },
    weight: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 10.00,
        validate: {
            min: {
                args: [0],
                msg: 'Weight cannot be negative'
            },
            max: {
                args: [100],
                msg: 'Weight cannot exceed 100'
            }
        }
    },
    status: {
        type: DataTypes.ENUM('Upcoming', 'Active', 'Closed'),
        defaultValue: 'Upcoming'
    }
}, {
    tableName: 'milestones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['class_id'] },
        { fields: ['deadline'] },
        { fields: ['class_id', 'deadline'] },
        { fields: ['status'] },
        {
            fields: ['class_id', 'name'],
            unique: true,
            name: 'unique_class_milestone_name'
        }
    ]
});

// Instance Method
Milestone.prototype.isOverdue = function() {
    return new Date() > this.deadline;
};

module.exports = Milestone;
