const mongoose = require("mongoose");

/**
 * User Schema
 * Represents users in the marketplace
 */
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  mobile: {
    type: String,
    trim: true,
  },
  mobileVerified: {
    type: Boolean,
    default: false,
  },
  googleId: {
    type: String,
    sparse: true, // Allow null values, only index non-null
  },
  likedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  }],
  isBlocked: {
    type: Boolean,
    default: false,
    index: true, // Indexed for fast blocked user queries
  },
  blockedReason: {
    type: String,
  },
  blockedAt: {
    type: Date,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Compound index for lookups
UserSchema.index({ email: 1, isBlocked: 1 });

const User = mongoose.model("User", UserSchema);

module.exports = User;
