const mongoose = require('mongoose');

const aiSuggestionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Suggestion content is required']
    },
    answer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer',
        required: [true, 'Answer is required']
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    source: {
        type: String,
        default: 'AI Model'
    }
}, {
    timestamps: true
});

// Index
aiSuggestionSchema.index({ answer: 1 });

module.exports = mongoose.model('AISuggestion', aiSuggestionSchema);
