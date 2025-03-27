const Vehicle = require("../models/vehicleModel");
const Driver = require("../models/driverModel");
const Trip = require("../models/tripModel");
const haversineDistance = require("../utils/functions/distanceCalculator");

const createTrip = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { driverId, vehicleId, startLocation, destination, deadline } =
      req.body;

    // Validate Inputs
    if (!driverId || !vehicleId || !startLocation || !destination)
      return res.status(400).json({ message: "All fields are required!" });

    // Ensure driver and vehicle exist
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found!" });

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found!" });

    // Create the trip
    const newTrip = new Trip({
      managerId,
      driverId,
      vehicleId,
      startLocation,
      destination,
      deadline,
      status: "pending", // Trip will start once the driver begins it
    });

    await newTrip.save();
    res
      .status(201)
      .json({ message: "Trip created successfully!", trip: newTrip });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating trip", error: error.message });
  }
};

const startTrip = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const trip = await Trip.findById(tripId);

    if (!trip) return res.status(404).json({ message: "Trip not found!" });

    if (trip.status !== "pending")
      return res
        .status(400)
        .json({ message: "Trip is already active or completed!" });

    // ✅ Update vehicle status to "In Use"
    const vehicle = await Vehicle.findById(trip.vehicleId);
    if (!vehicle)
      return res.status(400).json({ message: "Vehicle not found!" });

    if (vehicle.status === "In Use") {
      return res.status(400).json({
        message: "Vehicle is already in use. Cannot start another trip!",
      });
    }

    vehicle.status = "In Use";
    await vehicle.save();

    // ✅ Start tracking
    trip.status = "active";
    trip.startTime = new Date();
    trip.speedLogs.push({
      speed: 0,
      timestamp: new Date(),
      longitude: trip.startLocation.longitude,
      latitude: trip.startLocation.latitude,
    });

    await trip.save();
    return res
      .status(200)
      .json({ message: "Trip started successfully!", trip });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error starting trip.", error: error.message });
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
    trip.speedLogs.push({
      speed,
      timestamp: new Date(),
      longitude,
      latitude,
      eventType,
    });
    trip.endLocation = { latitude, longitude };
    await trip.save();
    return res.status(200).json({ message: "Trip updated successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error Updating Trip" });
  }
};

const updateTripDetails = async (req, res) => {
  try {
    const { tripId } = req.params;
    const managerId = req.user.id;
    const { destination, deadline, driverId, vehicleId } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found!" });

    if (trip.managerId.toString() !== managerId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to modify this trip!" });
    }

    if (trip.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Trip cannot be modified once it has started!" });
    }

    // ✅ Update trip details
    if (destination) trip.destination = destination;
    if (deadline) trip.deadline = deadline;
    if (driverId) trip.driverId = driverId;
    if (vehicleId) trip.vehicleId = vehicleId;

    await trip.save();
    res.status(200).json({ message: "Trip updated successfully!", trip });
  } catch (error) {
    res.status(500).json({ message: "Error updating trip", error });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const managerId = req.user.id;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found!" });

    if (trip.managerId.toString() !== managerId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this trip!" });
    }

    if (trip.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Cannot delete a trip that has already started!" });
    }

    await Trip.findByIdAndDelete(tripId);
    res.status(200).json({ message: "Trip deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting trip", error });
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

    // ✅ Set vehicle status back to "Available"
    const vehicle = await Vehicle.findById(trip.vehicleId);
    if (vehicle) {
      vehicle.status = "Available";
      await vehicle.save();
    }

    await trip.save();
    return res.status(200).json({ message: "Trip ended successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error ending trip" });
  }
};

const getManagerTrips = async (req, res) => {
  try {
    const managerId = req.params.managerId;
    const trips = await Trip.find({ managerId })
      .populate("driverId", "name email")
      .populate("vehicleId", "make model licensePlateNumber");

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: "Error fetching trips", error });
  }
};

const getDriverTrips = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const trips = await Trip.find({
      driverId,
      status: { $ne: "completed" },
    })
      .populate("vehicleId", "make model licensePlateNumber")
      .populate("driverId", "name emailAddress");

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: "Error fetching driver trips", error });
  }
};

const getCompletedTrips = async (req, res) => {
  try {
    const userId = req.params.userId;

    const trips = await Trip.find({
      $or: [{ driverId: userId }, { managerId: userId }],
      status: "completed",
    })
      .populate("vehicleId", "make model licensePlateNumber")
      .populate("driverId", "name emailAddress");

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: "Error fetching completed trips", error });
  }
};

const getPendingTrips = async (req, res) => {
  try {
    const { managerId } = req.params;
    const trips = await Trip.find({ managerId, status: "pending" })
      .populate("driverId", "name emailAddress")
      .populate("vehicleId", "make model licensePlateNumber");

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending trips", error });
  }
};

const getTripsApproachingDeadline = async (req, res) => {
  try {
    const { managerId } = req.params;
    const now = new Date();
    const upcomingTrips = await Trip.find({
      managerId,
      status: "active",
      deadline: { $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) }, // ✅ Trips within 24 hours
    })
      .populate("driverId", "name emailAddress")
      .populate("vehicleId", "make model licensePlateNumber");

    res.status(200).json(upcomingTrips);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching approaching deadline trips", error });
  }
};

module.exports = {
  createTrip,
  startTrip,
  endTrip,
  updateTrip,
  deleteTrip,
  updateTripDetails,
  getPendingTrips,
  getTripsApproachingDeadline,
  getManagerTrips,
  getDriverTrips,
  getCompletedTrips,
};
