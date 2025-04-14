const bcrypt = require("bcryptjs");
const Mongoose = require("mongoose");

const DriverSchema = Mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    required: true,
  },
  accountStatus: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true,
  },
  isAssigned: {
    type: Boolean,
    required: true,
    default: false,
  },
  assignedVehicle: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    default: null,
  },
  managerId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "Manager",
    default: null,
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
    fileName: {
      type: String,
      required: false,
      default: "",
    },
    url: {
      type: String,
      required: false,
      default: "",
    },
  },
});

DriverSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = Mongoose.model("Driver", DriverSchema);
