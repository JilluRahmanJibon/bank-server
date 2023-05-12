const express = require("express");
const contactInfoController = require("../controller/contactInfo.controller");

const router = express.Router();

router.post("/contact-info",contactInfoController.contactInfo);

module.exports = router;