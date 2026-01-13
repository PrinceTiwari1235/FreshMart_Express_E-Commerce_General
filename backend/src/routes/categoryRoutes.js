import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
} from '../controllers/categoryController.js';

const router = express.Router();

// @route   GET /api/categories
router.get('/', getAllCategories);

// @route   POST /api/categories
router.post('/', createCategory);

// @route   PUT /api/categories/:id
router.put('/:id', updateCategory);

export default router;
