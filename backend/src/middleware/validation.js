import { body, param, query } from 'express-validator';

const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Product description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
  
  body('stock')
    .notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  
  body('images')
    .isArray({ min: 1, max: 10 }).withMessage('Product must have between 1 and 10 images')
    .custom((images) => {
      if (!images.every(img => typeof img === 'string' && img.length > 0)) {
        throw new Error('All images must be valid URL strings');
      }
      return true;
    }),
  
  body('variants')
    .optional()
    .isArray().withMessage('Variants must be an array'),
  
  body('variants.*.size')
    .optional()
    .isIn(['Small', 'Medium', 'Large', 'XL', '250g', '500g', '1kg', '2kg'])
    .withMessage('Invalid variant size'),
  
  body('variants.*.price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Variant price must be positive'),
  
  body('variants.*.stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Variant stock must be non-negative'),
  
  body('featured')
    .optional()
    .isBoolean().withMessage('Featured must be a boolean'),
  
  body('onSale')
    .optional()
    .isBoolean().withMessage('OnSale must be a boolean')
];

const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Product name cannot be empty')
    .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .notEmpty().withMessage('Description cannot be empty')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
];

const validateCategory = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ max: 100 }).withMessage('Category name cannot exceed 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Category description is required')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('image')
    .notEmpty().withMessage('Category image is required')
    .isURL().withMessage('Image must be a valid URL'),
  
  body('parentCategory')
    .optional()
    .isMongoId().withMessage('Invalid parent category ID'),
  
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
  
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be a boolean')
];

const validateCategoryUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Category name cannot be empty')
    .isLength({ max: 100 }).withMessage('Category name cannot exceed 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .notEmpty().withMessage('Description cannot be empty')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('image')
    .optional()
    .isURL().withMessage('Image must be a valid URL'),
  
  body('parentCategory')
    .optional()
    .isMongoId().withMessage('Invalid parent category ID')
];

const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid ID format')
];

const validateProductQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum price must be non-negative'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum price must be non-negative')
    .custom((value, { req }) => {
      if (req.query.minPrice && parseFloat(value) < parseFloat(req.query.minPrice)) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),
  
  query('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  
  query('sort')
    .optional()
    .isIn(['price', '-price', 'name', '-name', 'createdAt', '-createdAt', 'averageRating', '-averageRating'])
    .withMessage('Invalid sort parameter')
];

export {validateProduct, validateProductUpdate, validateCategory, validateCategoryUpdate, validateMongoId, validateProductQuery}
