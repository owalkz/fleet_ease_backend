const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getUserProfile,
  editUserProfile,
} = require("../controllers/userController");

module.exports = (upload) => {
  const router = express.Router();
  router.get("/get-profile", protect, getUserProfile);
  router.post("/edit-profile", protect, upload.single("file"), editUserProfile);

  return router;
};
