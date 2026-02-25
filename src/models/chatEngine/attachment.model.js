/**
 * ChatEngine Module - Attachment Model (MySQL/Sequelize)
 * Represents file attachments in messages
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.sequelize');

const Attachment = sequelize.define('Attachment', {
    attachmentId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'attachment_id'
    },
    messageId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'messages',
            key: 'message_id'
        },
        field: 'message_id'
    },
    fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'File name is required' }
        },
        field: 'file_name'
    },
    fileType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'File type is required' }
        },
        field: 'file_type'
    },
    filePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'File path is required' }
        },
        field: 'file_path'
    },
    fileSize: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
            min: {
                args: [0],
                msg: 'File size cannot be negative'
            }
        },
        field: 'file_size'
    },
    thumbnailPath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'thumbnail_path'
    },
    uploadedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        field: 'uploaded_by'
    },
    status: {
        type: DataTypes.ENUM('Uploading', 'Available', 'Deleted', 'Failed'),
        defaultValue: 'Available'
    }
}, {
    tableName: 'attachments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['message_id'] },
        { fields: ['uploaded_by'] },
        { fields: ['created_at'] },
        { fields: ['file_type'] },
        { fields: ['status'] }
    ]
});

// Instance Methods
Attachment.prototype.isImage = function() {
    return this.fileType.startsWith('image/');
};

Attachment.prototype.isDocument = function() {
    const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
    return docTypes.some(type => this.fileType.includes(type));
};

Attachment.prototype.getFormattedSize = function() {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (this.fileSize === 0) return '0 Bytes';
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

module.exports = Attachment;
