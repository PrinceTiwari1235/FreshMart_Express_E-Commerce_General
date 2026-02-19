import express from 'express';
import {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductRecommendations,
  getSimilarProducts
} from '../controllers/productController.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, pagination, and search
// @access  Public
router.get('/', getAllProducts);

// @route   POST /api/products
// @desc    Create a new product
// @access  Private/Admin
router.post('/', createProduct);


//new added

// @route   GET /api/products/:id/recommendations
// @desc    Get related product recommendations
// @access  Public
router.get('/:id/recommendations', getProductRecommendations);

// @route   GET /api/products/:id/similar
// @desc    Get similar products
// @access  Public
router.get('/:id/similar', getSimilarProducts);


// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', getProductById);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/:id', updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/:id', deleteProduct);

export default router;