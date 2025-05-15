const express = require("express");
const { platformAssistant } = require("../controllers/aiController");

const router = express.Router();

router.post("/platform-assistant", platformAssistant);

module.exports = router;
