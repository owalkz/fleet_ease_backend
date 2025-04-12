const express = require("express");
const {
  createVehicle,
  getAllVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
} = require("../controllers/vehicleController");
const protect = require("../middleware/authMiddleware");

module.exports = (upload) => {
  const router = express.Router();
  router.get("/vehicle", protect, getVehicle);
  router.get("/:managerId", protect, getAllVehicles);
  router.put("/:id", protect, upload.single("file"), updateVehicle);
  router.post("/create-vehicle", protect, upload.single("file"), createVehicle);
  router.post("/assign", protect, assignDriverToVehicle);
  router.post("/unassign", protect, unassignDriverFromVehicle);
  router.delete("/:id", protect, deleteVehicle);
  return router;
};
