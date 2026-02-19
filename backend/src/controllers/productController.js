import Product from '../models/product.js';
import mongoose from 'mongoose';
import recommendationService from '../services/recommendationService.js';

    // Query Helper Functions
    const buildFilterQuery = (queryParams) => {
      const filter = {}; //initialize empty object

      // Category filter for exact match
      if (queryParams.category) { //checks if queryparamrrs has category id
        if (mongoose.Types.ObjectId.isValid(queryParams.category)) { //check is f the provided catefor yid in query params is a valid mongodb objectid
          filter.category = queryParams.category; //Adds an exact match filter for the category field.
        }
      }

      // Price range filter
      if (queryParams.minPrice || queryParams.maxPrice) { //has both min proce and max price
        filter.price = {};
        if (queryParams.minPrice) {
          filter.price.$gte = Number(queryParams.minPrice); // provide all data that is greater than or equal to min proce eg 10
        }
        if (queryParams.maxPrice) {
          filter.price.$lte = Number(queryParams.maxPrice); //provide all data that is less than or equal to max proce eg 50
        }
      }

      // Stock status filter
      if (queryParams.inStock === 'true') {
        filter.stock = { $gt: 0 }; //provide all greater than 0
      } else if (queryParams.inStock === 'false') {
        filter.stock = 0; //provide all 0
      }

      // Search functionality (text search)
      if (queryParams.search) {
        filter.$text = { $search: queryParams.search }; //Uses the MongoDB text search operator to find results matching the search term.
      }

      return filter;
    };

    const buildSortQuery = (sortBy) => {
      const sortOptions = {
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        'newest': { createdAt: -1 },
        'oldest': { createdAt: 1 },
        'name-asc': { name: 1 },
        'name-desc': { name: -1 },
        'popularity': { 'ratings.length': -1 }, // Sort by number of ratings
      };

      return sortOptions[sortBy] || { createdAt: -1 }; // Default to newest
    };

    const calculateAverageRating = (ratings) => {
      if (!ratings || ratings.length === 0) return 0;
      const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
      return sum / ratings.length;
    };
























// @desc    Get all products with filtering, sorting, pagination, and search
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy,
      category,
      minPrice,
      maxPrice,
      inStock,
      search,
      minRating,
    } = req.query;

    // Build filter query
    const filter = buildFilterQuery({
      category,
      minPrice,
      maxPrice,
      inStock,
      search,
    });

    // Build sort query
    const sort = buildSortQuery(sortBy);

    // Calculate pagination
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
    const skip = (pageNumber - 1) * limitNumber;

    // Execute query with pagination
    let query = Product.find(filter)
      .populate('category', 'name slug description')
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    // Add text score for search queries
    if (search) {
      query = query.select({ score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
    }

    const products = await query;

    // Filter by minimum rating if specified (done after query due to virtual field)
    let filteredProducts = products;
    if (minRating) {
      const minRatingNum = Number(minRating);
      filteredProducts = products.filter((product) => {
        const avgRating = calculateAverageRating(product.ratings);
        return avgRating >= minRatingNum;
      });
    }

    // Get total count for pagination (using same filter)
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNumber);

    // Build response with pagination metadata
    res.status(200).json({
      success: true,
      count: filteredProducts.length,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalProducts,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
      data: filteredProducts.map((product) => ({
        ...product.toObject(),
        averageRating: calculateAverageRating(product.ratings),
        totalReviews: product.ratings.length,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
      error: error.message,
    });
  }
};


// till here

// @desc    Create a new product*
// @route   POST /api/products*
// @access  Private/Admin*

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

// @desc    Get single product by ID*
// @route   GET /api/products/:id*
// @access  Public*

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

// @desc    Update product*
// @route   PUT /api/products/:id*
// @access  Private/Admin*

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

// @desc    Delete product*
// @route   DELETE /api/products/:id*
// @access  Private/Admin*

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





//new added from here related to recommendations


// ============ NEW RECOMMENDATION ENDPOINTS ============

// @desc    Get product recommendations
// @route   GET /api/products/:id/recommendations
// @access  Public
export const getProductRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 6 } = req.query;

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

    const recommendations = await recommendationService.getRelatedProducts(
      id,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message,
    });
  }
};

// @desc    Get similar products
// @route   GET /api/products/:id/similar
// @access  Public
export const getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 8 } = req.query;

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

    const similar = await recommendationService.getYouMayAlsoLike(
      id,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: similar.length,
      data: similar,
    });

  } catch (error) {
    console.error('Get similar products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching similar products',
      error: error.message,
    });
  }
};

// @desc    Get popular products in category
// @route   GET /api/categories/:categoryId/popular
// @access  Public
export const getPopularInCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 10 } = req.query;

    // Validate category ID
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      });
    }

    // Get popular products
    const popular = await recommendationService.getPopularInCategory(
      categoryId,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: popular.length,
      data: popular,
    });

  } catch (error) {
    console.error('Get popular products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular products',
      error: error.message,
    });
  }
};
