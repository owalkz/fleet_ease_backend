const express = require("express");
const router = express.Router();
const { createVehicle } = require("../controllers/vehicleController");

router.post("/create-vehicle", createVehicle);
module.exports = router;