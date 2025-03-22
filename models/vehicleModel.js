const Mongoose = require("mongoose");

const VehicleSchema = new Mongoose.Schema({
  managerId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "Manager",
    required: true,
  },
  make: { type: String, required: true },
  model: { type: String, required: true },
  licensePlateNumber: { type: String, required: true, unique: true },
  VIN: { type: String, unique: true }, // ✅ Added VIN for better tracking
  fuelType: {
    type: String,
    enum: ["Petrol", "Diesel", "Electric", "Hybrid"],
  }, // ✅ Added Fuel Type
  fuelConsumptionRate: { type: Number }, // ✅ Fuel usage (liters/km)
  mileage: { type: Number, required: true },
  lastServiceDate: { type: Date }, // ✅ Track the last service
  nextServiceMileage: { type: Number }, // ✅ Next service milestone
  inspectionStatus: { type: Boolean, required: true },
  assignedDriverId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    default: null,
  }, // ✅ Driver assigned to this vehicle
  image: {
    name: { type: String },
    url: { type: String },
  },
  serviceDates: { type: [Date], required: true },
  insuranceExpiryDate: { type: Date },
  status: {
    type: String,
    enum: ["Available", "In Use", "Under Maintenance"],
    default: "Available",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = Mongoose.model("Vehicle", VehicleSchema);
