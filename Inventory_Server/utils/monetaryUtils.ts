/**
 * Monetary Calculation Utilities
 * Provides consistent floating-point precision handling for all monetary calculations
 */

/**
 * Rounds a number to 2 decimal places to avoid floating-point precision issues
 * @param value - The value to round
 * @returns The value rounded to 2 decimal places
 */
export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Calculates the total price for an item (quantity * unit price)
 * @param quantity - The quantity
 * @param unitPrice - The unit price
 * @returns The total price rounded to 2 decimal places
 */
export const calculateTotalPrice = (quantity: number, unitPrice: number): number => {
  return roundToTwoDecimals(quantity * unitPrice);
};

/**
 * Calculates the GST amount for a given total price and GST rate
 * @param totalPrice - The total price before GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns The GST amount rounded to 2 decimal places
 */
export const calculateGstAmount = (totalPrice: number, gstRate: number): number => {
  return roundToTwoDecimals((totalPrice * gstRate) / 100);
};

/**
 * Calculates the final price including GST
 * @param totalPrice - The total price before GST
 * @param gstAmount - The GST amount
 * @returns The final price rounded to 2 decimal places
 */
export const calculateFinalPrice = (totalPrice: number, gstAmount: number): number => {
  return roundToTwoDecimals(totalPrice + gstAmount);
};

/**
 * Calculates order totals with proper rounding
 * @param items - Array of order items with totalPrice and gstAmount
 * @param shippingCharges - Shipping charges (default: 0)
 * @param discountPercentage - Discount percentage (default: 0)
 * @returns Object containing subtotal, totalGst, discountAmount, and totalAmount
 */
export const calculateOrderTotals = (
  items: Array<{ totalPrice: number; gstAmount: number }>,
  shippingCharges: number = 0,
  discountPercentage: number = 0
): { subtotal: number; totalGst: number; discountAmount: number; totalAmount: number } => {
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
 * Calculates item totals for an order item
 * @param item - The order item with quantity, unitPrice, and gstRate
 * @returns Object containing totalPrice, gstAmount, and finalPrice
 */
export const calculateItemTotals = (item: {
  quantity: number;
  unitPrice: number;
  gstRate: number;
}): { totalPrice: number; gstAmount: number; finalPrice: number } => {
  const totalPrice = calculateTotalPrice(item.quantity, item.unitPrice);
  const gstAmount = calculateGstAmount(totalPrice, item.gstRate);
  const finalPrice = calculateFinalPrice(totalPrice, gstAmount);

  return {
    totalPrice,
    gstAmount,
    finalPrice
  };
};
