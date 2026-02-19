// routes/uploadRoutes.js
import express from 'express';
import {
  uploadImage,
  uploadMultipleImages,
  addProductImages,
  deleteProductImage,
  replaceProductImages,
} from '../controllers/uploadController.js';
import {
  uploadSingle,
  uploadMultiple,
  handleMulterError,
} from '../middleware/upload.js';

const router = express.Router();

// @route   POST /api/uploads
// @desc    Upload single image
// @access  Private/Admin
router.post('/', uploadSingle, handleMulterError, uploadImage);

// @route   POST /api/uploads/multiple
// @desc    Upload multiple images
// @access  Private/Admin
router.post('/multiple', uploadMultiple, handleMulterError, uploadMultipleImages);

// @route   POST /api/products/:id/images
// @desc    Add images to product
// @access  Private/Admin
router.post('/products/:id/images', uploadMultiple, handleMulterError, addProductImages);

// @route   DELETE /api/products/:id/images
// @desc    Delete image from product
// @access  Private/Admin
router.delete('/products/:id/images', deleteProductImage);

// @route   PUT /api/products/:id/images
// @desc    Replace all product images
// @access  Private/Admin
router.put('/products/:id/images', uploadMultiple, handleMulterError, replaceProductImages);

export default router;