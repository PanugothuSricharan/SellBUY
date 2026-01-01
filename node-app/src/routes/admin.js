const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Message = require("../models/Message");
const { ADMIN_EMAIL } = require("../config/constants");
const { requireAdmin } = require("../middleware/auth");
const { invalidateBlockedUsersCache } = require("../services/cache");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * GET /check-admin/:userId
 * Check if user is admin
 */
router.get("/check-admin/:userId", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select("email").lean();
  
  if (!user) {
    return res.status(404).json({ message: "User not found", isAdmin: false });
  }

  const isAdmin = user.email === ADMIN_EMAIL;
  res.json({ isAdmin, email: user.email });
}));

/**
 * GET /admin/pending-products/:userId
 * Get all products for moderation (admin only)
 */
router.get("/admin/pending-products/:userId", requireAdmin, asyncHandler(async (req, res) => {
  const products = await Product.find({})
    .populate("addedBy", "username email mobile isBlocked")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ message: "success", products });
}));

/**
 * GET /admin/all-products/:userId
 * Get all products (admin only)
 */
router.get("/admin/all-products/:userId", requireAdmin, asyncHandler(async (req, res) => {
  const products = await Product.find({})
    .populate("addedBy", "username email mobile isBlocked")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ message: "success", products });
}));

/**
 * PUT /admin/hide-product/:productId
 * Hide a product from homepage (admin only)
 */
router.put("/admin/hide-product/:productId", requireAdmin, asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.productId,
    {
      approvalStatus: "HIDDEN",
      hiddenReason: reason || "Hidden by admin",
    },
    { new: true }
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ message: "Product hidden from homepage", product });
}));

/**
 * PUT /admin/unhide-product/:productId
 * Unhide a product (admin only)
 */
router.put("/admin/unhide-product/:productId", requireAdmin, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.productId,
    {
      approvalStatus: "APPROVED",
      hiddenReason: null,
    },
    { new: true }
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ message: "Product restored to homepage", product });
}));

/**
 * DELETE /admin/delete-product/:productId
 * Delete a product (admin only)
 */
router.delete("/admin/delete-product/:productId", requireAdmin, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ message: "Product deleted permanently" });
}));

/**
 * GET /admin/users/:userId
 * Get all users (admin only)
 */
router.get("/admin/users/:userId", requireAdmin, asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select("username email mobile isBlocked blockedReason blockedAt createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ message: "success", users });
}));

/**
 * GET /admin/all-sellers/:userId
 * Get all sellers/users for admin panel (admin only)
 */
router.get("/admin/all-sellers/:userId", requireAdmin, asyncHandler(async (req, res) => {
  const sellers = await User.find({})
    .select("username email mobile isBlocked blockedReason blockedAt createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ message: "success", sellers });
}));

/**
 * PUT /admin/block-user/:targetUserId
 * Block a user (admin only)
 */
router.put("/admin/block-user/:targetUserId", requireAdmin, asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const targetUser = await User.findByIdAndUpdate(
    req.params.targetUserId,
    {
      isBlocked: true,
      blockedReason: reason || "Blocked by admin",
      blockedAt: new Date(),
    },
    { new: true }
  );

  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // Invalidate the blocked users cache
  invalidateBlockedUsersCache();

  res.json({
    message: "User blocked successfully",
    user: {
      _id: targetUser._id,
      username: targetUser.username,
      email: targetUser.email,
      isBlocked: targetUser.isBlocked,
      blockedReason: targetUser.blockedReason,
    },
  });
}));

/**
 * PUT /admin/unblock-user/:targetUserId
 * Unblock a user (admin only)
 */
router.put("/admin/unblock-user/:targetUserId", requireAdmin, asyncHandler(async (req, res) => {
  const targetUser = await User.findByIdAndUpdate(
    req.params.targetUserId,
    {
      isBlocked: false,
      blockedReason: null,
      blockedAt: null,
    },
    { new: true }
  );

  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // Invalidate the blocked users cache
  invalidateBlockedUsersCache();

  res.json({
    message: "User unblocked successfully",
    user: {
      _id: targetUser._id,
      username: targetUser.username,
      email: targetUser.email,
      isBlocked: targetUser.isBlocked,
    },
  });
}));

/**
 * GET /admin/dashboard-stats/:userId
 * Get dashboard statistics (admin only)
 */
router.get("/admin/dashboard-stats/:userId", requireAdmin, asyncHandler(async (req, res) => {
  const [totalProducts, totalUsers, hiddenProducts, blockedUsers] = await Promise.all([
    Product.countDocuments({}),
    User.countDocuments({}),
    Product.countDocuments({ approvalStatus: "HIDDEN" }),
    User.countDocuments({ isBlocked: true }),
  ]);

  // Products added in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentProducts = await Product.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  res.json({
    message: "success",
    stats: {
      totalProducts,
      totalUsers,
      hiddenProducts,
      blockedUsers,
      recentProducts,
    },
  });
}));

// ============ MESSAGE ROUTES FOR ADMIN ============

/**
 * GET /admin/messages/:userId
 * Get all messages (admin only)
 */
router.get("/admin/messages/:userId", requireAdmin, asyncHandler(async (req, res) => {
  const messages = await Message.find({})
    .populate("userId", "username email")
    .sort({ createdAt: -1 })
    .lean();

  const [unreadCount, readCount, resolvedCount] = await Promise.all([
    Message.countDocuments({ status: "unread" }),
    Message.countDocuments({ status: "read" }),
    Message.countDocuments({ status: "resolved" }),
  ]);

  res.json({
    message: "success",
    messages,
    counts: { unread: unreadCount, read: readCount, resolved: resolvedCount },
  });
}));

/**
 * PUT /admin/message/read/:messageId
 * Mark message as read (admin only)
 */
router.put("/admin/message/read/:messageId", requireAdmin, asyncHandler(async (req, res) => {
  const msg = await Message.findByIdAndUpdate(
    req.params.messageId,
    { status: "read", readAt: new Date() },
    { new: true }
  );

  if (!msg) {
    return res.status(404).json({ message: "Message not found" });
  }

  res.json({ message: "Marked as read", data: msg });
}));

/**
 * PUT /admin/message/resolve/:messageId
 * Resolve message with optional reply (admin only)
 */
router.put("/admin/message/resolve/:messageId", requireAdmin, asyncHandler(async (req, res) => {
  const { adminReply } = req.body;

  const msg = await Message.findByIdAndUpdate(
    req.params.messageId,
    {
      status: "resolved",
      resolvedAt: new Date(),
      adminReply: adminReply || "",
    },
    { new: true }
  );

  if (!msg) {
    return res.status(404).json({ message: "Message not found" });
  }

  res.json({ message: "Message resolved", data: msg });
}));

/**
 * DELETE /admin/message/:messageId
 * Delete a message (admin only)
 */
router.delete("/admin/message/:messageId", requireAdmin, asyncHandler(async (req, res) => {
  await Message.findByIdAndDelete(req.params.messageId);
  res.json({ message: "Message deleted" });
}));

module.exports = router;
