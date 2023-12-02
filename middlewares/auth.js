const admin = require("../firebase");
const User = require("../models/user");

exports.authCheck = async (req, res, next) => {
  // console.log(req.headers.authtoken); // token
  try {
    const firebaseUser = await admin
      .auth()
      .verifyIdToken(req.headers.authtoken);
    // console.log("FIREBASE USER IN AUTHCHECK", firebaseUser);
    if (firebaseUser.email == null) {
      req.user = firebaseUser;
      req.user.email = `${firebaseUser.phone_number}@example.com`
    } else {
      req.user = firebaseUser;
    }
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({
      err: "Invalid or expired token",
    });
  }
};

exports.adminCheck = async (req, res, next) => {
  const { email } = req.user;

  const adminUser = await User.findOne({ email }).exec();

  if (adminUser.role !== "admin") {
    res.status(403).json({
      err: "Admin resource. Access denied.",
    });
  } else {
    next();
  }
};

exports.driverCheck = async (req, res, next) => {
  const { email } = req.user;

  const driverUser = await User.findOne({ email }).exec();

  if (driverUser.role == "driver" || driverUser.role == "admin") {
    next()
  } else {
    res.status(403).json({
      err: "Driver Resource. Access denied.",
    });
  }
};

exports.onlineCheck = async (req, res, next) => {
  const { email } = req.user;

  const driverUser = await User.findOne({ email }).exec();

  if (driverUser.role == "online" || driverUser.role == "admin") {
    next()
  } else {
    res.status(403).json({
      err: "Online Resource. Access denied.",
    });
  }
};

exports.storeChargeCheck = async (req, res, next) => {
  const { email } = req.user;

  const driverUser = await User.findOne({ email }).exec();

  if (driverUser.role == "storeCharge" || driverUser.role == "admin" || driverUser.role == "accounts") {
    next()
  } else {
    res.status(403).json({
      err: "Online Resource. Access denied.",
    });
  }
};

exports.cashierCheck = async (req, res, next) => {
  const { email } = req.user;

  const driverUser = await User.findOne({ email }).exec();

  if (driverUser.role == "storeCharge" || driverUser.role == "admin" || driverUser.role == "logistic" || driverUser.role == "cashier") {
    next()
  } else {
    res.status(403).json({
      err: "Online Resource. Access denied.",
    });
  }
};

exports.logisticCheck = async (req, res, next) => {
  const { email } = req.user;

  const driverUser = await User.findOne({ email }).exec();

  if (driverUser.role == "storeCharge" || driverUser.role == "admin" || driverUser.role == "logistic" || driverUser.role == "accounts") {
    next()
  } else {
    res.status(403).json({
      err: "Online Resource. Access denied.",
    });
  }
};

exports.accountsCheck = async (req, res, next) => {
  const { email } = req.user;

  const driverUser = await User.findOne({ email }).exec();

  if (driverUser.role == "accounts" || driverUser.role == "admin") {
    next()
  } else {
    res.status(403).json({
      err: "Online Resource. Access denied.",
    });
  }
};

exports.packerCheck = async (req, res, next) => {
  const { email } = req.user;

  const driverUser = await User.findOne({ email }).exec();

  if (driverUser.role == "storeCharge" || driverUser.role == "admin" || driverUser.role == "packer" || driverUser.role == "accounts") {
    next()
  } else {
    res.status(403).json({
      err: "Online Resource. Access denied.",
    });
  }
};




