const Driver = require("../../models/driverModel");
const Manager = require("../../models/managerModel");

const checkEmailExists = async (emailAddress) => {
  const driver = await Driver.findOne({ emailAddress });
  const manager = await Manager.findOne({ emailAddress });
  return driver || manager;
};

const isManager = async (id) => {
  if (await Manager.findById(id)) {
    return true;
  } else {
    return false;
  }
};

const isDriver = async (id) => {
  if (await Driver.findById(id)) {
    return true;
  } else {
    return false;
  }
};

const checkIdExists = async (id) => {
  const driver = await Driver.findById(id);
  const manager = await Manager.findById(id);
  return driver || manager;
};

const createUser = async (Model, role, email, name, hashedPassword, res) => {
  const userExists = await checkEmailExists(email);
  if (userExists)
    return res.status(400).json({ message: "Email already exists" });
  const user = await Model.create({
    name: name,
    accountType: role,
    emailAddress: email,
    password: hashedPassword,
  });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Could not create user with the given data." });
  }
  return user;
};

module.exports = {
  isDriver,
  isManager,
  createUser,
  checkEmailExists,
  checkIdExists,
};
