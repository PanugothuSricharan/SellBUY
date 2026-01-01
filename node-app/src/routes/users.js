const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
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
 * Update user's mobile number
 */
router.put("/update-mobile/:userId", asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  // Validate mobile number
  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      message: "Please provide a valid 10-digit mobile number",
    });
  }

  await User.updateOne({ _id: req.params.userId }, { mobile });
  res.json({ message: "Mobile number updated successfully" });
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
