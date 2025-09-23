import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { product_model } from "../models/products";
import { settings_model } from "../models/settings";
import { order_model, OrderStatus } from "../models/order";

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
			categoryStats,
			distributorStats,
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
			// Category distribution
			product_model.aggregate([
				{ $match: { isActive: true } },
				{
					$group: {
						_id: "$category",
						count: { $sum: 1 },
						totalValue: { $sum: { $multiply: ["$price", "$stock"] } }
					}
				},
				{ $sort: { count: -1 } },
				{ $limit: 10 }
			]),
			// Distributor distribution
			product_model.aggregate([
				{ $match: { isActive: true } },
				{
					$lookup: {
						from: "distributors",
						localField: "distributor",
						foreignField: "_id",
						as: "distributorInfo"
					}
				},
				{
					$group: {
						_id: "$distributor",
						distributorName: { $first: { $arrayElemAt: ["$distributorInfo.name", 0] } },
						count: { $sum: 1 },
						totalValue: { $sum: { $multiply: ["$price", "$stock"] } }
					}
				},
				{ $sort: { count: -1 } },
				{ $limit: 10 }
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
				inventoryValue: Math.round(inventoryValue * 100) / 100,
				categoryStats: categoryStats.map(cat => ({
					...cat,
					id: cat._id,
					_id: cat._id
				})),
				distributorStats: distributorStats.map(dist => ({
					...dist,
					id: dist._id,
					_id: dist._id
				}))
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

// GET /api/products/aging-stats - Inventory aging and dead stock analytics
export const get_inventory_aging_stats = async (req: Request, res: Response) => {
    try {
        const { thresholdDays = "60", bucket30 = "30", bucket60 = "60", bucket90 = "90" } = req.query as Record<string, string>;
        const threshold = Number(thresholdDays) || 60;
        const b30 = Number(bucket30) || 30;
        const b60 = Number(bucket60) || 60;
        const b90 = Number(bucket90) || 90;

        // Aggregate per-product last sold date using orders (DELIVERED only)
        const lastSoldByProduct = await order_model.aggregate([
            { $match: { isActive: true, status: OrderStatus.DELIVERED } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    lastSoldAt: { $max: "$orderDate" },
                    totalSoldQty: { $sum: "$items.quantity" },
                }
            }
        ]);

        // Map for quick lookup
        const lastSoldMap = new Map<string, { lastSoldAt: Date; totalSoldQty: number }>();
        for (const row of lastSoldByProduct) {
            lastSoldMap.set(String(row._id), { lastSoldAt: row.lastSoldAt, totalSoldQty: row.totalSoldQty });
        }

        const products = await product_model.find({ isActive: true }).select("title stock createdAt price").lean();

        const now = Date.now();
        const details: any[] = [];
        let sumAgingDays = 0;
        let countWithAging = 0;

        let bucket_0_30 = 0;
        let bucket_31_60 = 0;
        let bucket_61_90 = 0;
        let bucket_91_plus = 0;
        let bucket_never = 0;
        let deadStockCount = 0;

        for (const p of products) {
            const info = lastSoldMap.get(String(p._id));
            const lastSoldAt: Date | null = info?.lastSoldAt || null;
            const baseDate = lastSoldAt || (p as any).createdAt;
            const daysSince = Math.floor((now - new Date(baseDate).getTime()) / (1000 * 60 * 60 * 24));

            // Buckets
            if (!lastSoldAt) {
                bucket_never += 1;
            } else if (daysSince <= b30) {
                bucket_0_30 += 1;
            } else if (daysSince <= b60) {
                bucket_31_60 += 1;
            } else if (daysSince <= b90) {
                bucket_61_90 += 1;
            } else {
                bucket_91_plus += 1;
            }

            if (p.stock > 0) {
                const isDead = !lastSoldAt || daysSince > threshold;
                if (isDead) deadStockCount += 1;
            }

            if (p.stock > 0) {
                sumAgingDays += Math.max(daysSince, 0);
                countWithAging += 1;
            }

            details.push({
                id: String(p._id),
                title: p.title,
                stock: p.stock,
                lastSoldAt,
                daysSinceLastSale: lastSoldAt ? daysSince : null,
                neverSold: !lastSoldAt,
            });
        }

        // Top dead stock products (limit 20)
        const deadStockProducts = details
            .filter(d => d.stock > 0 && (d.neverSold || (d.daysSinceLastSale ?? 0) > threshold))
            .sort((a, b) => {
                const aDays = a.neverSold ? Number.POSITIVE_INFINITY : a.daysSinceLastSale || 0;
                const bDays = b.neverSold ? Number.POSITIVE_INFINITY : b.daysSinceLastSale || 0;
                return bDays - aDays;
            })
            .slice(0, 20);

        const averageDaysSinceLastSale = countWithAging > 0 ? Math.round((sumAgingDays / countWithAging) * 10) / 10 : 0;

        res.json({
            success: true,
            data: {
                agingBuckets: [
                    { label: `0-${b30} days`, count: bucket_0_30 },
                    { label: `${b30 + 1}-${b60} days`, count: bucket_31_60 },
                    { label: `${b60 + 1}-${b90} days`, count: bucket_61_90 },
                    { label: `${b90 + 1}+ days`, count: bucket_91_plus },
                    { label: "Never sold", count: bucket_never },
                ],
                deadStockCount,
                averageDaysSinceLastSale,
                deadStockProducts,
            }
        });
    } catch (error) {
        console.error("Error fetching inventory aging stats:", error);
        res.status(500).json({ success: false, error: "Failed to fetch inventory aging statistics" });
    }
};
