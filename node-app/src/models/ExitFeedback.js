const mongoose = require("mongoose");

/**
 * ExitFeedback Schema
 * Stores anonymized exit-intent feedback from sellers
 * Used for analytics to understand why sellers don't complete listings
 */
const exitFeedbackSchema = new mongoose.Schema(
  {
    // Session identifier (not user-linked for privacy)
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    // Primary reason for leaving
    reason: {
      type: String,
      enum: [
        "form_too_long",
        "confusing_fields",
        "technical_issue",
        "just_browsing",
        "missing_info",
        "will_return_later",
        "other",
      ],
      required: true,
    },
    // Optional additional feedback text
    additionalFeedback: {
      type: String,
      maxlength: 500,
      default: "",
    },
    // Form progress percentage when exit occurred
    formProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Which fields were completed
    fieldsCompleted: {
      type: [String],
      default: [],
    },
    // Exit trigger type
    exitType: {
      type: String,
      enum: ["navigation", "back_button", "close_tab", "route_change"],
      default: "navigation",
    },
    // Device type for analytics
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet"],
      default: "desktop",
    },
    // Whether user requested help/contact
    requestedHelp: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for analytics queries
exitFeedbackSchema.index({ createdAt: -1 });
exitFeedbackSchema.index({ reason: 1, createdAt: -1 });

/**
 * Static method to get aggregated stats for admin dashboard
 */
exitFeedbackSchema.statics.getAggregatedStats = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalExits: { $sum: 1 },
        avgProgress: { $avg: "$formProgress" },
        helpRequests: { $sum: { $cond: ["$requestedHelp", 1, 0] } },
        reasonCounts: {
          $push: "$reason",
        },
        deviceCounts: {
          $push: "$deviceType",
        },
        exitTypeCounts: {
          $push: "$exitType",
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalExits: 0,
      avgProgress: 0,
      helpRequests: 0,
      reasonBreakdown: {},
      deviceBreakdown: {},
      exitTypeBreakdown: {},
    };
  }

  // Count occurrences
  const countOccurrences = (arr) =>
    arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

  return {
    totalExits: stats[0].totalExits,
    avgProgress: Math.round(stats[0].avgProgress || 0),
    helpRequests: stats[0].helpRequests,
    reasonBreakdown: countOccurrences(stats[0].reasonCounts),
    deviceBreakdown: countOccurrences(stats[0].deviceCounts),
    exitTypeBreakdown: countOccurrences(stats[0].exitTypeCounts),
  };
};

/**
 * Get recent feedback comments (anonymized)
 */
exitFeedbackSchema.statics.getRecentComments = async function (limit = 10) {
  return this.find({ additionalFeedback: { $ne: "" } })
    .select("reason additionalFeedback formProgress createdAt -_id")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

const ExitFeedback = mongoose.model("ExitFeedback", exitFeedbackSchema);

module.exports = ExitFeedback;
