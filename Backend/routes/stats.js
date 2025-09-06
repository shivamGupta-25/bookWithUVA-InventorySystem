import express from 'express';
import connectDB from '../lib/mongodb.js';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/products/stats - Get inventory statistics
router.get('/', async (req, res) => {
  try {
    await connectDB();
    
    const [
      totalProducts,
      inStockProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, stock: { $gt: 10 } }),
      Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ isActive: true, stock: 0 }),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$stock'] } } } }
      ])
    ]);

    const inventoryValue = totalValue.length > 0 ? totalValue[0].total : 0;

    res.json({
      success: true,
      data: {
        totalProducts,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        inventoryValue: Math.round(inventoryValue * 100) / 100
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
