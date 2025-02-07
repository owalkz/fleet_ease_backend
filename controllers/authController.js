const bcrypt = require("bcryptjs");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/userModel");

const register = async (req, res, next) => {
  const { name, accountType, emailAddress, password } = req.body;
  if (!name || !accountType || !emailAddress || !password) {
    return res
      .status(400)
      .json({ message: "Kindly fill in all the necessary details." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long." });
  }
  try {
    const emailExists = await User.findOne({ emailAddress });
    if (emailExists) {
      return res.status(400).json({ message: "EmailAddress already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name,
      accountType: accountType,
      emailAddress: emailAddress,
      password: hashedPassword,
    });
    const filePath = path.join(__dirname, "../utils/mailingAssets/hello.html");
    const templateString = fs.readFileSync(filePath, "utf8");
    const emailContent = templateString
      .replace("${name}", name)
      .replace("${loginLink}", `${process.env.CLIENT_URL}/login`);
    const emailSent = await sendEmail(
      emailAddress,
      "Welcome to FleetEase",
      emailContent
    );
    if (!emailSent) {
      return res.status(400).json({ message: "Invalid emailAddress" });
    }
    if (!user) {
      return res
        .status(400)
        .json({ message: "Could not create user with the given data." });
    }
    return res.status(201).json({ message: "User created successfully!" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};

const login = async (req, res, next) => {
  const { emailAddress, password } = req.body;
  if (!emailAddress || !password) {
    return res.status(422).json({ message: "Invalid credentials entered" });
  }
  try {
    const user = await User.findOne({ emailAddress });
    if (!user) {
      return res.status(422).json({ message: "Invalid credentials entered" });
    }
    const isMatch = await user.matchPassword(password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      const { password: _, ...userWithoutPassword } = user.toObject();
      return res.status(200).json({
        message: "Login successful!",
        token: token,
        user: userWithoutPassword,
      });
    } else {
      return res.status(422).json({ message: "Invalid credentials entered" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Failed to login." });
  }
};

const forgotPassword = async (req, res, next) => {
  const { emailAddress } = req.body;
  if (!emailAddress) {
    return res.status(400).json({ message: "All fields are required!" });
  }
  const user = await User.findOne({ emailAddress });
  if (!user) {
    return res.status(404).json({ message: "User not found!" });
  }
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  console.log(resetToken);
  const resetURL = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;
  const filePath = path.join(
    __dirname,
    "../utils/mailingAssets/resetPassword.html"
  );
  const templateString = fs.readFileSync(filePath, "utf8");
  const emailContent = templateString
    .replace("${name}", user.first_name)
    .replace("${resetLink}", resetURL);
  const emailSent = await sendEmail(
    emailAddress,
    "Password Reset Request",
    emailContent
  );
  if (!emailSent) {
    return res.status(400).json({ message: "Invalid email" });
  }
  return res
    .status(200)
    .json({ message: "Password reset email sent successfully" });
};

const resetPassword = async (req, res, next) => {
  const resetToken = req.params.id;
  const { password } = req.body;
  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    try {
      await user.save();
    } catch (saveError) {
      console.error("Error saving user:", saveError);
    }
    res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
