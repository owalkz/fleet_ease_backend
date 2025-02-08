const Mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const localDB = process.env.ENVIRONMENT === 'development' ? process.env.LOCAL_MONGO_URL : process.env.MONGO_URL;

const connectDB = async () => {
  await Mongoose.connect(localDB, {});
  console.log("DB connected");
};
module.exports = connectDB;