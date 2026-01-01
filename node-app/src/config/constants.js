/**
 * Application constants
 * Centralized location for all magic values and configuration
 */

// ============ LOCATION ENUM ============
const VALID_LOCATIONS = ["BH-1", "BH-2", "BH-3", "GH", "IVH", "Satpura"];
const ENTIRE_CAMPUS = "Entire Campus";

// ============ PRODUCT ENUMS ============
const VALID_CONDITIONS = ["New", "Sealed", "Like New", "Used"];
const VALID_STATUS = ["Available", "Sold"];
const VALID_CONTACT_PREFERENCES = ["WhatsApp", "Phone Call", "Both"];
const VALID_APPROVAL_STATUS = ["APPROVED", "HIDDEN"];

// ============ ADMIN CONFIGURATION ============
const ADMIN_EMAIL = "imt_2021072@iiitm.ac.in";

// ============ RATE LIMIT CONFIGURATION ============
const PRODUCTS_PER_DAY_LIMIT = 10;
const RATE_LIMIT_HOURS = 24;

// ============ CACHE CONFIGURATION ============
const BLOCKED_USERS_CACHE_TTL_MS = 60000; // 60 seconds

// ============ JWT CONFIGURATION ============
const JWT_SECRET = process.env.JWT_SECRET || "MY_SECRET_KEY";
const JWT_EXPIRY_DEFAULT = "1h";
const JWT_EXPIRY_GOOGLE = "7d";

// ============ GOOGLE OAUTH ============
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "45965234451-stt1nfrj264pphitcqnve10ov8c54tgv.apps.googleusercontent.com";

// ============ VALIDATION HELPERS ============
const isValidLocation = (location) => VALID_LOCATIONS.includes(location);
const isValidCondition = (condition) => VALID_CONDITIONS.includes(condition);
const isValidStatus = (status) => VALID_STATUS.includes(status);
const isValidContactPreference = (pref) => VALID_CONTACT_PREFERENCES.includes(pref);

// ============ EMAIL VALIDATION ============
const ALLOWED_EMAIL_DOMAIN = "@iiitm.ac.in";
const isValidCollegeEmail = (email) => email && email.endsWith(ALLOWED_EMAIL_DOMAIN);

module.exports = {
  VALID_LOCATIONS,
  ENTIRE_CAMPUS,
  VALID_CONDITIONS,
  VALID_STATUS,
  VALID_CONTACT_PREFERENCES,
  VALID_APPROVAL_STATUS,
  ADMIN_EMAIL,
  PRODUCTS_PER_DAY_LIMIT,
  RATE_LIMIT_HOURS,
  BLOCKED_USERS_CACHE_TTL_MS,
  JWT_SECRET,
  JWT_EXPIRY_DEFAULT,
  JWT_EXPIRY_GOOGLE,
  GOOGLE_CLIENT_ID,
  ALLOWED_EMAIL_DOMAIN,
  isValidLocation,
  isValidCondition,
  isValidStatus,
  isValidContactPreference,
  isValidCollegeEmail,
};
