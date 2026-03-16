/**
 * Database Models - Main Index (MySQL/Sequelize)
 * Central export point for all database models (Q&A System)
 */

const { sequelize, testConnection, syncDatabase } = require('../config/database.sequelize');

// AcademicCore Module (7 models for Q&A system)
const AcademicCore = require('./academicCore');

// Export all models
module.exports = {
    // Database connection
    sequelize,
    testConnection,
    syncDatabase,

    // AcademicCore Models (INT-based, matching SQL schema)
    User: AcademicCore.User,
    Topic: AcademicCore.Topic,
    Class: AcademicCore.Class,
    Semester: AcademicCore.Semester,
    StudentGroup: AcademicCore.StudentGroup,
    GroupMember: AcademicCore.GroupMember,
    Question: AcademicCore.Question,
    Answer: AcademicCore.Answer,
    Submission: AcademicCore.Submission,
    Task: AcademicCore.Task,

    // Module export for grouped access
    AcademicCore
};
