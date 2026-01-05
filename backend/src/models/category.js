//2. The Category Schema

import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Category description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      type: String,
      required: [true, 'Category image is required'],
      trim: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
  },
  {
    timestamps: true, //automatically ceate createdAt and updatedAt
  }
);

// Indexes for performance
categorySchema.index({ slug: 1 }, { unique: true }); // Unique and fast lookup for URLs ascending
categorySchema.index({ parentCategory: 1 }); // Fast lookup for subcategories ascending
categorySchema.index({ name: 1 }); // Optimization sorted by name ascending
categorySchema.index({ name: 'text', description: 'text' }); // Full-text search for the search bar

const Category = mongoose.model('Category', categorySchema);

export default Category;
