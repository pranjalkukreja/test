const express = require("express");
const router = express.Router();

const {
    create,
    list,
    read,
    update,
    findKeywordsWithFAQs
  } = require("../controllers/keyword");

  router.post("/create-keyword", create);
  router.get("/keywords", list);
  router.get("/keyword/:_id", read);
  router.put("/keyword/:_id", update);
  router.post('/find-keywords', findKeywordsWithFAQs);

  module.exports = router;
