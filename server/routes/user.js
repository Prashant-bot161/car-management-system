const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const UserData = require("../models/user");

const router = express.Router();

// Helper function to hash password using crypto and salt
const hashPassword = (password, salt) => {
  const hash = crypto.createHash("sha256"); // Using SHA-256 for hashing
  hash.update(password + salt); // Concatenate password with salt before hashing
  return hash.digest("hex");
};

// View all users
router.get("/view-users", async (req, res) => {
  try {
    const users = await UserData.find();
    res.status(200).json(users);
  } catch (error) {
    console.log("error ", error);
  }
});

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, userName, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !userName || !email || !password || !phone) {
      return res.status(400).json({
        error: " Fields marked with * are required",
      });
    }

    // Check if user with this email or userName already exists
    const existingUser = await UserData.findOne({
      $or: [{ email }, { userName }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email or User Name already exists" });
    }

    // Generate a random salt
    const salt = crypto.randomBytes(16).toString("hex"); // 16-byte salt
    // Hash the password with the salt
    const hashedPassword = hashPassword(password, salt);

    // Create the new user
    const newUser = new UserData({
      name,
      userName,
      email,
      password: hashedPassword,
      salt: salt, // Store the salt in the database
      phone,
    });

    // Save the new user to the database
    await newUser.save();

    // Return success message
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log("error ", error);
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;

    // Validate input
    if (!userName || !password) {
      return res
        .status(400)
        .json({ error: "User Name and Password are required" });
    }

    // Find the user by userName
    const user = await UserData.findOne({ userName });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Hash the entered password with the stored salt
    const hashedPassword = hashPassword(password, user.salt);

    // Compare the entered password with the stored hashed password
    if (hashedPassword !== user.password) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Check if JWT_SECRET exists in environment variables
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res
        .status(500)
        .json({ error: "JWT_SECRET is not defined in environment variables" });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: "1h", // Set token expiration
    });

    // Send response with token
    res.status(200).json({
      message: "Login successful",
      token,
      userData: {
        id: user._id,
        userName: user.userName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error); // Log error for better debugging
  }
});

module.exports = router;
