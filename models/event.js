const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: false,
        trim: true,
    },
    location: {
        type: String,
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    categories: [{
        type: String,
        required: false,
    }],
    isVirtual: {
        type: Boolean,
        required: true,
        default: false,
    },
    islive: {
        type: Boolean,
        required: true,
        default: false,
    },
},  { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
