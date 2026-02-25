/**
 * AcademicCore Module - Semester Model (MySQL/Sequelize)
 * Represents academic semesters/terms
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Semester = sequelize.define('Semester', {
    semesterId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'semester_id'
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            msg: 'Semester name already exists'
        },
        validate: {
            notEmpty: { msg: 'Semester name is required' },
            len: {
                args: [1, 50],
                msg: 'Semester name cannot exceed 50 characters'
            }
        }
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Start date is required' },
            isDate: { msg: 'Invalid start date' }
        },
        field: 'start_date'
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'End date is required' },
            isDate: { msg: 'Invalid end date' },
            isAfterStartDate(value) {
                if (value <= this.startDate) {
                    throw new Error('End date must be after start date');
                }
            }
        },
        field: 'end_date'
    },
    status: {
        type: DataTypes.ENUM('Upcoming', 'Active', 'Completed'),
        defaultValue: 'Upcoming'
    }
}, {
    tableName: 'semesters',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['name'], unique: true },
        { fields: ['start_date'] },
        { fields: ['status'] },
        { fields: ['start_date', 'end_date'] }
    ]
});

// Instance Method
Semester.prototype.isCurrent = function() {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
};

module.exports = Semester;
