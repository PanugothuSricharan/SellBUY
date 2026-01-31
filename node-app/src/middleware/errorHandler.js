const multer = require("multer");

/**
 * Centralized error handling middleware
 */

/**
 * Not found handler - 404
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  // Handle Multer errors specifically
  if (err instanceof multer.MulterError) {
    let message = "File upload error";
    let statusCode = 400;
    
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File is too large. Maximum size is 10MB.";
        statusCode = 413;
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files. Maximum is 2 images.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected field name for file upload.";
        break;
      default:
        message = `Upload error: ${err.message}`;
    }
    
    return res.status(statusCode).json({ message });
  }
  
  // Handle file filter errors (unsupported file types)
  if (err.message && err.message.includes("Unsupported file type")) {
    return res.status(400).json({ 
      message: err.message 
    });
  }

  // Default to 500 if no status set
  const statusCode = err.status || err.statusCode || 500;
  
  // Log error for debugging (only in development or for server errors)
  if (statusCode >= 500) {
    console.error("Server Error:", err);
  }

  res.status(statusCode).json({
    message: err.message || "Internal server error",
    // Include stack trace only in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
};
