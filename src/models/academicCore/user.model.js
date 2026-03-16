/**
 * User Model (MySQL/Sequelize)
 * Represents Student, Lecturer, and Manager
 */
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../../config/database.sequelize');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
        field: 'student_code'
    },
    fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Full name is required' }
        },
        field: 'full_name'
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Email already exists'
        },
        validate: {
            notEmpty: { msg: 'Email is required' },
            isEmail: { msg: 'Please provide a valid email' }
        }
    },
    avatarURL: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'avatar_url'
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Password is required' }
        },
        field: 'password_hash'
    },
    role: {
        type: DataTypes.ENUM('student', 'lecturer', 'manager'),
        allowNull: false,
        defaultValue: 'student',
        validate: {
            isIn: {
                args: [['student', 'lecturer', 'manager']],
                msg: 'Role must be student, lecturer, or manager'
            }
        }
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_email_verified'
    },
    otp: {
        type: DataTypes.STRING(6),
        allowNull: true
    },
    otpExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'otp_expires'
    },
    refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'refresh_token'
    },
    status: {
        type: DataTypes.ENUM('Online', 'Offline', 'Away'),
        defaultValue: 'Offline'
    },
    isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_online'
    },
    lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_seen_at'
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at'
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['email'], unique: true },
        { fields: ['student_code'], unique: true },
        { fields: ['role'] }
    ]
});

// Hash password before saving
User.beforeCreate(async (user) => {
    if (user.passwordHash) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('passwordHash')) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
    }
});

// Virtual getter for userId (alias for id) - for backward compatibility
User.prototype.toJSON = function() {
    const values = { ...this.get() };
    values.userId = values.id; // Add userId as alias for id
    return values;
};

// Method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Virtual property for userId
Object.defineProperty(User.prototype, 'userId', {
    get: function() {
        return this.id;
    }
});

module.exports = User;
