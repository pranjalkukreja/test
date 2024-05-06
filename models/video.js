const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // You can add more fields as needed, for example:
  // owner: {
  //   type: mongoose.Schema.ObjectId,
  //   ref: 'User',
  //   required: true,
  // },
  // likes: {
  //   type: Number,
  //   default: 0,
  // },
  // comments: [
  //   {
  //     type: mongoose.Schema.ObjectId,
  //     ref: 'Comment',
  //   },
  // ],
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
