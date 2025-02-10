const Vehicle = require("../models/vehicleModel");

const createVehicle = async (req, res, next) => {
  try {
    const {
      make,
      model,
      licensePlateNumber,
      mileage,
      inspectionStatus,
      serviceDate,
      insuranceExpiryDate,
    } = req.body;
    if (
      !make ||
      !model ||
      !licensePlateNumber ||
      !mileage ||
      !inspectionStatus ||
      !serviceDate ||
      !insuranceExpiryDate
    ) {
      return res.status(422).json({ message: "All fields are required!" });
    }
    const newVehicle = await Vehicle.create({
      make,
      model,
      licensePlateNumber,
      mileage,
      inspectionStatus,
      serviceDate,
      insuranceExpiryDate,
    });
    if (!newVehicle)
      return res.status(400).json({
        message: "Failed to create vehicle with the details provided.",
      });
    return res.status(201).json({ message: "Vehicle Created Successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating vehicle.", error });
  }
};

module.exports = {
  createVehicle,
};
