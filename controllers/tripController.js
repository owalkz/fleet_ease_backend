const Vehicle = require("../models/vehicleModel");
const Driver = require("../models/driverModel");
const Trip = require("../models/tripModel");
const haversineDistance = require("../utils/functions/distanceCalculator");

const startTrip = async (req, res, next) => {
  try {
    const { driverId, vehicleId, startLocation } = req.body;
    if (!driverId || !vehicleId || !startLocation)
      return res.status(422).json({ message: "All fields are required!" });
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(400).json({ message: "Driver not found!" });
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle)
      return res.status(400).json({ message: "Vehicle not found!" });
    const newTrip = new Trip({
      driverId,
      vehicleId,
      startLocation,
      status: "active",
      speedLogs: [],
    });
    newTrip.speedLogs.push({
      speed: 0,
      timestamp: new Date(),
      longitude: startLocation.longitude,
      latitude: startLocation.latitude,
    });
    await newTrip.save();
    return res
      .status(201)
      .json({ message: "Trip started successfully!", trip: newTrip });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating trip.", error: error.message });
  }
};

const updateTrip = async (req, res, next) => {
  try {
    const { speed, latitude, longitude, eventType } = req.body;
    const tripId = req.params.id;
    const trip = await Trip.findById(tripId);
    if (!trip || trip.status !== "active") {
      return res
        .status(400)
        .json({ message: "Trip not found or already completed" });
    }
    // Get last logged GPS point
    if (trip.speedLogs.length > 0) {
      const lastLog = trip.speedLogs[trip.speedLogs.length - 1];
      const distance = haversineDistance(
        lastLog.latitude,
        lastLog.longitude,
        latitude,
        longitude
      );
      // Update distance traveled
      trip.distanceTraveled += distance;
    }
    trip.speedLogs.push({ speed, timestamp: new Date(), longitude, latitude, eventType });
    trip.endLocation = { latitude, longitude };
    await trip.save();
    return res.status(200).json({ message: "Trip updated successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error Updating Trip" });
  }
};

const endTrip = async (req, res, next) => {
  try {
    const tripId = req.params.id;
    const trip = await Trip.findById(tripId);
    if (!trip || trip.status !== "active") {
      return res
        .status(400)
        .json({ message: "Trip not found or already completed" });
    }
    trip.endTime = new Date();
    trip.status = "completed";
    await trip.save();
    return res.status(200).json({ message: "Trip ended successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error Ending Trip" });
  }
};

module.exports = {
  startTrip,
  endTrip,
  updateTrip,
};
