import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { product_model } from "../models/products";

// GET /api/products/stats - Get inventory statistics
export const statistcs = async (req, res) => {
	try {
		const [
			totalProducts,
			inStockProducts,
			lowStockProducts,
			outOfStockProducts,
			totalValue,
		] = await Promise.all([
			product_model.countDocuments({ isActive: true }),
			product_model.countDocuments({ isActive: true, stock: { $gt: 10 } }),
			product_model.countDocuments({
				isActive: true,
				stock: { $gt: 0, $lte: 10 },
			}),
			product_model.countDocuments({ isActive: true, stock: 0 }),
			product_model.aggregate([
				{ $match: { isActive: true } },
				{
					$group: {
						_id: null,
						total: { $sum: { $multiply: ["$price", "$stock"] } },
					},
				},
			]),
		]);

		const inventoryValue = totalValue.length > 0 ? totalValue[0].total : 0;

		res.json({
			success: true,
			data: {
				totalProducts,
				inStockProducts,
				lowStockProducts,
				outOfStockProducts,
				inventoryValue: Math.round(inventoryValue * 100) / 100,
			},
		});
	} catch (error) {
		console.error("Error fetching stats:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch statistics",
		});
	}
};
