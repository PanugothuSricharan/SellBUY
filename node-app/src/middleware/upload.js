const { upload } = require("../config/cloudinary");

/**
 * File upload middleware configurations
 */

// Single image upload
const uploadSingle = upload.single("image");

// Product images upload (primary + secondary)
const uploadProductImages = upload.fields([
  { name: "pimage", maxCount: 1 },
  { name: "pimage2", maxCount: 1 },
]);

module.exports = {
  uploadSingle,
  uploadProductImages,
};
