const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const activityLogSchema = new mongoose.Schema({
  article: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number,
    required: true
  }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: String,
    lastName: String,

    email: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      default: "subscriber",
    },
    cart: {
      type: Array,
      default: [],
    },
    city: String,
    country: String,
    cityAddress: String,
    StateAddress: String,
    ZipAddress: String,
    PhoneNumber: Number,
    Points: {
      type: Number,
      default: 0
    },
    orders: Number,
    customerLogs: [{ type: String }],
    giftReceived: Boolean,
    customCode: String,
    referralPoints: Number,
    restricted: Boolean,
    wishlist: [{ type: ObjectId, ref: "Product" }],
    employee: { type: ObjectId, ref: "Employee" },
    expoToken: String,
    paymentIntent: {},
    likes: [{ type: ObjectId, ref: "Article" }],
    interestScores: {
      type: Map,
      of: Number,
      default: {}
    },
    activityLog: [activityLogSchema],
    tags: [{ tag: { type: ObjectId, ref: "Tag" }, score: Number }],
    guestId: {
      type: ObjectId,
      ref: 'Guest',
      required: false
  }

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
