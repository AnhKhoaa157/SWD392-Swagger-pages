/**
 * AcademicCore Module - Index with Associations
 * Central export point for all Academic Core models
 */

const User = require('./user.model');
const Topic = require('./topic.model');
const Class = require('./class.model');
const Semester = require('./semester.model');
const StudentGroup = require('./studentGroup.model');
const GroupMember = require('./groupMember.model');
const Question = require('./question.model');
const Answer = require('./answer.model');
const Submission = require('./submission.model');
const Task = require('./task.model');

// ====================================
// Define Associations
// ====================================

// User Associations
User.hasMany(Class, { foreignKey: 'lecturerId', as: 'classesManaged' });
User.hasMany(Topic, { foreignKey: 'proposedBy', as: 'topicsProposed' });
User.hasMany(Topic, { foreignKey: 'approvedBy', as: 'topicsApproved' });
User.hasMany(Question, { foreignKey: 'askedBy', as: 'questionsAsked' });
User.hasMany(Answer, { foreignKey: 'answeredBy', as: 'answersGiven' });
User.hasMany(Submission, { foreignKey: 'submittedBy', as: 'submissions' });
User.hasMany(Submission, { foreignKey: 'gradedBy', as: 'gradedSubmissions' });
User.hasMany(Task, { foreignKey: 'createdBy', as: 'tasksCreated' });
User.hasMany(Task, { foreignKey: 'assigneeId', as: 'tasksAssigned' });
User.belongsToMany(StudentGroup, { through: GroupMember, foreignKey: 'studentId', as: 'groups' });

// Topic Associations
Topic.belongsTo(User, { foreignKey: 'proposedBy', as: 'proposer' });
Topic.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
Topic.hasMany(StudentGroup, { foreignKey: 'topicId', as: 'groups' });

// Class Associations
Class.belongsTo(User, { foreignKey: 'lecturerId', as: 'lecturer' });
Class.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Class.hasMany(StudentGroup, { foreignKey: 'classId', as: 'groups' });

// Semester Associations
Semester.hasMany(Class, { foreignKey: 'semesterId', as: 'classes' });

// StudentGroup Associations
StudentGroup.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
StudentGroup.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });
StudentGroup.hasMany(Question, { foreignKey: 'groupId', as: 'questions' });
StudentGroup.hasMany(Submission, { foreignKey: 'groupId', as: 'submissions' });
StudentGroup.hasMany(Task, { foreignKey: 'groupId', as: 'tasks' });
StudentGroup.belongsToMany(User, { through: GroupMember, foreignKey: 'groupId', as: 'members' });

// GroupMember Associations
GroupMember.belongsTo(StudentGroup, { foreignKey: 'groupId', as: 'group' });
GroupMember.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Question Associations
Question.belongsTo(StudentGroup, { foreignKey: 'groupId', as: 'group' });
Question.belongsTo(User, { foreignKey: 'askedBy', as: 'asker' });
Question.hasMany(Answer, { foreignKey: 'questionId', as: 'answers' });

// Answer Associations
Answer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });
Answer.belongsTo(User, { foreignKey: 'answeredBy', as: 'answerer' });

// Submission Associations
Submission.belongsTo(StudentGroup, { foreignKey: 'groupId', as: 'group' });
Submission.belongsTo(User, { foreignKey: 'submittedBy', as: 'submitter' });
Submission.belongsTo(User, { foreignKey: 'gradedBy', as: 'grader' });

// Task Associations
Task.belongsTo(StudentGroup, { foreignKey: 'groupId', as: 'group' });
Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });

// Export all models
module.exports = {
    User,
    Topic,
    Class,
    Semester,
    StudentGroup,
    GroupMember,
    Question,
    Answer,
    Submission,
    Task
};
