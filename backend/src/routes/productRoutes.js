import express from 'express';
import {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

const router = express.Router();

// @route   POST /api/products
router.post('/', createProduct);

// @route   GET /api/products/:id
router.get('/:id', getProductById);

// @route   PUT /api/products/:id
router.put('/:id', updateProduct);

// @route   DELETE /api/products/:id
router.delete('/:id', deleteProduct);

export default router;
