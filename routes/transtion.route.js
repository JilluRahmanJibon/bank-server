const express = require("express");
const transtionController = require("../controller/transtion.controller");

const router = express.Router();

router.post("/new-request",transtionController.transtion);

module.exports = router;