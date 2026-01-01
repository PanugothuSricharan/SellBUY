// API URL - Uses environment variable in production, localhost in development
const API_URL = process.env.REACT_APP_API_URL || "https://sellbuy-ik7l.onrender.com";

// Helper function to get image URL with optional Cloudinary transformations
// Handles both Cloudinary URLs (full URLs) and legacy local uploads
export const getImageUrl = (imagePath, options = {}) => {
  if (!imagePath) return null;
  
  // If it's a Cloudinary URL, apply optimizations
  if (imagePath.includes("cloudinary.com")) {
    // Default: auto format, auto quality for smaller file sizes
    const { width = 400, quality = "auto", format = "auto" } = options;
    
    // Insert transformations into Cloudinary URL
    // Format: .../upload/w_400,q_auto,f_auto/...
    const transformations = `w_${width},q_${quality},f_${format}`;
    return imagePath.replace("/upload/", `/upload/${transformations}/`);
  }
  
  // If it's already a full URL (non-Cloudinary), return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  
  // Legacy: local file path - prepend API URL
  return `${API_URL}/uploads/${imagePath}`;
};

// Get full-size image for detail page
export const getFullImageUrl = (imagePath) => {
  return getImageUrl(imagePath, { width: 800, quality: "auto" });
};

// Generate srcSet for responsive images
export const getImageSrcSet = (imagePath) => {
  if (!imagePath || !imagePath.includes("cloudinary.com")) return null;
  
  // Define widths for responsive loading (mobile, tablet, desktop)
  const widths = [300, 600, 900];
  
  return widths.map(width => {
    const url = getImageUrl(imagePath, { width, quality: "auto", format: "auto" });
    return `${url} ${width}w`;
  }).join(", ");
};

export default API_URL;
