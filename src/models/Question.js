// models/Question.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    label: {type: String, required: true}, url: {type: String, required: true}
}, {_id: false});

const contentSchema = new mongoose.Schema({
    textHtml: {type: String, required: true}, images: {type: [imageSchema], default: []}
}, {_id: false});

const choiceSchema = new mongoose.Schema({
    label: {enum: [1, 2, 3, 4], required: true},
    textHtml: {type: String, required: true},
    images: {type: [imageSchema], default: []}
}, {_id: false});

const questionSchema = new mongoose.Schema({
    examYear: {type: Number, required: true},
    stream: {type: String, enum: ['ریاضی', 'تجربی', 'انسانی'], required: true},
    subject: {type: String, required: true},
    topic: {type: String},
    difficulty: {type: String, enum: ['آسان', 'متوسط', 'سخت'], default: 'متوسط'},
    body: {type: contentSchema, required: true},
    choices: {type: [choiceSchema], validate: v => v.length === 4, required: true},
    correctChoice: {enum: [1, 2, 3, 4], required: true},
    solution: {type: contentSchema, required: true},
}, {
    timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);