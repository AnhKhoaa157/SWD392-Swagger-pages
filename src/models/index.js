/**
 * Database Models - Main Index (MySQL/Sequelize)
 * Central export point for all database models
 */

const { sequelize, testConnection, syncDatabase } = require('../config/database.sequelize');

// AcademicCore Module
const AcademicCore = require('./academicCore');

// ChatEngine Module  
const ChatEngine = require('./chatEngine');

// Export all models
module.exports = {
    // Database connection
    sequelize,
    testConnection,
    syncDatabase,

    // AcademicCore Models
    User: AcademicCore.User,
    Semester: AcademicCore.Semester,
    Class: AcademicCore.Class,
    ClassMember: AcademicCore.ClassMember,
    Topic: AcademicCore.Topic,
    Group: AcademicCore.Group,
    GroupMember: AcademicCore.GroupMember,
    Milestone: AcademicCore.Milestone,
    Submission: AcademicCore.Submission,

    // ChatEngine Models
    Channel: ChatEngine.Channel,
    ChannelMember: ChatEngine.ChannelMember,
    Message: ChatEngine.Message,
    Attachment: ChatEngine.Attachment,
    Reaction: ChatEngine.Reaction,

    // Module exports for grouped access
    AcademicCore,
    ChatEngine
};
