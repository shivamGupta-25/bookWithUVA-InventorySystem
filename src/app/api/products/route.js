import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

// GET /api/products - Fetch all products with optional filtering
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const subCategory = searchParams.get('subCategory') || '';
    const priceMin = searchParams.get('priceMin') || '';
    const priceMax = searchParams.get('priceMax') || '';
    const stockStatus = searchParams.get('stockStatus') || '';
    const sortBy = searchParams.get('sortBy') || 'title';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build filter object
    const filter = { isActive: true };

    // Text search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { distributor: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Sub-category filter
    if (subCategory && subCategory !== 'All') {
      filter.subCategory = subCategory;
    }

    // Price range filter
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = parseFloat(priceMin);
      if (priceMax) filter.price.$lte = parseFloat(priceMax);
    }

    // Stock status filter
    if (stockStatus && stockStatus !== 'all') {
      switch (stockStatus) {
        case 'in-stock':
          filter.stock = { $gt: 10 };
          break;
        case 'low-stock':
          filter.stock = { $gt: 0, $lte: 10 };
          break;
        case 'out-of-stock':
          filter.stock = 0;
          break;
      }
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'title':
        sort.title = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'distributor':
        sort.distributor = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'price':
        sort.price = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'stock':
        sort.stock = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'gst':
        sort.gst = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sort.title = 1;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Convert _id to string for proper React key usage
    const productsWithStringIds = products.map(product => ({
      ...product,
      id: product._id.toString(),
      _id: product._id.toString()
    }));

    // Get unique categories, sub-categories, and distributors for filters
    const [categories, subCategories, distributors] = await Promise.all([
      Product.distinct('category', { isActive: true }),
      Product.distinct('subCategory', { isActive: true }),
      Product.distinct('distributor', { isActive: true })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithStringIds,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          categories: ['All', ...categories],
          subCategories: ['All', ...subCategories],
          distributors: distributors.sort()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'distributor', 'category', 'subCategory', 'price', 'stock', 'gst'];
    const missingFields = requiredFields.filter(field => !body[field] && body[field] !== 0);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }


    const product = new Product(body);
    await product.save();

    // Convert _id to string for consistency
    const productWithStringId = {
      ...product.toObject(),
      id: product._id.toString(),
      _id: product._id.toString()
    };

    return NextResponse.json({
      success: true,
      data: productWithStringId,
      message: 'Product created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products - Delete all products
export async function DELETE(request) {
  try {
    await connectDB();
    
    // Get confirmation from request body
    const body = await request.json();
    
    if (!body.confirmDeleteAll) {
      return NextResponse.json(
        { success: false, error: 'Confirmation required to delete all products' },
        { status: 400 }
      );
    }

    // Delete all products
    const result = await Product.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} products`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting all products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete all products' },
      { status: 500 }
    );
  }
}
