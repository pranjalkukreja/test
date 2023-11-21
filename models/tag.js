const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const tagSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    icon: {
        type: String
    },
    featured: Boolean
  });
  
  module.exports = mongoose.model("Tag", tagSchema);
