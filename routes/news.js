const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// controller
const {
    create,
    list,
    saveNews
  } = require("../controllers/news");

  router.post("/blog-create", authCheck, adminCheck, create);
  router.get("/news", list);
  router.post("/update-news", saveNews);


  module.exports = router;
