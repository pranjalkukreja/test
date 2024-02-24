const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// controller
const {
    create,
    list,
    saveNews,
    getWeeklyNewsByTag,
    getTopNewsByCategory,
    likePost,
    updateUserInterest,
    refreshUserInterest,
    weatherSearch,
    weatherForecastSearchSimple
  } = require("../controllers/news");

  router.post("/blog-create", authCheck, adminCheck, create);
  router.get("/news", list);
  router.post("/update-news", saveNews);
  router.get("/news-flash", getWeeklyNewsByTag);
  router.get('/flash-news', getTopNewsByCategory)
  router.post("/like-article", authCheck, likePost);
  router.post('/update-interest', authCheck, updateUserInterest);
  router.post('/refresh-interest', refreshUserInterest);
  router.get("/weather-alert", weatherSearch);
  router.get("/weekly-weather", weatherForecastSearchSimple);

  module.exports = router;
