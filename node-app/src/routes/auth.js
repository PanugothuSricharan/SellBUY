const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const {
  JWT_SECRET,
  JWT_EXPIRY_DEFAULT,
  JWT_EXPIRY_GOOGLE,
  GOOGLE_CLIENT_ID,
  isValidCollegeEmail,
  ALLOWED_EMAIL_DOMAIN,
} = require("../config/constants");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * POST /signup
 * Register a new user
 */
router.post("/signup", asyncHandler(async (req, res) => {
  const { username, password, email, mobile } = req.body;

  // Validate required fields
  if (!username || !password || !email) {
    return res.status(400).json({ 
      message: "Username, password, and email are required" 
    });
  }

  // Validate college email
  if (!isValidCollegeEmail(email)) {
    return res.status(400).json({
      message: `Only IIITM Gwalior college emails (${ALLOWED_EMAIL_DOMAIN}) are allowed`,
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existingUser) {
    return res.status(400).json({ message: "Email already registered" });
  }

  // Create new user
  const user = new User({
    username,
    password, // In production, hash this with bcrypt
    email: email.toLowerCase(),
    mobile,
  });

  await user.save();
  res.json({ message: "saved success." });
}));

/**
 * POST /login
 * Authenticate user with username and password
 */
router.post("/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Check for empty fields
  if (!username || !password) {
    return res.json({ message: "Username and password are required" });
  }

  const user = await User.findOne({ username });
  
  if (!user) {
    return res.json({ message: "User not found" });
  }

  // In production, use bcrypt.compare
  if (user.password === password) {
    const token = jwt.sign(
      { data: user },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY_DEFAULT }
    );
    
    return res.json({
      message: "User Logged In",
      token,
      success: true,
      userId: user._id,
    });
  } else {
    return res.json({ message: "Invalid password" });
  }
}));

/**
 * POST /google-login
 * Authenticate user with Google OAuth
 */
router.post("/google-login", asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "No credential provided" });
  }

  // Verify the Google token
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, sub: googleId } = payload;

  // Validate institute email
  if (!isValidCollegeEmail(email)) {
    return res.status(403).json({
      message: `Only IIITM Gwalior college emails (${ALLOWED_EMAIL_DOMAIN}) are allowed`,
      success: false,
    });
  }

  // Check if user already exists with this email
  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Create new user with Google data
    user = new User({
      username: name || email.split("@")[0],
      email: email.toLowerCase(),
      password: `google_${googleId}`, // Placeholder
      mobile: "",
      googleId,
    });
    await user.save();
  }

  // Generate JWT token
  const token = jwt.sign(
    { data: user },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY_GOOGLE }
  );

  return res.json({
    message: "Google login successful",
    success: true,
    token,
    userId: user._id,
  });
}));

module.exports = router;
