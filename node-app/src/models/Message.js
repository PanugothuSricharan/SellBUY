const mongoose = require("mongoose");

/**
 * Message Schema
 * For contact admin functionality
 */
const MessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["unread", "read", "resolved"],
    default: "unread",
    index: true,
  },
  adminReply: {
    type: String,
  },
  readAt: {
    type: Date,
  },
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Compound index for admin queries
MessageSchema.index({ status: 1, createdAt: -1 });

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
