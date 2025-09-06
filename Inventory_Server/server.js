// Load environment variables first
import dotenv from "dotenv";
dotenv.config({ quiet: true,  });

import express from "express";
import cors from "cors";

import connectDB from "./lib/mongodb.js";

// Import routes
import productsRouter from "./routes/products.js";
import productByIdRouter from "./routes/productById.js";
import statsRouter from "./routes/stats.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({
		status: "OK",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// API Routes
app.use("/api/products/stats", statsRouter);
app.use("/api/products", productByIdRouter);
app.use("/api/products", productsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
	console.error("Error:", err);
	res.status(500).json({
		success: false,
		error: "Internal server error",
	});
});

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({
		success: false,
		error: "Route not found",
	});
});

// Start server

try {
	app.listen(PORT, async () => {
		await connectDB();
		console.log("Connected to MongoDB");

		console.log(`Server running on port ${PORT}`);
		console.log(`Health check: http://localhost:${PORT}/health`);
		console.log(`API Base URL: http://localhost:${PORT}/api`);
	});
} catch (error) {
	console.error("Failed to start server:", error);
	process.exit(1);
}
