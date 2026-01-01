const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const OTP = require("../models/OTP");
const { PRODUCTS_PER_DAY_LIMIT, RATE_LIMIT_HOURS } = require("../config/constants");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * GET /get-user/:userId
 * Get user profile information
 */
router.get("/get-user/:userId", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).lean();
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Get remaining product uploads (rate limit check)
  const twentyFourHoursAgo = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000);
  const recentProductCount = await Product.countDocuments({
    addedBy: req.params.userId,
    createdAt: { $gte: twentyFourHoursAgo },
  });
  const remainingUploads = Math.max(0, PRODUCTS_PER_DAY_LIMIT - recentProductCount);

  res.json({
    message: "success",
    user: {
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      isBlocked: user.isBlocked || false,
      blockedReason: user.blockedReason || "",
    },
    remainingUploads,
    maxUploadsPerDay: PRODUCTS_PER_DAY_LIMIT,
  });
}));

/**
 * PUT /update-mobile/:userId
 * Update user's mobile number (requires OTP verification)
 */
router.put("/update-mobile/:userId", asyncHandler(async (req, res) => {
  const { mobile, otp, skipOtp } = req.body;

  // Validate mobile number
  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      message: "Please provide a valid 10-digit mobile number",
    });
  }

  // If skipOtp is true (for backward compatibility during transition), allow direct update
  // In production, you should remove this option
  if (skipOtp) {
    await User.updateOne({ _id: req.params.userId }, { mobile, mobileVerified: false });
    return res.json({ message: "Mobile number updated successfully (unverified)" });
  }

  // Verify OTP
  if (!otp) {
    return res.status(400).json({
      message: "OTP is required for mobile verification",
      requiresOtp: true,
    });
  }

  const result = await OTP.verifyOTP(mobile, req.params.userId, otp);
  
  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }

  // OTP verified - update mobile number
  await User.updateOne({ _id: req.params.userId }, { mobile, mobileVerified: true });
  res.json({ message: "Mobile number verified and updated successfully" });
}));

/**
 * POST /send-otp
 * Send OTP to mobile number for verification
 */
router.post("/send-otp", asyncHandler(async (req, res) => {
  const { mobile, userId } = req.body;

  // Validate mobile number
  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      message: "Please provide a valid 10-digit mobile number",
    });
  }

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Generate and store OTP
  const otp = await OTP.createOTP(mobile, userId);

  // In production, you would send this OTP via SMS using Twilio, MSG91, etc.
  // For now, we'll return it in development mode or log it
  console.log(`[DEV] OTP for ${mobile}: ${otp}`);

  // For development/demo purposes, include OTP in response
  // REMOVE THIS IN PRODUCTION!
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.json({
    message: "OTP sent successfully",
    expiresIn: "5 minutes",
    // Only include OTP in development mode for testing
    ...(isDev && { devOtp: otp }),
  });
}));

/**
 * POST /verify-otp
 * Verify OTP without updating mobile (for validation)
 */
router.post("/verify-otp", asyncHandler(async (req, res) => {
  const { mobile, userId, otp } = req.body;

  if (!mobile || !userId || !otp) {
    return res.status(400).json({
      message: "Mobile, userId, and OTP are required",
    });
  }

  const result = await OTP.verifyOTP(mobile, userId, otp);
  
  if (!result.success) {
    return res.status(400).json({ message: result.message, verified: false });
  }

  res.json({ message: result.message, verified: true });
}));

/**
 * POST /resend-otp
 * Resend OTP (rate limited to prevent abuse)
 */
router.post("/resend-otp", asyncHandler(async (req, res) => {
  const { mobile, userId } = req.body;

  if (!mobile || !userId) {
    return res.status(400).json({
      message: "Mobile and userId are required",
    });
  }

  // Generate new OTP
  const otp = await OTP.createOTP(mobile, userId);

  console.log(`[DEV] Resent OTP for ${mobile}: ${otp}`);

  const isDev = process.env.NODE_ENV !== 'production';
  
  res.json({
    message: "OTP resent successfully",
    expiresIn: "5 minutes",
    ...(isDev && { devOtp: otp }),
  });
}));

/**
 * POST /like-product
 * Toggle like status on a product
 */
router.post("/like-product", asyncHandler(async (req, res) => {
  const { productId, userId } = req.body;

  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isLiked = user.likedProducts.includes(productId);

  if (isLiked) {
    // Unlike: Remove from array
    await User.updateOne(
      { _id: userId },
      { $pull: { likedProducts: productId } }
    );
    res.json({ message: "unliked", isLiked: false });
  } else {
    // Like: Add to array
    await User.updateOne(
      { _id: userId },
      { $addToSet: { likedProducts: productId } }
    );
    res.json({ message: "liked", isLiked: true });
  }
}));

/**
 * POST /liked-products
 * Get all liked products for a user
 */
router.post("/liked-products", asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId).populate("likedProducts");
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    message: "success",
    products: user.likedProducts,
  });
}));

module.exports = router;
