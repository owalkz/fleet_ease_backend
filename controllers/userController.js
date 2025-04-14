const Vehicle = require("../models/vehicleModel");
const Trip = require("../models/tripModel");
const Driver = require("../models/driverModel");
const Manager = require("../models/managerModel");
const {
  uploadFileToDropbox,
  replaceFileInDropbox,
} = require("../utils/functions/dropboxUpload");

const getUserProfile = (req, res, next) => {
  const user = req.user;
  const { password, ...userWithoutPassword } = user.toObject();
  return res.status(200).json({ user: userWithoutPassword });
};

const editUserProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, licenseExpiryDate } = req.body;
    const file = req.file;

    if (!file && !name && !licenseExpiryDate) {
      return res
        .status(400)
        .json({ error: "No file uploaded or no details modified." });
    }

    // 📦 If file and name (and/or licenseExpiryDate) are provided
    if (file) {
      if (!user.profilePhoto || user.profilePhoto.url === "") {
        // Upload the file to Dropbox
        const fileUrl = await uploadFileToDropbox(
          `ProfilePictures/${user.id}`,
          file.buffer,
          file.originalname,
          file.mimetype
        );

        user.profilePhoto.url = fileUrl.url || user.profilePhoto.url;
        user.profilePhoto.fileName =
          fileUrl.fileName || user.profilePhoto.fileName;
      } else {
        // Replace the file in Dropbox
        const fileUrl = await replaceFileInDropbox(
          `ProfilePictures/${user.id}`,
          user.profilePhoto.fileName,
          file.buffer,
          file.originalname
        );

        user.profilePhoto.url = fileUrl.url || user.profilePhoto.url;
        user.profilePhoto.fileName =
          fileUrl.fileName || user.profilePhoto.fileName;
      }
    }

    // ✏️ Update name if provided
    if (name) user.name = name;

    // 📆 Update licenseExpiryDate if provided and user is a driver
    if (licenseExpiryDate && user.accountType === "driver") {
      user.licenseExpiryDate = new Date(licenseExpiryDate);
    }

    await user.save();

    const newUrl = user.profilePhoto?.url || null;
    res.status(201).json({
      message: "Profile updated successfully!",
      newUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
};

const deactivateDriverAccount = async (req, res) => {
  try {
    const driverId = req.user._id;

    // 1. Ensure no pending or active trips
    const pendingTrips = await Trip.find({
      driverId,
      status: { $in: ["pending", "active"] },
    });

    if (pendingTrips.length > 0) {
      return res.status(400).json({
        message: "You have pending or active trips. Complete them first.",
      });
    }

    // 2. Unassign from any vehicle
    const vehicle = await Vehicle.findOne({ assignedDriverId: driverId });
    if (vehicle) {
      vehicle.assignedDriverId = null;
      await vehicle.save();
    }

    // 3. Remove driver from manager's company
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }

    driver.managerId = null;
    driver.isAssigned = false;
    driver.accountStatus = "inactive";
    await driver.save();

    res.status(200).json({ message: "Account deactivated successfully." });
  } catch (error) {
    console.error("Deactivation error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const reactivateAccount = async (req, res) => {
  try {
    const user = req.user;

    // Only allow drivers to reactivate themselves
    if (user.accountType !== "driver") {
      return res.status(403).json({ message: "Only drivers can reactivate their accounts" });
    }

    if (user.accountStatus === "active") {
      return res.status(400).json({ message: "Account is already active" });
    }

    user.accountStatus = "active";
    await user.save();

    res.status(200).json({ message: "Account reactivated successfully" });
  } catch (error) {
    console.error("Error reactivating account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getUserProfile,
  editUserProfile,
  deactivateDriverAccount,
  reactivateAccount,
};
