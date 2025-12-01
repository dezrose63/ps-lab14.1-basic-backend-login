const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_SECRET || "super-secret-key";
const expiration = process.env.JWT_EXPIRES_IN || "2h";

function getAllUsers(req, res) {
  res.send("Sending all users...");
}

function getUserById(req, res) {
  res.send(`Data for user: ${req.params.id}`);
}

/**
 * Register New User
 */
async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body;

    // check if user exists
    const dbUser = await User.findOne({ email });

    if (dbUser) {
      return res.status(400).json({ message: "User already exist." });
    }

    // Create new user (password gets hashed by the pre-save hook)
    const user = await User.create({ username, email, password });
    console.log(user);

    // Don't send password back
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json(userObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during registration." });
  }
}

/**
 * Login User
 */
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const dbUser = await User.findOne({ email });

    if (!dbUser) {
      return res.status(400).json({ message: "Incorrect email or password." });
    }

    // Compare password
    const passwordMatched = await dbUser.isCorrectPassword(password);

    if (!passwordMatched) {
      return res.status(400).json({ message: "Incorrect email or password." });
    }

    // Create Payload (what you want inside the token)
    const payload = {
      _id: dbUser._id,
      username: dbUser.username,
      email: dbUser.email,
    };

    // Create Token
    const token = jwt.sign({ data: payload }, secret, { expiresIn: expiration });

    // Clean user object before sending
    const userObj = dbUser.toObject();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login." });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  registerUser,
  loginUser,
};