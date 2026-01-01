const express = require("express");
const Message = require("../models/Message");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * POST /contact-admin
 * Send a message to admin
 */
router.post("/contact-admin", asyncHandler(async (req, res) => {
  const { userId, subject, message } = req.body;

  if (!userId || !subject || !message) {
    return res.status(400).json({
      message: "User ID, subject, and message are required",
    });
  }

  const newMessage = new Message({
    userId,
    subject,
    message,
  });

  await newMessage.save();
  res.json({ message: "Message sent successfully" });
}));

/**
 * GET /my-messages/:userId
 * Get messages sent by a user
 */
router.get("/my-messages/:userId", asyncHandler(async (req, res) => {
  const messages = await Message.find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ message: "success", messages });
}));

module.exports = router;
