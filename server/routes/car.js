// routes/car.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const CarData = require("../models/car");
const { stopWords } = require("../utils/common");

const router = express.Router();

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Directory to store uploaded images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to filenames
  },
});

const upload = multer({ storage: storage });

// Add car
router.post("/add-car", upload.array("images", 10), async (req, res) => {
  try {
    // Extract non-file data from the request body
    const { title, description, tags, userName, phone } = req.body;

    // Map image file paths if there are any uploaded images
    const images = req.files ? req.files.map((file) => file.path) : [];

    // Create a new CarData entry
    const newCar = new CarData({
      title,
      description,
      images,
      tags,
      userName,
      phone,
    });

    // Save the car entry to the database
    await newCar.save();

    res.status(201).json({ message: "Car added successfully", car: newCar });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// View all cars
router.get("/view-cars", async (req, res) => {
  try {
    const cars = await CarData.find();
    res.status(200).json(cars);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching cars", error: error.message });
  }
});

// Searching as per form fields
router.post("/view-cars-search", async (req, res) => {
  const {
    carType,
    title,
    company,
    model,
    color,
    fuelType,
    userName,
    phone,
    year,
    _id,
  } = req.body; // use req.query for GET requests
  const query = {};

  if (carType && carType.trim() !== "") query["tags.carType"] = carType;
  if (year && year.trim() !== "") query["tags.year"] = year;
  if (company && company.trim() !== "") query["tags.company"] = company;
  if (model && model.trim() !== "") query["tags.model"] = model;
  if (color && color.trim() !== "") query["tags.color"] = color;
  if (fuelType && fuelType.trim() !== "") query["tags.fuelType"] = fuelType;
  if (userName && userName.trim() !== "") query.userName = userName;
  if (title && title.trim() !== "") query.title = title;
  if (phone && phone.trim() !== "") query.phone = phone;
  if (_id && _id.trim() !== "") query._id = _id;

  try {
    const cars = await CarData.find(query);
    res.status(200).json(cars);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching cars", error: error.message });
  }
});

// Define your route to handle the search
router.post("/global-search-cars", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(200).json(await CarData.find());
  }

  const keywords = query
    ?.trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter((word) => !stopWords.includes(word.toLowerCase()))
    .map((word) => new RegExp(word.toString(), "i")); // Convert to string

  if (keywords.length === 0) {
    return res.status(200).json(await CarData.find());
  }

  try {
    const searchConditions = [
      { userName: { $in: keywords } },
      { title: { $in: keywords } },
      { description: { $in: keywords } },
      { "tags.carType": { $in: keywords } },
      { "tags.company": { $in: keywords } },
      { "tags.model": { $in: keywords } },
      { "tags.color": { $in: keywords } },
      { "tags.fuelType": { $in: keywords } },
      { "tags.year": { $in: keywords } },
    ];

    const filteredCars = await CarData.find({ $or: searchConditions });

    res.status(200).json(filteredCars);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching cars", error: error.message });
  }
});

// This route is for searching cars which contain exactly all keywords
// router.post("/global-search-cars", async (req, res) => {
//   const { query } = req.body; // Get search query from the body

//   if (!query) {
//     // If no query is provided, return all cars
//     return res.status(200).json(await CarData.find());
//   }

//   // Split the query into individual keywords for matching
//   const keywords = query.split(" ").map((word) => new RegExp(word, "i"));

//   try {
//     // Create a search condition for each keyword
//     const searchConditions = keywords.map((word) => ({
//       $or: [
//         { userName: word },
//         { title: word },
//         { description: word },
//         { "tags.carType": word },
//         { "tags.company": word },
//         { "tags.model": word },
//         { "tags.color": word },
//         { "tags.fuelType": word },
//       ],
//     }));

//     // Execute the query with `$and` to ensure each keyword is matched
//     const filteredCars = await CarData.find({ $and: searchConditions });

//     res.status(200).json(filteredCars);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error searching cars", error: error.message });
//   }
// });

// View a particular car by sending Id in API endpoints
router.get("/view-car/:id", async (req, res) => {
  try {
    const car = await CarData.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    res.status(200).json(car);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching car", error: error.message });
  }
});

// Update a car's details
router.put("/update-car/:id", upload.array("images", 10), async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    // Extracting tags properties from the destructured object
    const { carType, company, model, color, fuelType, year } = tags;

    // Handling images from the multipart/form-data
    const newImages = req.files ? req.files.map((file) => file.path) : [];
    const existingCar = await CarData.findById(req.params.id);

    const updatedImages = [...new Set([...existingCar.images, ...newImages])];

    // Update the car data with the new fields
    const updatedCar = await CarData.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        tags: {
          carType,
          company,
          model,
          color,
          fuelType,
          year,
        },
        images: updatedImages, // Images from the upload
      },
      { new: true }
    );

    // If the car isn't found, return a 404 error
    if (!updatedCar) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Respond with a success message and the updated car data
    res
      .status(200)
      .json({ message: "Car updated successfully", car: updatedCar });
  } catch (error) {
    // Handle any errors
    res.status(400).json({ error: error.message });
  }
});

// Delete a car
router.delete("/delete-car/:id", async (req, res) => {
  try {
    const deletedCar = await CarData.findByIdAndDelete(req.params.id);
    if (!deletedCar) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.status(200).json({ message: "Car deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting car", error: error.message });
  }
});

module.exports = router;
