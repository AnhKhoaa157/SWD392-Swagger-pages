const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Semester name is required'],
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'upcoming'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Semester', semesterSchema);
