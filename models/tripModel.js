const Mongoose = require("mongoose");

const tripSchema = Mongoose.Schema({
  managerId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "Manager",
    required: true,
  },
  driverId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  vehicleId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  startLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  endLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  destination: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
  },
  deadline: { type: Date, required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  distanceTraveled: { type: Number, default: 0 },
  speedLogs: [
    {
      timestamp: { type: Date, default: Date.now },
      speed: { type: Number, required: true },
      latitude: { type: Number },
      longitude: { type: Number },
      eventType: { type: String, default: "" },
    },
  ],
  status: {
    type: String,
    enum: ["pending", "active", "completed"],
    default: "pending",
  },
});

const Trip = Mongoose.model("Trip", tripSchema);
module.exports = Trip;
