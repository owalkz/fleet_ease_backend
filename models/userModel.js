const bcrypt = require('bcryptjs');
const Mongoose = require("mongoose");

const UserSchema = Mongoose.Schema({
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
  licenseExpiryDate: {
    type: Date,
    required: false,
  },
  profilePhoto: {
    type: String, 
    required: false,
  }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = Mongoose.model("User", UserSchema);