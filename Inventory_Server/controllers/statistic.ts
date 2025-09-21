import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { product_model } from "../models/products";
import { settings_model } from "../models/settings";

// GET /api/products/stats - Get inventory statistics
export const statistcs = async (req, res) => {
	try {
		// Get current settings to use dynamic thresholds
		const settings = await (settings_model as any).getSettings();
		const { lowStockThreshold, outOfStockThreshold } = settings.stockAlertThresholds;

		const [
			totalProducts,
			inStockProducts,
			lowStockProducts,
			outOfStockProducts,
			totalValue,
		] = await Promise.all([
			product_model.countDocuments({ isActive: true }),
			product_model.countDocuments({ isActive: true, stock: { $gt: lowStockThreshold } }),
			product_model.countDocuments({
				isActive: true,
				stock: { $gt: outOfStockThreshold, $lte: lowStockThreshold },
			}),
			product_model.countDocuments({ isActive: true, stock: { $lte: outOfStockThreshold } }),
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
