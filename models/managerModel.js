const bcrypt = require('bcryptjs');
const Mongoose = require("mongoose");

const ManagerSchema = Mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    required: true,
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePhoto: {
    type: String, 
    required: false,
  }
});

ManagerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = Mongoose.model("Manager", ManagerSchema);