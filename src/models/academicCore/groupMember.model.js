/**
 * AcademicCore Module - GroupMember Model (MySQL/Sequelize)
 * Junction table for Group-Student Many-to-Many relationship
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const GroupMember = sequelize.define('GroupMember', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        field: 'student_id'
    },
    role: {
        type: DataTypes.ENUM('Leader', 'Member'),
        defaultValue: 'Member'
    },
    joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'joined_at'
    },
    status: {
        type: DataTypes.ENUM('Active', 'Left', 'Removed'),
        defaultValue: 'Active'
    }
}, {
    tableName: 'group_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['group_id', 'student_id'],
            unique: true,
            name: 'unique_group_student'
        },
        { fields: ['group_id'] },
        { fields: ['student_id'] },
        { fields: ['status'] },
        { fields: ['role'] }
    ]
});

module.exports = GroupMember;
