const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getManagerOverviewReport,
  getMonthlyTripStats,
  getVehicleUsageReport,
  getDriverSummaryReport,
  getDriversWithExpiringLicenses,
  getDriverPerformanceReport,
  getServiceOverdueVehicles,
  getVehicleUsageBreakdown,
  getVehiclesWithExpiringInsurance,
  getTripSummaryReport,
  getHarshEventsReport,
  getTripVolumeComparison,
} = require("../controllers/reportController");

router.get("/manager/overview", protect, getManagerOverviewReport);
router.get("/monthly-trip-stats", protect, getMonthlyTripStats);
router.get("/vehicle-usage-report", protect, getVehicleUsageReport);
router.get("/driver/summary", protect, getDriverSummaryReport);
router.get("/driver/license-expiry", protect, getDriversWithExpiringLicenses);
router.get("/driver/performance", protect, getDriverPerformanceReport);
router.get("/vehicle/service-overdue", protect, getServiceOverdueVehicles);
router.get("/vehicle/usage-breakdown", protect, getVehicleUsageBreakdown);
router.get(
  "/vehicle/insurance-expiry",
  protect,
  getVehiclesWithExpiringInsurance
);
router.get("/trips/summary", protect, getTripSummaryReport);
router.get("/trips/harsh-events", protect, getHarshEventsReport);
router.get("/trips/volume-comparison", protect, getTripVolumeComparison);

module.exports = router;
