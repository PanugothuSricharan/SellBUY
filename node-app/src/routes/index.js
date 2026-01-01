const express = require("express");

// Import route modules
const authRoutes = require("./auth");
const userRoutes = require("./users");
const productRoutes = require("./products");
const adminRoutes = require("./admin");
const messageRoutes = require("./messages");

const router = express.Router();

/**
 * Mount all route modules
 * All routes are mounted at the root level to maintain
 * backwards compatibility with the existing API
 */

// Authentication routes: /signup, /login, /google-login
router.use("/", authRoutes);

// User routes: /get-user/:userId, /update-mobile/:userId, /like-product, /liked-products
router.use("/", userRoutes);

// Product routes: /get-products, /get-product/:productId, /search, etc.
router.use("/", productRoutes);

// Admin routes: /check-admin/:userId, /admin/*
router.use("/", adminRoutes);

// Message routes: /contact-admin, /my-messages/:userId
router.use("/", messageRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
router.get("/", (req, res) => {
  res.send("SellBUY API v1.0");
});

module.exports = router;
