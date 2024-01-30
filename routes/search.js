const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// controller
const {
    recordSearchTerm,
    getSearchReport,
  } = require("../controllers/search");

  router.post("/search-loop", recordSearchTerm);
  router.get("/loop-trending", getSearchReport);


  module.exports = router;
