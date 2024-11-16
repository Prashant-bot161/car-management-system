const mongoose = require("mongoose");

// Create Schema for Car
const carDataSchema = new mongoose.Schema(
  {
    // by default sigin userNAme will go
    userName: {
      type: String,
      // required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      validate: [arrayLimit, "{PATH} exceeds the limit of 10"],
    },
    tags: {
      carType: {
        type: String,
        required: true,
      },
      company: {
        type: String,
        required: true,
      },
      model: {
        type: String,
        required: true,
      },
      color: {
        type: String,
        required: true,
      },
      fuelType: {
        type: String,
        required: true,
      },
      year: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

function arrayLimit(val) {
  return val.length <= 10;
}

// Create Model
const CarData = mongoose.model("CarData", carDataSchema);

module.exports = CarData;
