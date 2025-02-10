const express = require("express");
const router = express.Router();
const {
  startTrip,
  endTrip,
  updateTrip,
} = require("../controllers/tripController");

router.post("/start-trip", startTrip);
router.put("/end-trip/:id", endTrip);
router.put("/update-trip/:id", updateTrip);
module.exports = router;
