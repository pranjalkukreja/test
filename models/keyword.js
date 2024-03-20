const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const answerSchema = new mongoose.Schema({
    value: { type: String, required: true },
    helpful: [{ type: ObjectId, ref: "Guest" }]
});

const faqSchema = new mongoose.Schema({
    question: { type: String, required: true },
    live: { type: Boolean, default: false },
    answers: [answerSchema]
});

const keywordSchema = new mongoose.Schema({
    keyword: { type: String, required: true, unique: true },
    FAQs: [faqSchema]
});

module.exports = mongoose.model("Keyword", keywordSchema);
