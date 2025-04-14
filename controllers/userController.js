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

module.exports = {
  getUserProfile,
  editUserProfile,
};
