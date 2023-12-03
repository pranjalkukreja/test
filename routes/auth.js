const express = require("express");

const router = express.Router();

// middlewares
const { authCheck, adminCheck, driverCheck, storeChargeCheck, cashierCheck, logisticCheck, accountsCheck } = require("../middlewares/auth");

// controller
const { createOrUpdateUser, currentUser, createOrUpdateUserNumber, getFavorites } = require("../controllers/auth");

router.post("/create-or-update-user", authCheck, createOrUpdateUser);
router.post("/create-or-update-user-phone", authCheck, createOrUpdateUserNumber);
router.post("/current-user", authCheck, currentUser);
router.get("/user-favorites", getFavorites);


module.exports = router;
