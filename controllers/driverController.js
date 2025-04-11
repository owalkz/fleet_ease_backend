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

    const availableDrivers = await Driver.find({
      isAssigned: false,
    }).select("-password");

    const filteredDrivers = availableDrivers.filter(
      (driver) => driver.managerId.toString() === req.user._id.toString()
    );

    res.status(200).json(filteredDrivers);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error fetching available drivers", error });
  }
};

// ✅ Fetch all drivers under a manager
const getDriversByManager = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });

    const { managerId } = req.params;
    const drivers = await Driver.find()
      .populate("assignedVehicle")
      .select("-password");

    const filteredDrivers = drivers.filter(
      (driver) => driver.managerId?.toString() === managerId
    );

    res.status(200).json(filteredDrivers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching drivers", error });
  }
};

// ✅ Fetch the assigned vehicle for a driver
const getDriverVehicle = async (req, res) => {
  try {
    const drv = await isDriver(req.user);
    if (!drv) return res.status(403).json({ message: "Unauthorized" });

    const { driverId } = req.params;
    const driver = await Driver.findById(driverId).populate("assignedVehicle");

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
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

    const drivers = await Driver.find({ managerId: null }).select("-password");
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
