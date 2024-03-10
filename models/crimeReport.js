const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const crimeReportSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
    },
    crimeDescription: {
        type: ObjectId,
        ref: 'CrimeDescription',
        required: true,
    },
    reportedBy: {
        type: ObjectId,
        ref: 'User',
        required: true,
    },
    evidence: [{
        type: String, // This could be URLs to images, videos, or other documents
        required: false,
    }]
}, { timestamps: true });

module.exports = mongoose.model("CrimeReport", crimeReportSchema);
