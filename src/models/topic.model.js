const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Topic title is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'pending'],
        default: 'pending'
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: [true, 'Semester is required']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    }
}, {
    timestamps: true
});

// Index for faster queries
topicSchema.index({ semester: 1, status: 1 });
topicSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Topic', topicSchema);
