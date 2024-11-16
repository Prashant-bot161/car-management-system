const mongoose = require("mongoose");

// Create Schema
const userDataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    salt: {
      type: String, // Store the salt used for hashing
    },
  },
  { timestamps: true }
);

// Create Model
const UserData = mongoose.model("Users", userDataSchema);

module.exports = UserData;
