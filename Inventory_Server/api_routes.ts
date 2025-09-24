import express from "express";
import {
	delete_products,
	get_products,
	post_products,
} from "./controllers/products_controller.js";
import {
	delete_product,
	get_product,
	put_product,
} from "./controllers/product_controller.js";
import { statistcs, get_inventory_aging_stats } from "./controllers/statistic.js";
import {
    get_distributors,
    post_distributor,
    put_distributor,
    delete_distributor,
    delete_all_distributors,
} from "./controllers/distributors_controller.js";
import {
	get_orders,
	get_order,
	post_orders,
	put_order,
	delete_order,
	delete_all_orders,
	get_order_stats,
	get_delivery_stats,
} from "./controllers/orders_controller.js";
import {
	register,
	login,
	logout,
	refreshToken,
	getProfile,
	updateProfile,
	changePassword,
	verifyTokenEndpoint,
	forgotPassword,
	resetPasswordWithOTP,
} from "./controllers/auth_controller.js";
import {
	getAllUsers,
	getUserById,
	updateUser,
	deleteUser,
	toggleUserStatus,
	getUserStats,
} from "./controllers/user_controller.js";
import {
	getActivityLogs,
	getActivityLogById,
	getUserActivityLogs,
	getActivityStats,
	deleteOldActivityLogs,
} from "./controllers/activityLog_controller.js";
import {
	getSettings,
	updateSettings,
	getStockAlerts,
	acknowledgeAlert,
	resolveAlert,
	getAlertStats,
} from "./controllers/settings_controller.js";
import { authenticate, authorize, logActivity } from "./utils/authUtils.js";
import { UserRole } from "./models/user.js";
import { ActivityType } from "./models/activityLog.js";

export const api_routes = express.Router();
export default api_routes;

// Authentication routes (public)
api_routes.post("/auth/login", login);
api_routes.post("/auth/refresh", refreshToken);
api_routes.post("/auth/forgot-password", forgotPassword);
api_routes.post("/auth/reset-password", resetPasswordWithOTP);

// Protected routes (require authentication)
api_routes.use(authenticate);

// Auth routes (authenticated)
api_routes.post("/auth/logout", logout);
api_routes.get("/auth/profile", getProfile);
api_routes.put("/auth/profile", updateProfile);
api_routes.put("/auth/change-password", changePassword);
api_routes.get("/auth/verify", verifyTokenEndpoint);

// User management routes (Admin only)
api_routes.post("/users", authorize(UserRole.ADMIN), register);
api_routes.get("/users", authorize(UserRole.ADMIN), getAllUsers);
api_routes.get("/users/stats", authorize(UserRole.ADMIN), getUserStats);
api_routes.get("/users/:id", authorize(UserRole.ADMIN), getUserById);
api_routes.put("/users/:id", authorize(UserRole.ADMIN), updateUser);
api_routes.delete("/users/:id", authorize(UserRole.ADMIN), deleteUser);
api_routes.put("/users/:id/toggle-status", authorize(UserRole.ADMIN), toggleUserStatus);

// Activity logs routes (Admin only)
api_routes.get("/activity-logs", authorize(UserRole.ADMIN), getActivityLogs);
api_routes.get("/activity-logs/stats", authorize(UserRole.ADMIN), getActivityStats);
api_routes.get("/activity-logs/:id", authorize(UserRole.ADMIN), getActivityLogById);
api_routes.get("/users/:userId/activity-logs", authorize(UserRole.ADMIN), getUserActivityLogs);
api_routes.delete("/activity-logs/cleanup", authorize(UserRole.ADMIN), deleteOldActivityLogs);

// Products routes (protected with role-based access)
api_routes.get("/products", get_products);
api_routes.post("/products", authorize(UserRole.ADMIN, UserRole.MANAGER), logActivity(ActivityType.CREATE, "Created new product", "Product"), post_products);
api_routes.delete("/products", authorize(UserRole.ADMIN), logActivity(ActivityType.DELETE, "Deleted all products", "Products"), delete_products);

api_routes.get("/product/:id", get_product);
api_routes.put("/product/:id", authorize(UserRole.ADMIN, UserRole.MANAGER), logActivity(ActivityType.UPDATE, "Updated product", "Product"), put_product);
api_routes.delete("/product/:id", authorize(UserRole.ADMIN, UserRole.MANAGER), logActivity(ActivityType.DELETE, "Deleted product", "Product"), delete_product);

api_routes.get("/products/stats", statistcs);
api_routes.get("/products/aging-stats", get_inventory_aging_stats);

// Distributors routes (protected with role-based access)
api_routes.get("/distributors", get_distributors);
api_routes.post("/distributors", authorize(UserRole.ADMIN, UserRole.MANAGER), logActivity(ActivityType.CREATE, "Created new distributor", "Distributor"), post_distributor);
api_routes.put("/distributor/:id", authorize(UserRole.ADMIN, UserRole.MANAGER), logActivity(ActivityType.UPDATE, "Updated distributor", "Distributor"), put_distributor);
api_routes.delete("/distributor/:id", authorize(UserRole.ADMIN, UserRole.MANAGER), logActivity(ActivityType.DELETE, "Deleted distributor", "Distributor"), delete_distributor);
api_routes.delete("/distributors", authorize(UserRole.ADMIN), logActivity(ActivityType.DELETE, "Deleted all distributors", "Distributors"), delete_all_distributors);

// Orders routes (protected with role-based access)
api_routes.get("/orders", get_orders);
api_routes.get("/order/:id", get_order);
api_routes.post("/orders", authorize(UserRole.ADMIN, UserRole.MANAGER), logActivity(ActivityType.CREATE, "Created new order", "Order"), post_orders);
api_routes.put("/order/:id", authorize(UserRole.ADMIN, UserRole.MANAGER), logActivity(ActivityType.UPDATE, "Updated order", "Order"), put_order);
api_routes.delete("/order/:id", authorize(UserRole.ADMIN, UserRole.MANAGER), logActivity(ActivityType.DELETE, "Deleted order", "Order"), delete_order);
api_routes.delete("/orders", authorize(UserRole.ADMIN), logActivity(ActivityType.DELETE, "Deleted all orders", "Orders"), delete_all_orders);
api_routes.get("/orders/stats", get_order_stats);
api_routes.get("/orders/delivery-stats", get_delivery_stats);

// Settings routes (Admin only)
api_routes.get("/settings", authorize(UserRole.ADMIN), getSettings);
api_routes.put("/settings", authorize(UserRole.ADMIN), logActivity(ActivityType.UPDATE, "Updated system settings", "Settings"), updateSettings);

// Stock alerts routes
api_routes.get("/settings/alerts", getStockAlerts); // All authenticated users can view alerts
api_routes.get("/settings/alerts/stats", authorize(UserRole.ADMIN, UserRole.MANAGER), getAlertStats);
api_routes.put("/settings/alerts/:id/acknowledge", authorize(UserRole.ADMIN, UserRole.MANAGER), acknowledgeAlert);
api_routes.put("/settings/alerts/:id/resolve", authorize(UserRole.ADMIN, UserRole.MANAGER), resolveAlert);
