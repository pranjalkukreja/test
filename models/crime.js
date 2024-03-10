const mongoose = require("mongoose");

const crimeDescriptionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    icon: {
        type: String,
        required: false,
        trim: true,
    },
    severity: {
        type: String,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("CrimeDescription", crimeDescriptionSchema);
