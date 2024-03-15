const express = require("express");
const router = express.Router();

const {
    scrapeCrimeData
  } = require("../controllers/crime");

  router.get("/get-crime", scrapeCrimeData);

  module.exports = router;
