const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// controller
const {
    list,
    saveTags,
    read,
    readFeatured,
    readByInterests,
    create, 
    update,
    readTag,
    readLocalNews,
    updateTagStats,
    getTrendingTags,
    updateInterestScores
  } = require("../controllers/tag");

  router.post('/tag-create', authCheck, adminCheck, create)
  router.get("/tags", list);
  router.post('/tag-update', saveTags)
  router.get("/tag/:slug", read);
  router.get("/tags-featured", readFeatured);
  router.post("/tags-interests", readByInterests);
  router.get("/read-tag/:slug", readTag);
  router.put('/update-tags/:slug', authCheck, adminCheck, update);
  router.get("/read-local", readLocalNews);
  router.post("/tags-trending", updateTagStats);
  router.get("/read-trendy-tags", getTrendingTags);
  router.post("/update-guest-interests", updateInterestScores);

  module.exports = router;
