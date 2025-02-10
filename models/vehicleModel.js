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
  image: {
    type: String,
  },
  serviceDates: {
    type: [Date],
    required: true,
  },
  insuranceExpiryDate: {
    type: Date,
    required: false,
  },
});

module.exports = Mongoose.model("Vehicle", VehicleSchema);
