const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    creditHours: { type: Number, required: true },
    isLab: { type: Boolean, required: true }
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
