
/**
 * Simple Price Calculation Utilities
 * For basic e-commerce functionality
 */

/**
 * Calculate discount amount
 * @param {Number} price - Original price
 * @param {Object} discount - Discount object { type: 'percentage' | 'fixed', value: number }
 * @returns {Number} - Discount amount
 */
export const calculateDiscountAmount = (price, discount) => {
  if (!discount || !discount.value || discount.value <= 0) {
    return 0;
  }

  if (discount.type === 'percentage') {
    // Percentage discount (e.g., 20% off)
    const discountAmount = (price * discount.value) / 100;
    return Math.round(discountAmount * 100) / 100; // Round to 2 decimals
  } else if (discount.type === 'fixed') {
    // Fixed amount discount (e.g., $10 off)
    return Math.min(discount.value, price); // Can't discount more than price
  }

  return 0;
};

/**
 * Calculate final price after discount
 * @param {Number} price - Original price
 * @param {Object} discount - Discount object
 * @returns {Number} - Final price after discount
 */
export const calculateFinalPrice = (price, discount = null) => {
  const discountAmount = calculateDiscountAmount(price, discount);
  const finalPrice = price - discountAmount;
  return Math.max(0, Math.round(finalPrice * 100) / 100); // Ensure non-negative
};

/**
 * Calculate total for multiple items
 * @param {Array} items - Array of { price, quantity, discount? }
 * @returns {Object} - { subtotal, totalDiscount, total }
 */
export const calculateCartTotal = (items) => {
  let subtotal = 0;
  let totalDiscount = 0;

  items.forEach(item => {
    const itemPrice = item.price * (item.quantity || 1);
    subtotal += itemPrice;

    if (item.discount) {
      const discountAmount = calculateDiscountAmount(itemPrice, item.discount);
      totalDiscount += discountAmount;
    }
  });

  const total = subtotal - totalDiscount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    total: Math.max(0, Math.round(total * 100) / 100),
  };
};

/**
 * Check if discount is valid
 * @param {Object} discount - Discount object
 * @returns {Boolean}
 */
export const isValidDiscount = (discount) => {
  if (!discount || typeof discount !== 'object') {
    return false;
  }

  if (!['percentage', 'fixed'].includes(discount.type)) {
    return false;
  }

  if (typeof discount.value !== 'number' || discount.value <= 0) {
    return false;
  }

  // Percentage shouldn't exceed 100%
  if (discount.type === 'percentage' && discount.value > 100) {
    return false;
  }

  return true;
};

/**
 * Calculate percentage saved
 * @param {Number} originalPrice
 * @param {Number} finalPrice
 * @returns {Number} - Percentage saved
 */
export const calculatePercentageSaved = (originalPrice, finalPrice) => {
  if (originalPrice <= 0) return 0;
  
  const saved = ((originalPrice - finalPrice) / originalPrice) * 100;
  return Math.round(saved * 100) / 100;
};