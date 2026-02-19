import Product from '../models/product.js';

class RecommendationService {
  
  /**
   * Calculate average rating
   */
  calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / ratings.length;
  }

  /**
   * Get related products (same category + similar price)
   * This is the CORE recommendation feature
   */
  async getRelatedProducts(productId, limit = 6) {
    try {
      // Get the current product
      const product = await Product.findById(productId).select('category price');
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Calculate price range (±30% of current price)
      const priceMargin = product.price * 0.3;
      const minPrice = product.price - priceMargin;
      const maxPrice = product.price + priceMargin;

      // Find products in same category with similar price
      const relatedProducts = await Product.find({
        _id: { $ne: productId }, // Exclude current product
        category: product.category,
        price: { $gte: minPrice, $lte: maxPrice },
        stock: { $gt: 0 }, // Only in-stock products
      })
        .populate('category', 'name slug')
        .select('name slug price images stock ratings')
        .limit(limit);

      // Add computed fields
      return relatedProducts.map(prod => ({
        ...prod.toObject(),
        averageRating: this.calculateAverageRating(prod.ratings),
        totalReviews: prod.ratings.length,
      }));

    } catch (error) {
      console.error('Error getting related products:', error);
      throw error;
    }
  }

  /**
   * Get "You May Also Like" recommendations
   * Based on: same category, sorted by ratings and popularity
   */
  async getYouMayAlsoLike(productId, limit = 8) {
    try {
      const product = await Product.findById(productId).select('category price');
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Get products from same category, sorted by ratings
      const recommendations = await Product.find({
        _id: { $ne: productId },
        category: product.category,
        stock: { $gt: 0 },
      })
        .populate('category', 'name slug')
        .select('name slug price images stock ratings')
        .limit(limit * 2); // Get more to filter by rating

      // Calculate average rating and sort
      const productsWithRatings = recommendations.map(prod => ({
        ...prod.toObject(),
        averageRating: this.calculateAverageRating(prod.ratings),
        totalReviews: prod.ratings.length,
      }));

      // Sort by rating and number of reviews
      productsWithRatings.sort((a, b) => {
        // First sort by rating
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        // Then by number of reviews
        return b.totalReviews - a.totalReviews;
      });

      return productsWithRatings.slice(0, limit);

    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Get popular products in same category
   * Based on number of ratings (simple popularity metric)
   */
  async getPopularInCategory(categoryId, limit = 10) {
    try {
      const products = await Product.find({
        category: categoryId,
        stock: { $gt: 0 },
      })
        .populate('category', 'name slug')
        .select('name slug price images stock ratings')
        .limit(limit * 2);

      // Add ratings and sort by popularity
      const productsWithRatings = products.map(prod => ({
        ...prod.toObject(),
        averageRating: this.calculateAverageRating(prod.ratings),
        totalReviews: prod.ratings.length,
      }));

      // Sort by number of reviews (popularity)
      productsWithRatings.sort((a, b) => b.totalReviews - a.totalReviews);

      return productsWithRatings.slice(0, limit);

    } catch (error) {
      console.error('Error getting popular products:', error);
      throw error;
    }
  }

  /**
   * Get similar products (flexible matching)
   * If no results in same category, expand to similar price range
   */
  async getSimilarProducts(productId, limit = 6) {
    try {
      const product = await Product.findById(productId).select('category price');
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Try to get related products first
      let similar = await this.getRelatedProducts(productId, limit);

      // If not enough results, get products in same category only
      if (similar.length < limit) {
        const categoryProducts = await Product.find({
          _id: { $ne: productId },
          category: product.category,
          stock: { $gt: 0 },
        })
          .populate('category', 'name slug')
          .select('name slug price images stock ratings')
          .limit(limit);

        similar = categoryProducts.map(prod => ({
          ...prod.toObject(),
          averageRating: this.calculateAverageRating(prod.ratings),
          totalReviews: prod.ratings.length,
        }));
      }

      return similar;

    } catch (error) {
      console.error('Error getting similar products:', error);
      throw error;
    }
  }
}

export default new RecommendationService();