const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const tagSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    emoji: {
      type: String,
      default: '📰'
    },
    icon: {
        type: String
    },
    featured: {
      type: Boolean,
      default: false
    },
    countryCode: [String],
    trendScore: [{
      date: Date,
      score: Number
    }]
  });
  
  module.exports = mongoose.model("Tag", tagSchema);
