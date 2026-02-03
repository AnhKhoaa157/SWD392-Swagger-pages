const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Question content is required']
    },
    status: {
        type: String,
        enum: ['pending', 'answered', 'closed'],
        default: 'pending'
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: [true, 'Group is required']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    askedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Asked by user is required']
    }
}, {
    timestamps: true
});

// Indexes
questionSchema.index({ group: 1, status: 1 });
questionSchema.index({ assignedTo: 1 });
questionSchema.index({ askedBy: 1 });

module.exports = mongoose.model('Question', questionSchema);
