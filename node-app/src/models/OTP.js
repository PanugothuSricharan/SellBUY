const mongoose = require("mongoose");

/**
 * OTP Schema
 * Stores temporary OTPs for mobile verification
 * Auto-expires after 5 minutes
 */
const otpSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3, // Max 3 wrong attempts
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      index: { expires: 0 }, // TTL index - auto delete when expired
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
otpSchema.index({ mobile: 1, userId: 1 });

/**
 * Generate a 6-digit OTP
 */
otpSchema.statics.generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create or update OTP for a mobile number
 */
otpSchema.statics.createOTP = async function (mobile, userId) {
  const otp = this.generateOTP();

  // Remove any existing OTP for this mobile/user
  await this.deleteMany({ mobile, userId });

  // Create new OTP
  const otpDoc = await this.create({
    mobile,
    otp,
    userId,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return otp;
};

/**
 * Verify OTP
 * Returns: { success: boolean, message: string }
 */
otpSchema.statics.verifyOTP = async function (mobile, userId, inputOtp) {
  const otpDoc = await this.findOne({ mobile, userId });

  if (!otpDoc) {
    return { success: false, message: "OTP expired or not found. Please request a new one." };
  }

  if (otpDoc.verified) {
    return { success: false, message: "OTP already used. Please request a new one." };
  }

  if (otpDoc.attempts >= 3) {
    await this.deleteOne({ _id: otpDoc._id });
    return { success: false, message: "Too many wrong attempts. Please request a new OTP." };
  }

  if (otpDoc.otp !== inputOtp) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = 3 - otpDoc.attempts;
    return { 
      success: false, 
      message: remaining > 0 
        ? `Invalid OTP. ${remaining} attempt(s) remaining.` 
        : "Too many wrong attempts. Please request a new OTP."
    };
  }

  // OTP is correct - mark as verified
  otpDoc.verified = true;
  await otpDoc.save();

  return { success: true, message: "OTP verified successfully" };
};

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
