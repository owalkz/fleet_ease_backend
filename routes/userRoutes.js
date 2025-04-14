const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getUserProfile,
  editUserProfile,
  deactivateDriverAccount,
  reactivateAccount,
} = require("../controllers/userController");

module.exports = (upload) => {
  const router = express.Router();
  router.get("/get-profile", protect, getUserProfile);
  router.post("/edit-profile", protect, upload.single("file"), editUserProfile);
  router.patch("/reactivate-account", protect, reactivateAccount);
  router.delete("/deactivate-account", protect, deactivateDriverAccount);

  return router;
};
