const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// controller
const {
    list,
    saveTags,
    read
  } = require("../controllers/tag");

  router.get("/tags", list);
  router.post('/tag-update', saveTags)
  router.get("/tag/:slug", read);


  module.exports = router;
