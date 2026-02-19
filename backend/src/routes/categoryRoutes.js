import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
} from '../controllers/categoryController.js';

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', getAllCategories);

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private/Admin
router.post('/', createCategory);

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put('/:id', updateCategory);

export default router;