const mongoose = require("mongoose");
const {
  VALID_CONDITIONS,
  VALID_STATUS,
  VALID_CONTACT_PREFERENCES,
  VALID_APPROVAL_STATUS,
} = require("../config/constants");

/**
 * Product Schema
 * Represents products in the marketplace
 */
const ProductSchema = new mongoose.Schema({
  pname: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  pdesc: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: String,
    required: true,
  },
  isNegotiable: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  pimage: {
    type: String,
    required: true,
  },
  pimage2: {
    type: String,
  },
  location: {
    type: String,
    required: true,
    index: true,
  },
  condition: {
    type: String,
    enum: VALID_CONDITIONS,
    default: "Used",
  },
  productAge: {
    type: String,
  },
  originalUrl: {
    type: String,
  },
  contactPreference: {
    type: String,
    enum: VALID_CONTACT_PREFERENCES,
    default: "Both",
  },
  status: {
    type: String,
    enum: VALID_STATUS,
    default: "Available",
    index: true,
  },
  approvalStatus: {
    type: String,
    enum: VALID_APPROVAL_STATUS,
    default: "APPROVED",
    index: true,
  },
  hiddenReason: {
    type: String,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// ============ COMPOUND INDEXES FOR COMMON QUERIES ============
// Main listing query: approved + available + sorted by date
ProductSchema.index({ approvalStatus: 1, status: 1, createdAt: -1 });
// Location-based filtering
ProductSchema.index({ approvalStatus: 1, status: 1, location: 1, createdAt: -1 });
// Category-based filtering
ProductSchema.index({ approvalStatus: 1, status: 1, category: 1, createdAt: -1 });
// User's products
ProductSchema.index({ addedBy: 1, createdAt: -1 });
// Legacy indexes for backwards compatibility
ProductSchema.index({ approvalStatus: 1, location: 1 });
ProductSchema.index({ approvalStatus: 1, category: 1 });

// ============ STATIC METHODS ============
/**
 * Get products for public listing
 */
ProductSchema.statics.getPublicProducts = function(filter = {}, options = {}) {
  const { skip = 0, limit = 50, blockedUserIds = [] } = options;
  
  const query = {
    approvalStatus: "APPROVED",
    status: "Available",
    ...filter,
  };
  
  if (blockedUserIds.length > 0) {
    query.addedBy = { $nin: blockedUserIds };
  }
  
  return this.find(query)
    .select("pname price pimage category location condition productAge pdesc isNegotiable status createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
