const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getUserProfile,
  editUserProfile,
} = require("../controllers/userController");

router.get("/get-profile", protect, getUserProfile);
router.post("/edit-profile", protect, editUserProfile);
module.exports = router;
