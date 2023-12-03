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
    likePost
  } = require("../controllers/news");

  router.post("/blog-create", authCheck, adminCheck, create);
  router.get("/news", list);
  router.post("/update-news", saveNews);
  router.get("/news-flash", getWeeklyNewsByTag);
  router.get('/flash-news', getTopNewsByCategory)
  router.post("/like-article", authCheck, likePost);

  module.exports = router;
