// config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload image to Cloudinary
export const uploadToCloudinary = async (file, folder = 'products') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

// Helper function to extract public ID from Cloudinary URL
export const extractPublicId = (url) => {
  // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/products/image.jpg
  // Public ID: products/image
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
    const publicIdParts = parts.slice(uploadIndex + 2);
    const publicId = publicIdParts.join('/').split('.')[0];
    return publicId;
  }
  return null;
};

export default cloudinary;