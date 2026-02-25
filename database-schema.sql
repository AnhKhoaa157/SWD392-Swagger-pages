-- =====================================================
-- Academic Collaboration Platform - MySQL Database Schema
-- MySQL 8.0+ Compatible
-- =====================================================
-- This file provides complete MySQL DDL for the database
-- Implementation uses Sequelize ORM with Node.js
-- =====================================================

-- Drop existing database and create new one
DROP DATABASE IF EXISTS academic_collaboration_db;
CREATE DATABASE academic_collaboration_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE academic_collaboration_db;

-- =====================================================
-- MODULE 1: ACADEMIC CORE
-- =====================================================

-- -----------------------------------------------------
-- Table: users (Student/Lecturer/Admin)
-- -----------------------------------------------------
CREATE TABLE users (
    user_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_code VARCHAR(20) NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Student', 'Lecturer', 'Admin') NOT NULL DEFAULT 'Student',
    avatar_url VARCHAR(255) NULL,
    status ENUM('Online', 'Away', 'Offline') DEFAULT 'Offline',
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at DATETIME NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    otp VARCHAR(6) NULL,
    otp_expires DATETIME NULL,
    refresh_token TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_student_code (student_code),
    INDEX idx_role (role),
    INDEX idx_is_online (is_online),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: semesters
-- -----------------------------------------------------
CREATE TABLE semesters (
    semester_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Upcoming', 'Active', 'Completed') DEFAULT 'Upcoming',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_start_date (start_date),
    INDEX idx_status (status),
    INDEX idx_date_range (start_date, end_date),
    CONSTRAINT chk_end_after_start CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: classes (Course Section)
-- -----------------------------------------------------
CREATE TABLE classes (
    class_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    semester_id CHAR(36) NOT NULL,
    lecturer_id CHAR(36) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    slack_space_name VARCHAR(100) NULL UNIQUE,
    description VARCHAR(500) NULL,
    status ENUM('Active', 'Inactive', 'Completed') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id) ON DELETE CASCADE,
    FOREIGN KEY (lecturer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_semester_id (semester_id),
    INDEX idx_lecturer_id (lecturer_id),
    INDEX idx_slack_space_name (slack_space_name),
    INDEX idx_semester_lecturer (semester_id, lecturer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: class_members (Junction Table)
-- -----------------------------------------------------
CREATE TABLE class_members (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    class_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Dropped', 'Completed') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_student (class_id, student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: topics
-- -----------------------------------------------------
CREATE TABLE topics (
    topic_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    created_by CHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description_file VARCHAR(255) NULL,
    description TEXT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Assigned') DEFAULT 'Pending',
    max_groups INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_fulltext_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: groups (Project Team)
-- -----------------------------------------------------
CREATE TABLE `groups` (
    group_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    class_id CHAR(36) NOT NULL,
    topic_id CHAR(36) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    status ENUM('Forming', 'Active', 'Completed', 'Disbanded') DEFAULT 'Forming',
    max_members INT DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_group_name (class_id, group_name),
    INDEX idx_class_id (class_id),
    INDEX idx_topic_id (topic_id),
    INDEX idx_class_topic (class_id, topic_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: group_members (Junction Table)
-- -----------------------------------------------------
CREATE TABLE group_members (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    group_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    role ENUM('Leader', 'Member') DEFAULT 'Member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Left', 'Removed') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_student (group_id, student_id),
    INDEX idx_group_id (group_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: milestones
-- -----------------------------------------------------
CREATE TABLE milestones (
    milestone_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    class_id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    deadline DATETIME NOT NULL,
    weight DECIMAL(5,2) DEFAULT 10.00,
    status ENUM('Upcoming', 'Active', 'Closed') DEFAULT 'Upcoming',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_milestone_name (class_id, name),
    INDEX idx_class_id (class_id),
    INDEX idx_deadline (deadline),
    INDEX idx_class_deadline (class_id, deadline),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: submissions
-- -----------------------------------------------------
CREATE TABLE submissions (
    submission_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    group_id CHAR(36) NOT NULL,
    milestone_id CHAR(36) NOT NULL,
    link_repo VARCHAR(500) NULL,
    description TEXT NULL,
    grade DECIMAL(5,2) NULL,
    feedback TEXT NULL,
    graded_by CHAR(36) NULL,
    graded_at DATETIME NULL,
    submission_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Draft', 'Submitted', 'Graded', 'Late', 'Resubmission') DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id) ON DELETE CASCADE,
    FOREIGN KEY (milestone_id) REFERENCES milestones(milestone_id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_group_milestone (group_id, milestone_id),
    INDEX idx_group_id (group_id),
    INDEX idx_milestone_id (milestone_id),
    INDEX idx_group_milestone (group_id, milestone_id),
    INDEX idx_status (status),
    INDEX idx_submission_at (submission_at),
    INDEX idx_graded_by (graded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- MODULE 2: CHAT ENGINE
-- =====================================================

-- -----------------------------------------------------
-- Table: channels
-- -----------------------------------------------------
CREATE TABLE channels (
    channel_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    class_id CHAR(36) NULL,
    group_id CHAR(36) NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('PUBLIC', 'PRIVATE') NOT NULL,
    description VARCHAR(500) NULL,
    created_by CHAR(36) NOT NULL,
    status ENUM('Active', 'Archived', 'Deleted') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_class_id (class_id),
    INDEX idx_group_id (group_id),
    INDEX idx_type (type),
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: channel_members (Junction Table)
-- -----------------------------------------------------
CREATE TABLE channel_members (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    channel_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    role ENUM('Owner', 'Admin', 'Member') DEFAULT 'Member',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Muted', 'Left') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_channel_user (channel_id, user_id),
    INDEX idx_channel_id (channel_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_joined_at (joined_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: messages
-- -----------------------------------------------------
CREATE TABLE messages (
    message_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    channel_id CHAR(36) NOT NULL,
    sender_id CHAR(36) NOT NULL,
    parent_msg_id CHAR(36) NULL,
    content TEXT NOT NULL,
    message_type ENUM('Text', 'File', 'System', 'Code', 'Image') DEFAULT 'Text',
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    mentions JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_msg_id) REFERENCES messages(message_id) ON DELETE SET NULL,
    INDEX idx_channel_created (channel_id, created_at),
    INDEX idx_sender_id (sender_id),
    INDEX idx_parent_msg_id (parent_msg_id),
    INDEX idx_created_at (created_at),
    INDEX idx_channel_parent (channel_id, parent_msg_id),
    INDEX idx_is_deleted (is_deleted),
    FULLTEXT idx_fulltext_content (content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: attachments
-- -----------------------------------------------------
CREATE TABLE attachments (
    attachment_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    message_id CHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    thumbnail_path VARCHAR(500) NULL,
    uploaded_by CHAR(36) NOT NULL,
    status ENUM('Uploading', 'Available', 'Deleted', 'Failed') DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_message_id (message_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_created_at (created_at),
    INDEX idx_file_type (file_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: reactions
-- -----------------------------------------------------
CREATE TABLE reactions (
    reaction_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    message_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    emoji_name VARCHAR(50) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_message_user_emoji (message_id, user_id, emoji),
    INDEX idx_message_id (message_id),
    INDEX idx_user_id (user_id),
    INDEX idx_emoji (emoji),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
