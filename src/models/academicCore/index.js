/**
 * AcademicCore Module - Index with Associations
 * Central export point for all Academic Core models
 */

const User = require('./user.model');
const Semester = require('./semester.model');
const Class = require('./class.model');
const ClassMember = require('./classMember.model');
const Topic = require('./topic.model');
const Group = require('./group.model');
const GroupMember = require('./groupMember.model');
const Milestone = require('./milestone.model');
const Submission = require('./submission.model');

// ====================================
// Define Associations
// ====================================

// User Associations
User.hasMany(Class, { foreignKey: 'lecturerId', as: 'classesManaged' });
User.hasMany(Topic, { foreignKey: 'createdBy', as: 'topicsCreated' });
User.hasMany(Submission, { foreignKey: 'gradedBy', as: 'gradedSubmissions' });
User.belongsToMany(Class, { through: ClassMember, foreignKey: 'studentId', as: 'classesEnrolled' });
User.belongsToMany(Group, { through: GroupMember, foreignKey: 'studentId', as: 'groups' });

// Semester Associations
Semester.hasMany(Class, { foreignKey: 'semesterId', as: 'classes' });

// Class Associations
Class.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Class.belongsTo(User, { foreignKey: 'lecturerId', as: 'lecturer' });
Class.hasMany(Group, { foreignKey: 'classId', as: 'groups' });
Class.hasMany(Milestone, { foreignKey: 'classId', as: 'milestones' });
Class.belongsToMany(User, { through: ClassMember, foreignKey: 'classId', as: 'students' });

// ClassMember Associations
ClassMember.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
ClassMember.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Topic Associations
Topic.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Topic.hasMany(Group, { foreignKey: 'topicId', as: 'groups' });

// Group Associations
Group.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
Group.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });
Group.hasMany(Submission, { foreignKey: 'groupId', as: 'submissions' });
Group.belongsToMany(User, { through: GroupMember, foreignKey: 'groupId', as: 'members' });

// GroupMember Associations
GroupMember.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
GroupMember.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Milestone Associations
Milestone.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
Milestone.hasMany(Submission, { foreignKey: 'milestoneId', as: 'submissions' });

// Submission Associations
Submission.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Submission.belongsTo(Milestone, { foreignKey: 'milestoneId', as: 'milestone' });
Submission.belongsTo(User, { foreignKey: 'gradedBy', as: 'grader' });

// ====================================
// Export Models
// ====================================

module.exports = {
    User,
    Semester,
    Class,
    ClassMember,
    Topic,
    Group,
    GroupMember,
    Milestone,
    Submission
};
