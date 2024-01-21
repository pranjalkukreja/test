const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const tagSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    emoji: String,
    icon: {
        type: String
    },
    featured: {
      type: Boolean,
      default: false
    }
  });
  
  module.exports = mongoose.model("Tag", tagSchema);
