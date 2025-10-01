import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { product_model } from "../models/products.js";
import distributor_model from "../models/distributor.js";
import mongoose from "mongoose";
import { checkStockLevels } from "../utils/stockAlertUtils.js";

// GET /api/products - Fetch all products with optional filtering
export const get_products = async (req: Request, res: Response) => {
  try {
    // Extract query params with defaults
    const {
      page = "1",
      limit = "50",
      search = "",
      category = "",
      subCategory = "",
      priceMin = "",
      priceMax = "",
      stockStatus = "",
      sortBy = "title",
      sortOrder = "asc",
    } = req.query as Record<string, string>;

    // ✅ Build filter object
    // Include both active and inactive products in the list so the client can dim inactive ones
    const filter: any = {};

    // Text search on title/description (distributor name search would require aggregation)
    if (search) {
      filter.$or = ["title", "description"].map((field) => ({
        [field]: { $regex: search, $options: "i" },
      }));
    }

    // Category filter
    if (category && category !== "All") filter.category = category;

    // Sub-category filter
    if (subCategory && subCategory !== "All") filter.subCategory = subCategory;

    // Price range filter
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

    // Stock status filter
    if (stockStatus && stockStatus !== "all") {
      const stockFilters: Record<
        string,
        FilterQuery<typeof product_model>["stock"]
      > = {
        "in-stock": { $gt: 10 },
        "low-stock": { $gt: 0, $lte: 10 },
        "out-of-stock": 0,
      };
      filter.stock = stockFilters[stockStatus];
    }

    // ✅ Build sort object (cleaner)
    const validSortFields = ["title", "price", "stock", "gst"] as const;
    type SortableFields = (typeof validSortFields)[number];
    const order: 1 | -1 = sortOrder === "desc" ? -1 : 1;

    const sort: Record<SortableFields, 1 | -1> = {
      [validSortFields.includes(sortBy as SortableFields)
        ? (sortBy as SortableFields)
        : "title"]: order,
    } as Record<SortableFields, 1 | -1>;

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // ✅ Execute query in parallel
    const [products, total, categories, subCategories, distributors] =
      await Promise.all([
        product_model
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .populate({ path: "distributor", select: "name phoneNumber address gstinNumber" })
          .lean(),
        product_model.countDocuments(filter),
        // Keep filters based on active products to avoid clutter from old inactive categories
        product_model.distinct("category", { isActive: true }),
        product_model.distinct("subCategory", { isActive: true }),
        distributor_model.find({ isActive: true }).select("name phoneNumber address gstinNumber").sort({ name: 1 }).lean(),
      ]);

    // Normalize _id → string
    const productsWithIds = products.map((p) => ({
      ...p,
      id: p._id.toString(),
      _id: p._id.toString(),
      distributor:
        p.distributor && typeof p.distributor === "object"
          ? ((p as any).distributor as any).name || ""
          : p.distributor,
    }));

    // ✅ Send response
    res.json({
      success: true,
      data: {
        products: productsWithIds,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        filters: {
          categories: ["All", ...categories],
          subCategories: ["All", ...subCategories],
          distributors: distributors.map((d) => d.name).sort(),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
    });
  }
};

// POST /api/products - Create a new product
export const post_products = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Required fields (accept either distributor ObjectId or distributorName string)
    const requiredBase = [
      "title",
      "category",
      "subCategory",
      "price",
      "stock",
      "gst",
    ] as const;

    const missingBase = requiredBase.filter(
      (field) => (req.body as any)[field] === undefined || (req.body as any)[field] === null
    );

    let hasDistributor = Boolean(req.body.distributor) || Boolean(req.body.distributorName);
    const missingFields = [...missingBase, ...(hasDistributor ? [] : ["distributor"] as any)];
    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    // Resolve distributor: accept ObjectId, name in distributor, or distributorName
    let payload = { ...req.body } as any;
    if (payload.distributor && typeof payload.distributor === "string") {
      const val = payload.distributor.trim();
      const isObjectId = mongoose.Types.ObjectId.isValid(val);
      if (!isObjectId) {
        const existing = await distributor_model.findOne({ name: val });
        const dist = existing || (await distributor_model.create({ name: val }));
        payload.distributor = dist._id;
      }
    }
    if (payload.distributorName && !payload.distributor) {
      const name = String(payload.distributorName).trim();
      if (name) {
        const existing = await distributor_model.findOne({ name });
        const dist = existing || (await distributor_model.create({ name }));
        payload.distributor = dist._id;
      }
    }

    // Create product
    const product = new product_model(payload);
    await product.save();

    // Check stock levels for alerts
    await checkStockLevels(product._id.toString(), product.stock);

    // Normalize _id
    const productWithId = {
      ...product.toObject(),
      id: product._id.toString(),
      _id: product._id.toString(),
    };

    res.status(201).json({
      success: true,
      data: productWithId,
      message: "Product created successfully",
    });
  } catch (error: any) {
    console.error("Error creating product:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to create product",
    });
  }
};

// DELETE /api/products - Delete all products
export const delete_products = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { confirmDeleteAll } = req.body;

    if (!confirmDeleteAll) {
      res.status(400).json({
        success: false,
        error: "Confirmation required to delete all products",
      });
      return;
    }

    const result = await product_model.deleteMany({});

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} products`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete all products",
    });
  }
};
