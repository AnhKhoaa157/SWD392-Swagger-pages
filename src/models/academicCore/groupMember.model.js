/**
 * GroupMember Model (MySQL/Sequelize)
 * Junction table linking students to groups (Many-to-Many)
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const GroupMember = sequelize.define('GroupMember', {
    groupId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'student_groups',
            key: 'id'
        },
        field: 'group_id'
    },
    studentId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id'
        },
        field: 'student_id'
    },
    joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'joined_at'
    }
}, {
    tableName: 'group_members',
    timestamps: false,
    indexes: [
        { fields: ['group_id'] },
        { fields: ['student_id'] }
    ]
});

module.exports = GroupMember;
