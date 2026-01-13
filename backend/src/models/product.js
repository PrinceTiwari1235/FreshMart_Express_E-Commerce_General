/* 1. The Product Schema*/

import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      enum: ['Small', 'Medium', 'Large', 'XL', '250g', '500g', '1kg', '2kg'],
      required: true,
    },
    color: {
      type: String,
      default: null,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sku: {
      //stock keeping unit (sku) aka unique identifier Tshirt aka TSU
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { _id: true }
); // _id: true means mongoose should automatically adds _id field to documents created using this schema

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      // part of URL www.example.com/products/red-jacket, slug is red-jacket.
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
      validate: {
        validator: function (arr) {
          return arr.length > 0 && arr.length <= 10;
        },
        message: 'Product must have between 1 and 10 images',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    ratings: {
      type: [ratingSchema],
      default: [],
    },
  },
  {
    timestamps: true, // automatically creates createAt, updatedAt fields
  }
);

// Indexes for performance
productSchema.index({ category: 1, price: 1 }); // 1 means stores in ascending order (cheapest first)
productSchema.index({ createdAt: -1 }); // -1 means stores in desceneding order (newest first)
productSchema.index({ slug: 1 }, { unique: true }); // 1 means ascending order, alphabetically
productSchema.index({ name: 'text', description: 'text' }); //enables full text search

// Create models from the schemas
const Product = mongoose.model('Product', productSchema);

export default Product;
