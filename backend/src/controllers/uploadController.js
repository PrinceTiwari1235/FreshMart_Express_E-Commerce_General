// controllers/uploadController.js
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from '../config/cloudinary.js';
import Product from '../models/product.js';
import mongoose from 'mongoose';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

// @desc    Upload single image
// @route   POST /api/uploads
// @access  Private/Admin
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'products');

    // Delete temporary file
    await unlinkAsync(req.file.path);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.size,
      },
    });
  } catch (error) {
    // Clean up temporary file if it exists
    if (req.file && req.file.path) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message,
    });
  }
};

// @desc    Upload multiple images
// @route   POST /api/uploads/multiple
// @access  Private/Admin
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided',
      });
    }

    // Upload all images to Cloudinary
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file, 'products')
    );

    const results = await Promise.all(uploadPromises);

    // Delete all temporary files
    const deletePromises = req.files.map((file) => unlinkAsync(file.path));
    await Promise.all(deletePromises);

    res.status(200).json({
      success: true,
      message: `${results.length} images uploaded successfully`,
      data: results.map((result) => ({
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.size,
      })),
    });
  } catch (error) {
    // Clean up temporary files if they exist
    if (req.files && req.files.length > 0) {
      const deletePromises = req.files.map(async (file) => {
        try {
          await unlinkAsync(file.path);
        } catch (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
        }
      });
      await Promise.allSettled(deletePromises);
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message,
    });
  }
};

// @desc    Add images to product
// @route   POST /api/products/:id/images
// @access  Private/Admin
export const addProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Find product
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided',
      });
    }

    // Check if adding images exceeds the limit
    const totalImages = product.images.length + req.files.length;
    if (totalImages > 10) {
      // Clean up uploaded files
      const deletePromises = req.files.map((file) => unlinkAsync(file.path));
      await Promise.all(deletePromises);

      return res.status(400).json({
        success: false,
        message: `Cannot add images. Product can have maximum 10 images. Current: ${product.images.length}, Trying to add: ${req.files.length}`,
      });
    }

    // Upload all images to Cloudinary
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file, 'products')
    );

    const results = await Promise.all(uploadPromises);

    // Delete all temporary files
    const deletePromises = req.files.map((file) => unlinkAsync(file.path));
    await Promise.all(deletePromises);

    // Add new image URLs to product
    const newImageUrls = results.map((result) => result.url);
    product.images.push(...newImageUrls);

    await product.save();

    res.status(200).json({
      success: true,
      message: `${results.length} images added to product successfully`,
      data: {
        product,
        addedImages: results.map((result) => ({
          url: result.url,
          publicId: result.publicId,
        })),
      },
    });
  } catch (error) {
    // Clean up temporary files if they exist
    if (req.files && req.files.length > 0) {
      const deletePromises = req.files.map(async (file) => {
        try {
          await unlinkAsync(file.path);
        } catch (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
        }
      });
      await Promise.allSettled(deletePromises);
    }

    res.status(500).json({
      success: false,
      message: 'Error adding images to product',
      error: error.message,
    });
  }
};

// @desc    Delete image from product
// @route   DELETE /api/products/:id/images
// @access  Private/Admin
export const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    // Find product
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if image exists in product
    const imageIndex = product.images.indexOf(imageUrl);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in product',
      });
    }

    // Check if product has only one image
    if (product.images.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last image. Product must have at least one image',
      });
    }

    // Extract public ID from Cloudinary URL
    const publicId = extractPublicId(imageUrl);

    if (publicId) {
      // Delete from Cloudinary
      await deleteFromCloudinary(publicId);
    }

    // Remove image URL from product
    product.images.splice(imageIndex, 1);
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        deletedImageUrl: imageUrl,
        remainingImages: product.images,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message,
    });
  }
};

// @desc    Replace product images
// @route   PUT /api/products/:id/images
// @access  Private/Admin
export const replaceProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Find product
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided',
      });
    }

    if (req.files.length > 10) {
      // Clean up uploaded files
      const deletePromises = req.files.map((file) => unlinkAsync(file.path));
      await Promise.all(deletePromises);

      return res.status(400).json({
        success: false,
        message: 'Maximum 10 images allowed',
      });
    }

    // Store old images for deletion
    const oldImages = [...product.images];

    // Upload new images to Cloudinary
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file, 'products')
    );

    const results = await Promise.all(uploadPromises);

    // Delete all temporary files
    const deletePromises = req.files.map((file) => unlinkAsync(file.path));
    await Promise.all(deletePromises);

    // Update product with new image URLs
    product.images = results.map((result) => result.url);
    await product.save();

    // Delete old images from Cloudinary
    const cloudinaryDeletePromises = oldImages.map(async (imageUrl) => {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (error) {
          console.error(`Error deleting image ${publicId}:`, error);
        }
      }
    });

    await Promise.allSettled(cloudinaryDeletePromises);

    res.status(200).json({
      success: true,
      message: 'Product images replaced successfully',
      data: {
        product,
        newImages: results.map((result) => ({
          url: result.url,
          publicId: result.publicId,
        })),
      },
    });
  } catch (error) {
    // Clean up temporary files if they exist
    if (req.files && req.files.length > 0) {
      const deletePromises = req.files.map(async (file) => {
        try {
          await unlinkAsync(file.path);
        } catch (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
        }
      });
      await Promise.allSettled(deletePromises);
    }

    res.status(500).json({
      success: false,
      message: 'Error replacing product images',
      error: error.message,
    });
  }
};