const express = require("express");
const ExitFeedback = require("../models/ExitFeedback");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * POST /exit-feedback
 * Submit exit-intent feedback (anonymous, no auth required)
 */
router.post(
  "/exit-feedback",
  asyncHandler(async (req, res) => {
    const {
      sessionId,
      reason,
      additionalFeedback,
      formProgress,
      fieldsCompleted,
      exitType,
      deviceType,
      requestedHelp,
    } = req.body;

    // Validate required fields
    if (!sessionId || !reason) {
      return res.status(400).json({
        message: "Session ID and reason are required",
      });
    }

    // Check if feedback already submitted for this session
    const existing = await ExitFeedback.findOne({ sessionId });
    if (existing) {
      return res.status(200).json({
        message: "Feedback already recorded for this session",
        alreadySubmitted: true,
      });
    }

    // Create feedback entry
    const feedback = await ExitFeedback.create({
      sessionId,
      reason,
      additionalFeedback: additionalFeedback?.substring(0, 500) || "",
      formProgress: Math.min(100, Math.max(0, formProgress || 0)),
      fieldsCompleted: fieldsCompleted || [],
      exitType: exitType || "navigation",
      deviceType: deviceType || "desktop",
      requestedHelp: requestedHelp || false,
    });

    res.status(201).json({
      message: "Thank you for your feedback",
      feedbackId: feedback._id,
    });
  })
);

/**
 * GET /exit-feedback/check/:sessionId
 * Check if feedback already submitted for session
 */
router.get(
  "/exit-feedback/check/:sessionId",
  asyncHandler(async (req, res) => {
    const existing = await ExitFeedback.findOne({
      sessionId: req.params.sessionId,
    });

    res.json({
      alreadySubmitted: !!existing,
    });
  })
);

module.exports = router;
