// API URL - Uses environment variable in production, localhost in development
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

// Helper function to get image URL
// Handles both Cloudinary URLs (full URLs) and legacy local uploads
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL (Cloudinary), return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  // Legacy: local file path - prepend API URL
  return `${API_URL}/uploads/${imagePath}`;
};

export default API_URL;
