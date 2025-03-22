const Vehicle = require("../models/vehicleModel");
const Driver = require("../models/driverModel");
const Manager = require("../models/managerModel");
const {
  uploadFileToDropbox,
  replaceFileInDropbox,
  deleteFileFromDropbox,
} = require("../utils/functions/dropboxUpload");

// ✅ Create a new vehicle with image upload to Dropbox
const createVehicle = async (req, res) => {
  try {
    const {
      make,
      model,
      licensePlateNumber,
      VIN,
      fuelType,
      fuelConsumptionRate,
      mileage,
      inspectionStatus,
      assignedDriverId,
      serviceDates,
      insuranceExpiryDate,
      status,
    } = req.body;

    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });
    const managerId = req.user._id;

    // Check if license plate already exists
    const existingVehicle = await Vehicle.findOne({ licensePlateNumber });
    if (existingVehicle) {
      return res
        .status(400)
        .json({ message: "Vehicle with this plate number already exists!" });
    }

    let image = null;

    // Handle Dropbox image upload
    if (req.file) {
      const fileUrl = await uploadFileToDropbox(
        `VehicleImages/${licensePlateNumber}`,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      image = { name: fileUrl.fileName, url: fileUrl.url };
    }

    const vehicle = new Vehicle({
      managerId,
      make,
      model,
      licensePlateNumber,
      VIN,
      fuelType,
      fuelConsumptionRate,
      mileage,
      inspectionStatus,
      assignedDriverId,
      image,
      serviceDates,
      insuranceExpiryDate,
      status,
    });

    await vehicle.save();
    res.status(201).json({ message: "Vehicle added successfully!", vehicle });
  } catch (error) {
    res.status(500).json({ message: "Error adding vehicle", error });
  }
};

// ✅ Update vehicle details, including Dropbox image replacement
const updateVehicle = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });
    const { serviceDates, ...updateData } = req.body;
    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found!" });

    // Merge existing service dates if provided
    if (serviceDates) {
      updateData.serviceDates = [
        ...new Set([...vehicle.serviceDates, ...serviceDates]),
      ];
    }

    // Handle Dropbox image update
    if (req.file) {
      if (!vehicle.image || vehicle.image.url === "") {
        // Upload a new image
        const fileUrl = await uploadFileToDropbox(
          `VehicleImages/${vehicle.licensePlateNumber}`,
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        updateData.image = { name: fileUrl.fileName, url: fileUrl.url };
      } else {
        // Replace existing image
        const fileUrl = await replaceFileInDropbox(
          `VehicleImages/${vehicle.licensePlateNumber}`,
          vehicle.image.name,
          req.file.buffer,
          req.file.originalname
        );
        updateData.image = { name: fileUrl.fileName, url: fileUrl.url };
      }
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ message: "Vehicle updated successfully!", vehicle });
  } catch (error) {
    res.status(500).json({ message: "Error updating vehicle", error });
  }
};

// ✅ Delete a vehicle and remove the associated Dropbox image
const deleteVehicle = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found!" });

    // Delete associated image from Dropbox
    if (vehicle.image && vehicle.image.name) {
      await deleteFileFromDropbox(
        `/VehicleImages/${vehicle.licensePlateNumber}/${vehicle.image.name}`
      );
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Vehicle deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting vehicle", error });
  }
};

// ✅ Get all vehicles for a fleet manager
const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      managerId: req.params.managerId,
    }).populate("assignedDriverId");
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching vehicles", error });
  }
};

// ✅ Get a single vehicle by ID
const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "assignedDriverId"
    );
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found!" });

    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: "Error fetching vehicle", error });
  }
};

const assignDriverToVehicle = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });
    const { vehicleId, driverId } = req.body;

    // Validate inputs
    if (!vehicleId || !driverId) {
      return res
        .status(400)
        .json({ message: "Vehicle ID and Driver ID are required." });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found!" });

    // Check if driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found!" });

    // Reassign vehicle if it was previously assigned
    if (vehicle.assignedDriverId) {
      const previousDriver = await Driver.findById(vehicle.assignedDriverId);
      if (previousDriver) {
        previousDriver.isAssigned = false;
        await previousDriver.save();
      }
    }

    // Assign new driver
    vehicle.assignedDriverId = driverId;
    driver.isAssigned = true;

    await vehicle.save();
    await driver.save();

    res.status(200).json({ message: "Driver assigned successfully!", vehicle });
  } catch (error) {
    res.status(500).json({ message: "Error assigning driver", error });
  }
};

// ✅ Unassign a driver from a vehicle
const unassignDriverFromVehicle = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });
    const { vehicleId } = req.body;

    // Validate input
    if (!vehicleId) {
      return res.status(400).json({ message: "Vehicle ID is required." });
    }

    // Find vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found!" });

    // Find and update the driver if assigned
    if (vehicle.assignedDriverId) {
      const driver = await Driver.findById(vehicle.assignedDriverId);
      if (driver) {
        driver.isAssigned = false;
        await driver.save();
      }
    }

    // Remove assignment
    vehicle.assignedDriverId = null;
    await vehicle.save();

    res
      .status(200)
      .json({ message: "Driver unassigned successfully!", vehicle });
  } catch (error) {
    res.status(500).json({ message: "Error unassigning driver", error });
  }
};

const isManager = async (user) => {
  if (await Manager.findById(user._id)) {
    return true;
  } else {
    return false;
  }
};

module.exports = {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAllVehicles,
  getVehicle,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
};
