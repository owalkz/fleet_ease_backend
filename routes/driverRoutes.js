const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  addDriverToCompany,
  removeDriverFromCompany,
  getAvailableDrivers,
  getDriversByManager,
  getDriverVehicle,
  getUnassignedDrivers,
} = require("../controllers/driverController");

router.get("/available", protect, getAvailableDrivers);
router.get("/:managerId", protect, getDriversByManager);
router.get("/", protect, getUnassignedDrivers);
router.get("/vehicle/:driverId", protect, getDriverVehicle);
router.put("/add", protect, addDriverToCompany);
router.put("/remove", protect, removeDriverFromCompany);
module.exports = router;
