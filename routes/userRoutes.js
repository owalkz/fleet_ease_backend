const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getUserProfile,
  editUserProfile,
  getAvailableDrivers
} = require("../controllers/userController");

module.exports = (upload) => {
  const router = express.Router();
  router.get("/get-profile", protect, getUserProfile);
  router.get("/get-drivers", protect, getAvailableDrivers);
  router.post("/edit-profile", protect, upload.single("file"), editUserProfile);

  return router;
};
