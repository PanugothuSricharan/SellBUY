const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

/**
 * Cloudinary configuration and multer storage setup
 */

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sellbuy-products",
    // Added heic and heif for iOS camera support
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"],
    // Convert HEIC/HEIF to JPEG for better compatibility
    format: "jpg",
    transformation: [
      { width: 800, height: 800, crop: "limit", quality: "auto" },
    ],
  },
});

// File filter to validate image types (including mobile formats)
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    // Some mobile browsers report these MIME types
    'image/heic-sequence',
    'image/heif-sequence',
  ];
  
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload a valid image (JPEG, PNG, GIF, WebP, or HEIC).`), false);
  }
};

// Multer upload middleware with file size limit (10MB for mobile camera images)
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit to handle large mobile camera images
  }
});

module.exports = {
  cloudinary,
  storage,
  upload,
};
