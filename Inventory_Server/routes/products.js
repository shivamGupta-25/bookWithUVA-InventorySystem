import express from "express";
import connectDB from "../lib/mongodb.js";
import Product from "../models/Product.js";

const router = express.Router();

// GET /api/products - Fetch all products with optional filtering
router.get("/", async (req, res) => {
	try {
		await connectDB();

		const {
			page = 1,
			limit = 50,
			search = "",
			category = "",
			subCategory = "",
			priceMin = "",
			priceMax = "",
			stockStatus = "",
			sortBy = "title",
			sortOrder = "asc",
		} = req.query;

		// Build filter object
		const filter = { isActive: true };

		// Text search
		if (search) {
			filter.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ distributor: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}

		// Category filter
		if (category && category !== "All") {
			filter.category = category;
		}

		// Sub-category filter
		if (subCategory && subCategory !== "All") {
			filter.subCategory = subCategory;
		}

		// Price range filter
		if (priceMin || priceMax) {
			filter.price = {};
			if (priceMin) filter.price.$gte = parseFloat(priceMin);
			if (priceMax) filter.price.$lte = parseFloat(priceMax);
		}

		// Stock status filter
		if (stockStatus && stockStatus !== "all") {
			switch (stockStatus) {
				case "in-stock":
					filter.stock = { $gt: 10 };
					break;
				case "low-stock":
					filter.stock = { $gt: 0, $lte: 10 };
					break;
				case "out-of-stock":
					filter.stock = 0;
					break;
			}
		}

		// Build sort object
		let sort = {};
		switch (sortBy) {
			case "title":
				sort.title = sortOrder === "desc" ? -1 : 1;
				break;
			case "distributor":
				sort.distributor = sortOrder === "desc" ? -1 : 1;
				break;
			case "price":
				sort.price = sortOrder === "desc" ? -1 : 1;
				break;
			case "stock":
				sort.stock = sortOrder === "desc" ? -1 : 1;
				break;
			case "gst":
				sort.gst = sortOrder === "desc" ? -1 : 1;
				break;
			default:
				sort.title = 1;
		}

		// Calculate pagination
		const skip = (page - 1) * limit;

		// Execute query
		const [products, total] = await Promise.all([
			Product.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
			Product.countDocuments(filter),
		]);

		// Convert _id to string for proper React key usage
		const productsWithStringIds = products.map((product) => ({
			...product,
			id: product._id.toString(),
			_id: product._id.toString(),
		}));

		// Get unique categories, sub-categories, and distributors for filters
		const [categories, subCategories, distributors] = await Promise.all([
			Product.distinct("category", { isActive: true }),
			Product.distinct("subCategory", { isActive: true }),
			Product.distinct("distributor", { isActive: true }),
		]);

		res.json({
			success: true,
			data: {
				products: productsWithStringIds,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					pages: Math.ceil(total / limit),
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
});

// POST /api/products - Create a new product
router.post("/", async (req, res) => {
	try {
		await connectDB();

		// Validate required fields
		const requiredFields = [
			"title",
			"distributor",
			"category",
			"subCategory",
			"price",
			"stock",
			"gst",
		];
		const missingFields = requiredFields.filter(
			(field) => !req.body[field] && req.body[field] !== 0
		);

		if (missingFields.length > 0) {
			return res.status(400).json({
				success: false,
				error: `Missing required fields: ${missingFields.join(", ")}`,
			});
		}

		const product = new Product(req.body);
		await product.save();

		// Convert _id to string for consistency
		const productWithStringId = {
			...product.toObject(),
			id: product._id.toString(),
			_id: product._id.toString(),
		};

		res.status(201).json({
			success: true,
			data: productWithStringId,
			message: "Product created successfully",
		});
	} catch (error) {
		console.error("Error creating product:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err) => err.message);
			return res.status(400).json({
				success: false,
				error: "Validation failed",
				details: errors,
			});
		}

		res.status(500).json({
			success: false,
			error: "Failed to create product",
		});
	}
});

// DELETE /api/products - Delete all products
router.delete("/", async (req, res) => {
	try {
		await connectDB();

		// Get confirmation from request body
		if (!req.body.confirmDeleteAll) {
			return res.status(400).json({
				success: false,
				error: "Confirmation required to delete all products",
			});
		}

		// Delete all products
		const result = await Product.deleteMany({});

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
});

export default router;
