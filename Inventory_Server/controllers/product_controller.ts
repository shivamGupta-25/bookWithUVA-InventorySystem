import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { product_model } from "../models/products";
import distributor_model from "../models/distributor";
import mongoose from "mongoose";

// GET /api/product/:id - Fetch a single product
export const get_product = async (req, res) => {
	try {
		const product = await product_model
			.findById(req.params.id)
			.populate({ path: "distributor", select: "name phoneNumber address gstinNumber" });

		if (!product) {
			return res.status(404).json({
				success: false,
				error: "Product not found",
			});
		}

		// Convert _id to string for consistency
		const productWithStringId = {
			...product.toObject(),
			id: product._id.toString(),
			_id: product._id.toString(),
		};

		res.json({
			success: true,
			data: productWithStringId,
		});
	} catch (error) {
		console.error("Error fetching product:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch product",
		});
	}
};

// PUT /api/product/:id - Update a product
export const put_product = async (req, res) => {
	try {
		// If updating with distributorName or non-ObjectId distributor string, resolve or create distributor
		let updateBody = { ...req.body } as any;
		const tryResolveDistributor = async () => {
			if (updateBody.distributor && typeof updateBody.distributor === "string") {
				const val = updateBody.distributor.trim();
				const isObjectId = mongoose.Types.ObjectId.isValid(val);
				if (!isObjectId) {
					const existing = await distributor_model.findOne({ name: val });
					const dist = existing || (await distributor_model.create({ name: val }));
					updateBody.distributor = dist._id;
				}
			}
			if (updateBody.distributorName && !updateBody.distributor) {
				const name = String(updateBody.distributorName).trim();
				if (name) {
					const existing = await distributor_model.findOne({ name });
					const dist = existing || (await distributor_model.create({ name }));
					updateBody.distributor = dist._id;
				}
			}
		};
		await tryResolveDistributor();

		const product = await product_model.findByIdAndUpdate(
			req.params.id,
			updateBody,
			{
				new: true,
				runValidators: true,
			}
		).populate({ path: "distributor", select: "name phoneNumber address gstinNumber" });

		if (!product) {
			return res.status(404).json({
				success: false,
				error: "Product not found",
			});
		}

		// Convert _id to string for consistency
		const productWithStringId = {
			...product.toObject(),
			id: product._id.toString(),
			_id: product._id.toString(),
		};

		res.json({
			success: true,
			data: productWithStringId,
			message: "Product updated successfully",
		});
	} catch (error) {
		console.error("Error updating product:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map(
				(err: any) => err?.message
			);
			return res.status(400).json({
				success: false,
				error: "Validation failed",
				details: errors,
			});
		}

		res.status(500).json({
			success: false,
			error: "Failed to update product",
		});
	}
};

// DELETE /api/product/:id - Soft delete a product
export const delete_product = async (req, res) => {
	try {
		const product = await product_model.findByIdAndUpdate(
			req.params.id,
			{ isActive: false },
			{ new: true }
		);

		if (!product) {
			return res.status(404).json({
				success: false,
				error: "Product not found",
			});
		}

		res.json({
			success: true,
			message: "Product deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting product:", error);
		res.status(500).json({
			success: false,
			error: "Failed to delete product",
		});
	}
};
