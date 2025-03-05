const Mongoose = require("mongoose");

const tripSchema = Mongoose.Schema({
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
  status: { type: String, enum: ["active", "completed"], default: "active" },
});

const Trip = Mongoose.model("Trip", tripSchema);
module.exports = Trip;
