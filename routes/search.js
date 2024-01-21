const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// controller
const {
    recordSearchTerm,
    getSearchStats,
  } = require("../controllers/search");

  router.post("/search-loop", recordSearchTerm);
  

  module.exports = router;
