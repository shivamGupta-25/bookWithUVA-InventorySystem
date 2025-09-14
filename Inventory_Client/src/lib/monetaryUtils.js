/**
 * Monetary Calculation Utilities
 * Provides consistent floating-point precision handling for all monetary calculations
 */

/**
 * Rounds a number to 2 decimal places to avoid floating-point precision issues
 * @param {number} value - The value to round
 * @returns {number} - The value rounded to 2 decimal places
 */
export const roundToTwoDecimals = (value) => {
  return Math.round(value * 100) / 100;
};

/**
 * Calculates the total price for an item (quantity * unit price)
 * @param {number} quantity - The quantity
 * @param {number} unitPrice - The unit price
 * @returns {number} - The total price rounded to 2 decimal places
 */
export const calculateTotalPrice = (quantity, unitPrice) => {
  return roundToTwoDecimals(quantity * unitPrice);
};

/**
 * Calculates the GST amount for a given total price and GST rate
 * @param {number} totalPrice - The total price before GST
 * @param {number} gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns {number} - The GST amount rounded to 2 decimal places
 */
export const calculateGstAmount = (totalPrice, gstRate) => {
  return roundToTwoDecimals((totalPrice * gstRate) / 100);
};

/**
 * Calculates the final price including GST
 * @param {number} totalPrice - The total price before GST
 * @param {number} gstAmount - The GST amount
 * @returns {number} - The final price rounded to 2 decimal places
 */
export const calculateFinalPrice = (totalPrice, gstAmount) => {
  return roundToTwoDecimals(totalPrice + gstAmount);
};

/**
 * Calculates order totals with proper rounding
 * @param {Array} items - Array of order items with totalPrice and gstAmount
 * @param {number} shippingCharges - Shipping charges (default: 0)
 * @param {number} discountPercentage - Discount percentage (default: 0)
 * @returns {Object} - Object containing subtotal, totalGst, discountAmount, and totalAmount
 */
export const calculateOrderTotals = (items, shippingCharges = 0, discountPercentage = 0) => {
  const subtotal = roundToTwoDecimals(items.reduce((sum, item) => sum + item.totalPrice, 0));
  const totalGst = roundToTwoDecimals(items.reduce((sum, item) => sum + item.gstAmount, 0));
  
  // Calculate discount amount from percentage
  const discountAmount = roundToTwoDecimals((subtotal + totalGst) * (discountPercentage / 100));
  const totalAmount = roundToTwoDecimals(subtotal + totalGst + shippingCharges - discountAmount);
  
  return {
    subtotal,
    totalGst,
    discountAmount,
    totalAmount
  };
};

/**
 * Formats a monetary value for display with proper currency formatting
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency symbol (default: '₹')
 * @param {boolean} showDecimals - Whether to show decimal places (default: true)
 * @returns {string} - The formatted currency string
 */
export const formatCurrency = (amount, currency = '₹', showDecimals = true) => {
  if (showDecimals) {
    return `${currency}${amount.toFixed(2)}`;
  }
  return `${currency}${Math.round(amount).toLocaleString()}`;
};

/**
 * Calculates item totals for an order item
 * @param {Object} item - The order item with quantity, unitPrice, and gstRate
 * @returns {Object} - Object containing totalPrice, gstAmount, and finalPrice
 */
export const calculateItemTotals = (item) => {
  const totalPrice = calculateTotalPrice(item.quantity, item.unitPrice);
  const gstAmount = calculateGstAmount(totalPrice, item.gstRate);
  const finalPrice = calculateFinalPrice(totalPrice, gstAmount);
  
  return {
    totalPrice,
    gstAmount,
    finalPrice
  };
};
