const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  searchTerm: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  country: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false 
  }
});

module.exports = mongoose.model('Search', searchSchema);
