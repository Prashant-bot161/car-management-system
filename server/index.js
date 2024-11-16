// index.js
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");
const carRoutes = require("./routes/car");
const cors = require("cors");
dotenv.config();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors());

// Serve static files from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware to parse JSON
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected Successfully to MongoDB");
    app.listen(PORT, (err) => {
      if (err) console.log(err);
      console.log(`Server running at port ${PORT}`);
    });
  })
  .catch((error) => console.log("Failed to connect", error));

// Routes
app.use("/api/docs/users", userRoutes); // User routes (signup, login)
app.use("/api/docs/cars", carRoutes); // Car routes (add, update, delete, view)

// Define a simple route to test
app.get("/", (req, res) => {
  res.send("Hello, welcome");
});
