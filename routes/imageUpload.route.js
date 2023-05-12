const express = require("express");
const router = express.Router();
const imageUploadController = require("../controller/imageUpload.controller");
const uploader = require("../middlewares/uploader");

router.post(
  "/single-image-upload",
  uploader.single("image"),
  imageUploadController.fileUpload
);

module.exports = router;