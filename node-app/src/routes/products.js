const express = require("express");
const Product = require("../models/Product");
const {
  ENTIRE_CAMPUS,
  VALID_CONDITIONS,
  VALID_STATUS,
  VALID_CONTACT_PREFERENCES,
  PRODUCTS_PER_DAY_LIMIT,
  RATE_LIMIT_HOURS,
  isValidLocation,
  isValidCondition,
  isValidStatus,
} = require("../config/constants");
const { getBlockedUserIds } = require("../services/cache");
const { uploadProductImages } = require("../middleware/upload");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * GET /get-products
 * Get all products for public listing
 */
router.get("/get-products", asyncHandler(async (req, res) => {
  const { catName, location, limit = 50, skip = 0 } = req.query;
  const filter = {};

  // Category filter
  if (catName) {
    filter.category = catName;
  }

  // Location filter (server-side enforced)
  if (location && location !== ENTIRE_CAMPUS && isValidLocation(location)) {
    filter.location = location;
  }

  // Get cached blocked user IDs
  const blockedUserIds = await getBlockedUserIds();

  // Use the static method for optimized query
  const products = await Product.getPublicProducts(filter, {
    skip: parseInt(skip),
    limit: parseInt(limit),
    blockedUserIds,
  });

  // Cache for 30 seconds
  res.set("Cache-Control", "public, max-age=30");
  res.json({ message: "success", products });
}));

/**
 * GET /get-product/:productId
 * Get a single product by ID
 */
router.get("/get-product/:productId", asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).lean();
  
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ message: "success", product });
}));

/**
 * GET /search
 * Search products by name, category, or description
 */
router.get("/search", asyncHandler(async (req, res) => {
  const { search, location } = req.query;

  const query = {
    $or: [
      { pname: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { pdesc: { $regex: search, $options: "i" } },
    ],
    approvalStatus: "APPROVED",
    status: "Available",
  };

  // Apply location filter
  if (location && location !== ENTIRE_CAMPUS && isValidLocation(location)) {
    query.location = location;
  }

  // Exclude blocked users
  const blockedUserIds = await getBlockedUserIds();
  if (blockedUserIds.length > 0) {
    query.addedBy = { $nin: blockedUserIds };
  }

  const products = await Product.find(query)
    .select("pname price pimage category location condition productAge pdesc isNegotiable status createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ message: "success", products });
}));

/**
 * GET /filter-products
 * Advanced product filtering
 */
router.get("/filter-products", asyncHandler(async (req, res) => {
  const { location, category, condition, minPrice, maxPrice, search, status } = req.query;
  const filter = {};

  // Status filter (default to Available)
  filter.status = status || "Available";

  // Location filter
  if (location && location !== ENTIRE_CAMPUS && isValidLocation(location)) {
    filter.location = location;
  }

  // Category filter (supports multiple)
  if (category) {
    const categories = category.split(",");
    filter.category = categories.length > 1 ? { $in: categories } : category;
  }

  // Condition filter (supports multiple)
  if (condition) {
    const conditions = condition.split(",");
    filter.condition = conditions.length > 1 ? { $in: conditions } : condition;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.$expr = { $and: [] };
    if (minPrice) {
      filter.$expr.$and.push({
        $gte: [{ $toDouble: "$price" }, parseFloat(minPrice)],
      });
    }
    if (maxPrice) {
      filter.$expr.$and.push({
        $lte: [{ $toDouble: "$price" }, parseFloat(maxPrice)],
      });
    }
  }

  // Search filter
  if (search) {
    filter.$or = [
      { pname: { $regex: search, $options: "i" } },
      { pdesc: { $regex: search, $options: "i" } },
    ];
  }

  // Only approved products
  filter.approvalStatus = "APPROVED";

  const products = await Product.find(filter)
    .select("pname price pimage category location condition productAge pdesc isNegotiable status createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ message: "success", products });
}));

/**
 * GET /my-products/:userId
 * Get products added by a specific user
 */
router.get("/my-products/:userId", asyncHandler(async (req, res) => {
  const products = await Product.find({ addedBy: req.params.userId })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ message: "success", products });
}));

/**
 * POST /add-product
 * Add a new product
 */
router.post("/add-product", uploadProductImages, asyncHandler(async (req, res) => {
  const {
    pname,
    pdesc,
    price,
    isNegotiable,
    category,
    location,
    condition = "Used",
    productAge = "",
    originalUrl = "",
    contactPreference = "Both",
    userId,
  } = req.body;

  const pimage = req.files?.pimage?.[0]?.path;
  const pimage2 = req.files?.pimage2?.[0]?.path || null;

  // Rate limit check
  const twentyFourHoursAgo = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000);
  const recentProductCount = await Product.countDocuments({
    addedBy: userId,
    createdAt: { $gte: twentyFourHoursAgo },
  });

  if (recentProductCount >= PRODUCTS_PER_DAY_LIMIT) {
    return res.status(429).json({
      message: `You can only add ${PRODUCTS_PER_DAY_LIMIT} products per ${RATE_LIMIT_HOURS} hours. Please try again later.`,
      limitReached: true,
    });
  }

  // Validation
  if (!location || !isValidLocation(location)) {
    return res.status(400).json({
      message: "Location is required and must be a valid hostel location.",
    });
  }

  if (condition && !VALID_CONDITIONS.includes(condition)) {
    return res.status(400).json({
      message: `Invalid condition. Must be one of: ${VALID_CONDITIONS.join(", ")}`,
    });
  }

  if (contactPreference && !VALID_CONTACT_PREFERENCES.includes(contactPreference)) {
    return res.status(400).json({
      message: `Invalid contact preference. Must be one of: ${VALID_CONTACT_PREFERENCES.join(", ")}`,
    });
  }

  if (!pname || !pdesc || !price || !category) {
    return res.status(400).json({
      message: "Product name, description, price, and category are required.",
    });
  }

  if (!pimage) {
    return res.status(400).json({
      message: "At least one product image is required.",
    });
  }

  const product = new Product({
    pname,
    pdesc,
    price,
    isNegotiable: isNegotiable === "true" || isNegotiable === true,
    category,
    location,
    condition,
    productAge,
    originalUrl,
    contactPreference,
    pimage,
    pimage2,
    addedBy: userId,
  });

  const savedProduct = await product.save();
  res.json({
    message: "Product added successfully!",
    productId: savedProduct._id,
  });
}));

