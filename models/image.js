const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  public_id: String, // Unique identifier for the image
  url: String, // URL to access the image
  alt: {
    type: String,
    text: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Image', imageSchema);
