/**
 * AcademicCore Module - User Model (MySQL/Sequelize)
 * Represents Student, Lecturer, and Admin entities
 */
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../../config/database.sequelize');

const User = sequelize.define('User', {
    userId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'user_id'
    },
    studentCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: {
            msg: 'Student code already exists'
        },
        validate: {
            is: {
                args: /^(SE\d{6}|AD\d{4})$/,
                msg: 'Student code must be in format SE followed by 6 digits or AD followed by 4 digits'
            }
        },
        field: 'student_code'
    },
    fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Full name is required' },
            len: {
                args: [1, 100],
                msg: 'Full name cannot exceed 100 characters'
            }
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
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Password is required' },
            len: {
                args: [6, 255],
                msg: 'Password must be at least 6 characters'
            }
        },
        field: 'password_hash'
    },
    role: {
        type: DataTypes.ENUM('Student', 'Lecturer', 'Admin'),
        allowNull: false,
        defaultValue: 'Student',
        validate: {
            isIn: {
                args: [['Student', 'Lecturer', 'Admin']],
                msg: 'Role must be Student, Lecturer, or Admin'
            }
        }
    },
    avatarURL: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'avatar_url'
    },
    status: {
        type: DataTypes.ENUM('Online', 'Away', 'Offline'),
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
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['email'], unique: true },
        { fields: ['role'] },
        { fields: ['is_online'] },
        { fields: ['status'] }
    ],
    hooks: {
        beforeCreate: async (user) => {
            if (user.passwordHash) {
                const salt = await bcrypt.genSalt(10);
                user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('passwordHash')) {
                const salt = await bcrypt.genSalt(10);
                user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
            }
        }
    }
});

// Instance Methods
User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

User.prototype.updateOnlineStatus = async function(isOnline) {
    this.isOnline = isOnline;
    this.status = isOnline ? 'Online' : 'Offline';
    this.lastSeenAt = new Date();
    return await this.save();
};

User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.passwordHash;
    delete values.refreshToken;
    return values;
};

module.exports = User;
