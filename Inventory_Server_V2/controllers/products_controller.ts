import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { product_model } from "../models/products";

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
		const filter: FilterQuery<typeof product_model> = { isActive: true };

		// Text search
		if (search) {
			filter.$or = ["title", "distributor", "description"].map((field) => ({
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
		const validSortFields = [
			"title",
			"distributor",
			"price",
			"stock",
			"gst",
		] as const;
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
				product_model.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
				product_model.countDocuments(filter),
				product_model.distinct("category", { isActive: true }),
				product_model.distinct("subCategory", { isActive: true }),
				product_model.distinct("distributor", { isActive: true }),
			]);

		// Normalize _id → string
		const productsWithIds = products.map((p) => ({
			...p,
			id: p._id.toString(),
			_id: p._id.toString(),
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
					distributors: distributors.sort(),
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
		// Required fields
		const requiredFields: (keyof typeof product_model.schema.obj)[] = [
			"title",
			"distributor",
			"category",
			"subCategory",
			"price",
			"stock",
			"gst",
		];

		// Check for missing fields
		const missingFields = requiredFields.filter(
			(field) => req.body[field] === undefined || req.body[field] === null
		);

		if (missingFields.length > 0) {
			res.status(400).json({
				success: false,
				error: `Missing required fields: ${missingFields.join(", ")}`,
			});
			return;
		}

		// Create product
		const product = new product_model(req.body);
		await product.save();

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
