const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

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
    address: String,
    unitAddress: String,
    cityAddress: String,
    StateAddress: String,
    ZipAddress: String,
    PhoneNumber: Number,
    Points: {
      type: Number,
      default: 0
    },
    orders: Number,
    customerLogs: [{type: String}],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
