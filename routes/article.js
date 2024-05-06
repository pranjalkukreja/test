const express = require("express");
const router = express.Router();

const {
    list,
    productStar,
    rephraseNews
  } = require("../controllers/articles");

  router.get("/get-articles", list);
  router.put("/product/star/:productId", productStar);
  router.post("/rephrase-article", rephraseNews);

  module.exports = router;
