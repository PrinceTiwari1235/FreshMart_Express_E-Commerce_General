import Product from '../models/product.js';
import mongoose from 'mongoose';

// @route   POST /api/products*
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      images,
      category,
      stock,
      variants,
      ratings,
    } = req.body;

    // Validation*
    if (!name || !slug || !description || !price || !images || !category) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide all required fields: name, slug, description, price, images, category',
      });
    }

    // Validate images array*
    if (!Array.isArray(images) || images.length === 0 || images.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Product must have between 1 and 10 images',
      });
    }

    // Validate category ObjectId*
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      });
    }

    // Create product*
    const product = await Product.create({
      name,
      slug,
      description,
      price,
      images,
      category,
      stock,
      variants,
      ratings,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    // Handle duplicate slug error*
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A product with this name already exists',
      });
    }

    // Handle validation errors*
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message); //Extracting error messages
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating product',
      error: error.message,
    });
  }
};

// GET /api/products/:id*
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId*

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await Product.findById(id).populate(
      'category',
      'name slug description'
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product',
      error: error.message,
    });
  }
};

// @route   PUT /api/products/:id*
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId*

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Find product*
    let product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Validate images if provided*
    if (req.body.images) {
      if (
        !Array.isArray(req.body.images) ||
        req.body.images.length === 0 ||
        req.body.images.length > 10
      ) {
        return res.status(400).json({
          success: false,
          message: 'Product must have between 1 and 10 images',
        });
      }
    }

    // Validate category if provided*
    if (
      req.body.category &&
      !mongoose.Types.ObjectId.isValid(req.body.category)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      });
    }

    // Update product*
    product = await Product.findByIdAndUpdate(id, req.body, {
      new: true, // By default, Mongoose returns the original document, by setting new: true, it Returns updated document*
      runValidators: true, //By default, findByIdAndUpdate bypasses these validators during the update operation. Setting runValidators: true, it Runs schema validators*.
    }).populate('category', 'name slug description');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    // Handle duplicate slug error*
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A product with this name already exists',
      });
    }

    // Handle validation errors*
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating product',
      error: error.message,
    });
  }
};

// @route   DELETE /api/products/:id*
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId*
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: { id },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product',
      error: error.message,
    });
  }
};
