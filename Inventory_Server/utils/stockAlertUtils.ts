import { product_model } from "../models/products.js";
import { settings_model } from "../models/settings.js";
import { stockAlert_model } from "../models/stockAlert.js";

// Type declaration for global io
declare const global: any;

// Check stock levels and create alerts if necessary
export const checkStockLevels = async (productId: string, newStock: number) => {
	try {
		// Get current settings
		const settings = await settings_model.getSettings();
		const { lowStockThreshold, outOfStockThreshold } = settings.stockAlertThresholds;
		const { enableLowStockAlerts, enableOutOfStockAlerts } = settings.notificationSettings;
		
		// Get product details
		const product = await product_model.findById(productId);
		if (!product) return;
		
		let alertData: any = null;
		
		// Check for out of stock
		if (enableOutOfStockAlerts && newStock <= outOfStockThreshold) {
			alertData = {
				product: productId,
				productName: product.title,
				alertType: "out-of-stock",
				currentStock: newStock,
				threshold: outOfStockThreshold,
				message: `Product "${product.title}" is out of stock (${newStock} units remaining)`,
				priority: "critical",
			};
		}
		// Check for low stock (only if not out of stock)
		else if (enableLowStockAlerts && newStock <= lowStockThreshold) {
			alertData = {
				product: productId,
				productName: product.title,
				alertType: "low-stock",
				currentStock: newStock,
				threshold: lowStockThreshold,
				message: `Product "${product.title}" is running low on stock (${newStock} units remaining)`,
				priority: newStock <= (lowStockThreshold / 2) ? "high" : "medium",
			};
		}
		
		// Create alert if needed
		if (alertData) {
			await (stockAlert_model as any).createAlert(alertData);
			
			// Emit real-time notification (if WebSocket is available)
			if (global.io) {
				global.io.emit("stockAlert", {
					type: "new_alert",
					alert: alertData,
					timestamp: new Date(),
					soundSettings: settings.notificationSettings.soundSettings,
				});
			}
		}
		
		// Resolve any existing alerts if stock is now above thresholds
		if (newStock > lowStockThreshold) {
			const alerts = await stockAlert_model.find({
				product: productId,
				status: "active",
			});
			
			for (const alert of alerts) {
				// Check if stock is now above threshold
				if (newStock > alert.threshold) {
					alert.status = "resolved";
					alert.resolvedAt = new Date();
					await alert.save();
				}
			}
		}
		
	} catch (error) {
		console.error("Error checking stock levels:", error);
	}
};

// Check all products for stock alerts (useful for initial setup or bulk checks)
export const checkAllProductsStockLevels = async () => {
	try {
		const products = await product_model.find({ isActive: true });
		
		for (const product of products) {
			await checkStockLevels(product._id.toString(), product.stock);
		}
		
		console.log(`Checked stock levels for ${products.length} products`);
	} catch (error) {
		console.error("Error checking all products stock levels:", error);
	}
};

// Update product model to use configurable thresholds
export const getStockStatus = (stock: number, lowStockThreshold: number) => {
	if (stock === 0) return "out-of-stock";
	if (stock <= lowStockThreshold) return "low-stock";
	return "in-stock";
};
