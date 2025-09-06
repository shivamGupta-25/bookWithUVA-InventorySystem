import express from 'express';
import connectDB from '../lib/mongodb.js';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/products/:id - Fetch a single product
router.get('/:id', async (req, res) => {
  try {
    await connectDB();
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Convert _id to string for consistency
    const productWithStringId = {
      ...product.toObject(),
      id: product._id.toString(),
      _id: product._id.toString()
    };

    res.json({
      success: true,
      data: productWithStringId
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// PUT /api/products/:id - Update a product
router.put('/:id', async (req, res) => {
  try {
    await connectDB();
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Convert _id to string for consistency
    const productWithStringId = {
      ...product.toObject(),
      id: product._id.toString(),
      _id: product._id.toString()
    };

    res.json({
      success: true,
      data: productWithStringId,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

// DELETE /api/products/:id - Soft delete a product
router.delete('/:id', async (req, res) => {
  try {
    await connectDB();
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

export default router;
