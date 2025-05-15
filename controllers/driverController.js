const Driver = require("../models/driverModel");
const { isDriver, isManager } = require("../utils/functions/authFunctions");

const addDriverToCompany = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });

    const { driverId } = req.body;
    const managerId = req.user.id;

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    if (driver.managerId) {
      return res
        .status(400)
        .json({ message: "Driver is already assigned to a manager" });
    }

    driver.managerId = managerId;
    await driver.save();
    res.status(200).json({ message: "Driver successfully added to company" });
  } catch (error) {
    res.status(500).json({ message: "Error adding driver to company", error });
  }
};

const removeDriverFromCompany = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });

    const { driverId } = req.body;
    const managerId = req.user.id;

    const driver = await Driver.findById(driverId);
    if (!driver || driver.managerId.toString() !== managerId) {
      return res
        .status(404)
        .json({ message: "Driver not found or not in your company" });
    }

    driver.managerId = null;
    await driver.save();
    res.status(200).json({ message: "Driver removed from company" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing driver from company", error });
  }
};

const getAvailableDrivers = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });

    const today = new Date();

    const availableDrivers = await Driver.find({
      isAssigned: false,
      accountStatus: { $ne: "inactive" },
      licenseExpiryDate: { $gt: today }, // ✅ only licenses that are still valid
      managerId: req.user._id, // ✅ include manager filter in DB query
    }).select("-password");

    res.status(200).json(availableDrivers);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching available drivers", error });
  }
};

const getDriversByManager = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });

    const { managerId } = req.params;
    const today = new Date();

    const drivers = await Driver.find({
      managerId,
      accountStatus: { $ne: "inactive" },
      licenseExpiryDate: { $gt: today }, // ✅ only valid licenses
    })
      .populate("assignedVehicle")
      .select("-password");

    res.status(200).json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching drivers", error });
  }
};

// ✅ Fetch the assigned vehicle for a driver
const getDriverVehicle = async (req, res) => {
  try {
    const drv = await isDriver(req.user);
    if (!drv) return res.status(403).json({ message: "Unauthorized" });

    const { driverId } = req.params;
    const driver = await Driver.findOne({
      _id: driverId,
      accountStatus: { $ne: "inactive" }, // 🔒 safeguard
    }).populate("assignedVehicle");

    if (!driver) {
      return res.status(404).json({ message: "Driver not found or inactive" });
    }

    if (!driver.assignedVehicle) {
      return res.status(200).json({ message: "No vehicle assigned" });
    }

    res.status(200).json(driver.assignedVehicle);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned vehicle", error });
  }
};

const getUnassignedDrivers = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });

    const drivers = await Driver.find({
      managerId: null,
      accountStatus: { $ne: "inactive" }, // 🔒 exclude inactive
    }).select("-password");

    res.status(200).json(drivers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching unassigned drivers", error });
  }
};

module.exports = {
  addDriverToCompany,
  removeDriverFromCompany,
  getAvailableDrivers,
  getDriverVehicle,
  getDriversByManager,
  getUnassignedDrivers,
};
