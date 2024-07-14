const express = require("express");
const router = express.Router();

const {
    sendInstaMsg, getInstaMsg, metaWebhook, metaMessage
  } = require("../controllers/chatbot");

  router.post("/instagram/messages", sendInstaMsg);
  router.get("/instagram/messages", getInstaMsg);
  router.get("/meta-webhook", metaWebhook);
  router.post("/meta-webhook", metaMessage);

  module.exports = router;
