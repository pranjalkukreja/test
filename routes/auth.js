const express = require("express");

const router = express.Router();

// middlewares
const { authCheck } = require("../middlewares/auth");

// controller
const { createOrUpdateUser, currentUser, createOrUpdateUserNumber, findFollowing, getFavorites, recordActivity, readUserDetails, createGuest, updateGuestLocation, updateGuestNotifications, getUniqueCountries, updateUserInfo, listAllUsers, listAllGuests, sendExpoNotifications, fetchNewsAndPrepareNotifications, createRandomNewsImage, getAnswerForQuestion } = require("../controllers/auth");

router.post("/create-or-update-user", authCheck, createOrUpdateUser);
router.post("/create-or-update-user-phone", authCheck, createOrUpdateUserNumber);
router.post("/current-user", authCheck, currentUser);
router.get("/user-favorites", getFavorites);
router.post("/update-user-record", authCheck, recordActivity);
router.get("/user-timing", readUserDetails);
router.post("/create-guest", createGuest);
router.post("/update-guest-location", updateGuestLocation);
router.post("/update-guest-code", updateGuestNotifications);
router.get('/user/countries', getUniqueCountries);
router.post('/user/update-info', authCheck, updateUserInfo);
router.get('/users/get-all', listAllUsers);
router.get('/guests/get-all', listAllGuests);
router.post('/loop/send-notification', sendExpoNotifications);
router.post("/send-not", fetchNewsAndPrepareNotifications);
router.get('/create-random-news-image', createRandomNewsImage);
router.post("/send-question", getAnswerForQuestion);
router.get('/trending-topics', findFollowing);


module.exports = router;
