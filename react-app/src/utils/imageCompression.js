// Image compression utility for client-side image optimization
// This compresses images before upload to reduce file size while maintaining quality

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeMB = 2,
  } = options;

  return new Promise((resolve, reject) => {
    // If file is already small enough, return as is
    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            
            // Create a new file from the blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
};

/**
 * Compress image with progressive quality reduction until target size is met
 * @param {File} file - The image file to compress
 * @param {number} targetSizeMB - Target size in MB (default 2MB)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImageToSize = async (file, targetSizeMB = 2) => {
  const targetSize = targetSizeMB * 1024 * 1024;
  
  // If already under target, return as is
  if (file.size <= targetSize) {
    return file;
  }
  
  let quality = 0.9;
  let compressedFile = file;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (compressedFile.size > targetSize && attempts < maxAttempts && quality > 0.3) {
    try {
      compressedFile = await compressImage(file, {
        maxWidth: attempts < 2 ? 1920 : 1280,
        maxHeight: attempts < 2 ? 1080 : 720,
        quality: quality,
        maxSizeMB: targetSizeMB,
      });
      
      quality -= 0.15;
      attempts++;
    } catch (error) {
      console.error('Compression attempt failed:', error);
      break;
    }
  }
  
  return compressedFile;
};

export default compressImage;
