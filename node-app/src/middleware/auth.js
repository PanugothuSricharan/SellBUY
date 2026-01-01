const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ADMIN_EMAIL, JWT_SECRET } = require("../config/constants");

/**
 * JWT verification middleware
 * Verifies the token and attaches user data to request
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.data;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Admin authorization middleware
 * Must be used after verifyToken or with userId in body
 */
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.params.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }

    const user = await User.findById(userId).select("email").lean();
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Check if user is blocked
 */
const checkNotBlocked = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.params.userId || req.user?._id;
    
    if (!userId) {
      return next(); // Skip check if no user
    }

    const user = await User.findById(userId).select("isBlocked blockedReason").lean();
    
    if (user?.isBlocked) {
      return res.status(403).json({ 
        message: "Your account has been blocked",
        reason: user.blockedReason || "No reason provided"
      });
    }

    next();
  } catch (error) {
    next(); // Continue on error
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  checkNotBlocked,
};
