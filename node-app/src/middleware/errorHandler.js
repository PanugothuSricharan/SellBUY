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
