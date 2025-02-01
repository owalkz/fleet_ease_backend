const bcrypt = require("bcryptjs");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

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
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name,
      accountType: accountType,
      emailAddress: emailAddress,
      password: hashedPassword,
    });
    const templateString = fs.readFileSync(
      "./utils/mailingAssets/hello.html",
      "utf8"
    );
    const emailContent = templateString
      .replace("${name}", name)
      .replace("${loginLink}", `${process.env.CLIENT_URL}/login`);
    const emailSent = await sendEmail(
      emailAddress,
      "Welcome to FleetEase",
      emailContent
    );
    if (!emailSent) {
      return res.status(400).json({ message: "Invalid email" });
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
      return res.status(422).json({message: "Invalid credentials entered"});
    }
    if (user.matchPassword(password)) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res.status(200).json({
        message: "Login successful!",
        token: token,
      });
    }
  } catch (err) {
    return res.status(500).json({message: "Failed to login."});
  }

};

const forgotPassword = (req, res, next) => {};

const resetPassword = (req, res, next) => {};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
