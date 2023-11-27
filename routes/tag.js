const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// controller
const {
    list,
    saveTags,
    read,
    readFeatured
  } = require("../controllers/tag");

  router.get("/tags", list);
  router.post('/tag-update', saveTags)
  router.get("/tag/:slug", read);
  router.get("/tags-featured", readFeatured);


  module.exports = router;
