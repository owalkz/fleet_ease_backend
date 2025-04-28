const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createTrip,
  startTrip,
  endTrip,
  updateTrip,
  updateTripDetails,
  deleteTrip,
  getManagerTrips,
  getDriverTrips,
  getCompletedTrips,
  getPendingTrips,
  getTripsApproachingDeadline,
  getDriverTripSummary,
  getTripSummaryOverTime,
  getManagerSummary,
  getTrip
} = require("../controllers/tripController");

router.get("/summary", protect, getManagerSummary);
router.post("/create-trip", protect, createTrip);
router.get("/getTrip/:tripId", protect, getTrip);
router.get("/manager/:managerId", protect, getManagerTrips);
router.get("/driver/:driverId", protect, getDriverTrips);
router.get("/completed/:userId", protect, getCompletedTrips);
router.get("/pending/:managerId", protect, getPendingTrips);
router.get(
  "/approaching-deadline/:managerId",
  protect,
  getTripsApproachingDeadline
);
router.get("/driver-summary/:driverId", protect, getDriverTripSummary);
router.get("/summary-over-time/:driverId", protect, getTripSummaryOverTime);
router.post("/start-trip/:tripId", protect, startTrip);
router.put("/end-trip/:id", protect, endTrip);
router.put("/update/:tripId", protect, updateTripDetails);
router.put("/update-trip/:id", protect, updateTrip);
router.delete("/delete/:tripId", protect, deleteTrip);

module.exports = router;