/**
 * PUT /update-product/:productId
 * Update an existing product
 */
router.put("/update-product/:productId", uploadProductImages, asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { userId } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Check ownership
  if (product.addedBy.toString() !== userId) {
    return res.status(403).json({ message: "You can only update your own products" });
  }

  // Build update object
  const updateData = {
    pname: req.body.pname || product.pname,
    pdesc: req.body.pdesc || product.pdesc,
    price: req.body.price || product.price,
    isNegotiable: req.body.isNegotiable === "true" || req.body.isNegotiable === true,
    category: req.body.category || product.category,
    location: req.body.location || product.location,
    condition: req.body.condition || product.condition,
    productAge: req.body.productAge || product.productAge,
    originalUrl: req.body.originalUrl || product.originalUrl,
    contactPreference: req.body.contactPreference || product.contactPreference || "Both",
  };

  // Handle images
  if (req.files?.pimage?.[0]?.path) {
    updateData.pimage = req.files.pimage[0].path;
  } else if (req.body.existingImage1) {
    updateData.pimage = req.body.existingImage1;
  }

  if (req.files?.pimage2?.[0]?.path) {
    updateData.pimage2 = req.files.pimage2[0].path;
  } else if (req.body.existingImage2) {
    updateData.pimage2 = req.body.existingImage2;
  }

  // Validate location
  if (updateData.location && !isValidLocation(updateData.location)) {
    return res.status(400).json({
      message: `Invalid location. Must be one of: ${VALID_LOCATIONS.join(", ")}`,
    });
  }

  await Product.updateOne({ _id: productId }, updateData);
  res.json({ message: "Product updated successfully" });
}));

/**
 * PUT /update-product-status/:productId
 * Mark product as sold/available
 */
router.put("/update-product-status/:productId", asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { userId, status: newStatus } = req.body;

  if (!isValidStatus(newStatus)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUS.join(", ")}`,
    });
  }

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Check ownership
  if (product.addedBy.toString() !== userId) {
    return res.status(403).json({ message: "You can only update your own products" });
  }

  await Product.updateOne({ _id: productId }, { status: newStatus });
  res.json({ message: `Product marked as ${newStatus}` });
}));

/**
 * DELETE /delete-product/:productId
 * Delete a product
 */
router.delete("/delete-product/:productId", asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { userId } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Check ownership
  if (product.addedBy.toString() !== userId) {
    return res.status(403).json({ message: "You can only delete your own products" });
  }

  await Product.deleteOne({ _id: productId });
  res.json({ message: "Product deleted successfully" });
}));

module.exports = router;
