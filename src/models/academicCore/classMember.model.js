/**
 * AcademicCore Module - ClassMember Model (MySQL/Sequelize)
 * Junction table for Class-Student Many-to-Many relationship
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const ClassMember = sequelize.define('ClassMember', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        field: 'student_id'
    },
    enrolledAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'enrolled_at'
    },
    status: {
        type: DataTypes.ENUM('Active', 'Dropped', 'Completed'),
        defaultValue: 'Active'
    }
}, {
    tableName: 'class_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { 
            fields: ['class_id', 'student_id'], 
            unique: true,
            name: 'unique_class_student'
        },
        { fields: ['class_id'] },
        { fields: ['student_id'] },
        { fields: ['status'] }
    ]
});

module.exports = ClassMember;
