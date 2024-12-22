// backend/models/timetable.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TeacherSchema = new Schema({
    teacher: { type: String, required: true ,unique: true},
    subject: [{ type: String, required: true }],
    
});

module.exports  = mongoose.model('Teacher', TeacherSchema);

