const express = require("express");
const router = express.Router();

const {
    create,
    list,
    read,
    update,
    findKeywordsWithFAQs,
    analyzeKeywords
  } = require("../controllers/keyword");

  router.post("/create-keyword", create);
  router.get("/keywords", list);
  router.get("/keyword/:_id", read);
  router.put("/keyword/:_id", update);
  router.post('/find-keywords', findKeywordsWithFAQs);
  router.post('/analyze-keywords', analyzeKeywords);

  module.exports = router;
