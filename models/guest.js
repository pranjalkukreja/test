const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const guestSchema = new mongoose.Schema({
    appId: String,
    expoKey: String,
    city: String,
    country: String,
    countryCode: String,
    userId: {
        type: ObjectId,
        ref: 'User',
        required: false
    }
});

module.exports = mongoose.model("Guest", guestSchema);
