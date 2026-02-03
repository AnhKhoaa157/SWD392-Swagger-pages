const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Answer content is required']
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: [true, 'Question is required']
    },
    isAiAssisted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    }
}, {
    timestamps: true
});

// Index
answerSchema.index({ question: 1 });
answerSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Answer', answerSchema);
