const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { checkIdExists } = require("../utils/functions/authFunctions");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in both cookies and Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(403)
      .json({ message: "Access denied, no token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await checkIdExists(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token expired." });
    } else if (err.name === "JsonWebTokenError") {
      res.status(401).json({ message: "Invalid token." });
    } else {
      console.log(err);
      res.status(401).json({ message: "Authentication failed." });
    }
  }
});

module.exports = protect;