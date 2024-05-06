const express = require("express");
const router = express.Router();
const multer = require("multer")
const upload1 = multer({ dest: 'uploads/' });

const {
    scrapeCrimeData,
    uploadImage, remove, getImages, createVideo
  } = require("../controllers/crime");

  router.get("/get-crime", scrapeCrimeData);
  router.post("/uploadimages", upload1.single('image'), uploadImage);
  router.post("/removeimage", remove);
  router.get('/images-all', getImages);
  router.post("/create-video", createVideo);

  module.exports = router;
