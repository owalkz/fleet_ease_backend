const Mongoose = require("mongoose");

const VehicleSchema = Mongoose.Schema({
  make: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  licensePlateNumber: {
    type: String,
    required: true,
  },
  mileage: {
    type: Number,
    required: true,
  },
  inspectionStatus: {
    type: Boolean,
    required: true,
  },
  latestServiceDate: {
    type: Date,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  serviceDates: {
    type: [Date],
    required: true,
  },
  licenseExpiryDate: {
    type: Date,
    required: false,
  },
  profilePhoto: {
    type: String, 
    required: false,
  }
});

module.exports = Mongoose.model("Vehicle", VehicleSchema);