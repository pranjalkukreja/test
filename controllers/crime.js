const Tag = require("../models/tag");
const Guest = require('../models/guest');
const axios = require('axios');
const mongoose = require("mongoose");
const Crime = require("../models/crime");
const CrimeReport = require('../models/crimeReport');
const User = require("../models/user");

// Define an exported function that can be used as an Express route handler
exports.scrapeCrimeData = async (req, res) => {
  try {
   
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ success: false, error: 'Failed to scrape data' });
  }
};

