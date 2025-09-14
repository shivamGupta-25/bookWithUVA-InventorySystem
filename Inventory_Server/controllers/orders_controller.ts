import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { order_model, OrderStatus } from "../models/order";
import { product_model } from "../models/products";
import mongoose from "mongoose";
import { calculateItemTotals, calculateOrderTotals } from "../utils/monetaryUtils";

// GET /api/orders - Fetch all orders with optional filtering
export const get_orders = async (req: Request, res: Response) => {
	try {
		// Extract query params with defaults
		const {
			page = "1",
			limit = "50",
			search = "",
			status = "",
			paymentStatus = "",
			dateFrom = "",
			dateTo = "",
			sortBy = "orderDate",
			sortOrder = "desc",
		} = req.query as Record<string, string>;

		// Build filter object
		const filter: any = { isActive: true };

		// Text search on customer name, email, or order number
		if (search) {
			filter.$or = [
				{ "customer.name": { $regex: search, $options: "i" } },
				{ "customer.email": { $regex: search, $options: "i" } },
				{ orderNumber: { $regex: search, $options: "i" } },
			];
		}

		// Status filter
		if (status && status !== "all") {
			filter.status = status;
		}

		// Payment status filter
		if (paymentStatus && paymentStatus !== "all") {
			filter.paymentStatus = paymentStatus;
		}

		// Date range filter
		if (dateFrom || dateTo) {
			filter.orderDate = {};
			if (dateFrom) {
				filter.orderDate.$gte = new Date(dateFrom);
			}
			if (dateTo) {
				filter.orderDate.$lte = new Date(dateTo);
			}
		}

		// Build sort object
		const validSortFields = ["orderDate", "totalAmount", "status", "createdAt"] as const;
		type SortableFields = (typeof validSortFields)[number];
		const order: 1 | -1 = sortOrder === "asc" ? 1 : -1;

		const sort: Record<SortableFields, 1 | -1> = {
			[validSortFields.includes(sortBy as SortableFields)
				? (sortBy as SortableFields)
				: "orderDate"]: order,
		} as Record<SortableFields, 1 | -1>;

		// Pagination
		const pageNum = Number(page);
		const limitNum = Number(limit);
		const skip = (pageNum - 1) * limitNum;

		// Execute query in parallel
		const [orders, total, statusCounts, paymentStatusCounts] = await Promise.all([
			order_model
				.find(filter)
				.sort(sort)
				.skip(skip)
				.limit(limitNum)
				.populate({
					path: "items.product",
					select: "title category subCategory",
				})
				.lean(),
			order_model.countDocuments(filter),
			order_model.aggregate([
				{ $match: { isActive: true } },
				{ $group: { _id: "$status", count: { $sum: 1 } } },
			]),
			order_model.aggregate([
				{ $match: { isActive: true } },
				{ $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
			]),
		]);

		// Normalize _id → string
		const ordersWithIds = orders.map((order) => ({
			...order,
			id: order._id.toString(),
			_id: order._id.toString(),
		}));

		// Format status counts
		const statusCountsMap = statusCounts.reduce((acc, item) => {
			acc[item._id] = item.count;
			return acc;
		}, {} as Record<string, number>);

		const paymentStatusCountsMap = paymentStatusCounts.reduce((acc, item) => {
			acc[item._id] = item.count;
			return acc;
		}, {} as Record<string, number>);

		// Send response
		res.json({
			success: true,
			data: {
				orders: ordersWithIds,
				pagination: {
					page: pageNum,
					limit: limitNum,
					total,
					pages: Math.ceil(total / limitNum),
				},
				filters: {
					statusCounts: statusCountsMap,
					paymentStatusCounts: paymentStatusCountsMap,
				},
			},
		});
	} catch (error) {
		console.error("Error fetching orders:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch orders",
		});
	}
};

// GET /api/order/:id - Fetch single order
export const get_order = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({
				success: false,
				error: "Invalid order ID",
			});
		}

		const order = await order_model
			.findById(id)
			.populate({
				path: "items.product",
				select: "title category subCategory description",
			})
			.lean();

		if (!order) {
			return res.status(404).json({
				success: false,
				error: "Order not found",
			});
		}

		// Normalize _id → string
		const orderWithId = {
			...order,
			id: order._id.toString(),
			_id: order._id.toString(),
		};

		res.json({
			success: true,
			data: orderWithId,
		});
	} catch (error) {
		console.error("Error fetching order:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch order",
		});
	}
};

// POST /api/orders - Create a new order
export const post_orders = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			customer,
			items,
			paymentMethod,
			shippingCharges = 0,
			discount = 0,
			notes = "",
			expectedDeliveryDate,
		} = req.body;

		// Validate required fields
		if (!customer || !customer.name) {
			res.status(400).json({
				success: false,
				error: "Customer name is required",
			});
			return;
		}

		if (!items || !Array.isArray(items) || items.length === 0) {
			res.status(400).json({
				success: false,
				error: "Order items are required",
			});
			return;
		}

		if (!paymentMethod) {
			res.status(400).json({
				success: false,
				error: "Payment method is required",
			});
			return;
		}

		// Validate and process items with atomic stock checking
		const processedItems: any[] = [];
		const productUpdates: any[] = [];
		
		// First, validate all items and prepare stock updates
		for (const item of items) {
			if (!item.product || !item.quantity) {
				res.status(400).json({
					success: false,
					error: "Product and quantity are required for each item",
				});
				return;
			}

			// Get product details with optimistic locking
			const product = await product_model.findById(item.product);
			if (!product) {
				res.status(400).json({
					success: false,
					error: `Product with ID ${item.product} not found`,
				});
				return;
			}

			// Check stock availability
			if (product.stock < item.quantity) {
				res.status(400).json({
					success: false,
					error: `Insufficient stock for product "${product.title}". Available: ${product.stock}, Requested: ${item.quantity}`,
				});
				return;
			}

			// Use provided values if available, otherwise calculate using utility functions
			const unitPrice = item.unitPrice || product.price;
			const gstRate = item.gstRate || product.gst;
			
			let totalPrice, gstAmount, finalPrice;
			if (item.totalPrice && item.gstAmount && item.finalPrice) {
				// Use provided values
				totalPrice = item.totalPrice;
				gstAmount = item.gstAmount;
				finalPrice = item.finalPrice;
			} else {
				// Calculate using utility functions
				const totals = calculateItemTotals({
					quantity: item.quantity,
					unitPrice: unitPrice,
					gstRate: gstRate
				});
				totalPrice = totals.totalPrice;
				gstAmount = totals.gstAmount;
				finalPrice = totals.finalPrice;
			}

			processedItems.push({
				product: product._id,
				productName: item.productName || product.title,
				quantity: item.quantity,
				unitPrice,
				totalPrice,
				gstRate,
				gstAmount,
				finalPrice,
			});

			// Prepare stock update
			productUpdates.push({
				productId: product._id,
				quantity: item.quantity,
				currentStock: product.stock
			});
		}

		// Calculate totals using utility functions
		const orderTotals = calculateOrderTotals(processedItems, Number(shippingCharges) || 0, Number(discount) || 0);
		const calculatedSubtotal = orderTotals.subtotal;
		const calculatedTotalGst = orderTotals.totalGst;
		const calculatedTotalAmount = orderTotals.totalAmount;

		// Generate order number as backup
		const timestamp = Date.now().toString().slice(-6);
		const orderNumber = `ORD${timestamp}`;

		// Create order and update stock atomically
		const orderData = {
			customer,
			items: processedItems,
			paymentMethod,
			shippingCharges: Number(shippingCharges) || 0,
			discount: Number(discount) || 0,
			notes: notes || "",
			expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
			subtotal: calculatedSubtotal,
			totalGst: calculatedTotalGst,
			totalAmount: calculatedTotalAmount,
			orderNumber: orderNumber, // Provide order number explicitly
		};

		const order = new order_model(orderData);
		
		// Use a transaction to ensure atomicity
		const session = await mongoose.startSession();
		try {
			await session.withTransaction(async () => {
				// Save the order
				await order.save({ session });

				// Update product stock with atomic operations
				for (const update of productUpdates) {
					const result = await product_model.findByIdAndUpdate(
						update.productId,
						{ 
							$inc: { stock: -update.quantity },
							$set: { updatedAt: new Date() }
						},
						{ 
							session,
							// Ensure we don't go below 0 stock
							runValidators: true
						}
					);

					// Double-check that stock didn't go negative
					if (result && result.stock - update.quantity < 0) {
						throw new Error(`Insufficient stock for product ${update.productId}. Stock would go negative.`);
					}
				}
			});
		} catch (error) {
			// If transaction fails, the order won't be saved and stock won't be updated
			console.error("Transaction failed:", error);
			throw error;
		} finally {
			await session.endSession();
		}

		// Populate the created order
		const populatedOrder = await order_model
			.findById(order._id)
			.populate({
				path: "items.product",
				select: "title category subCategory",
			})
			.lean();

		if (!populatedOrder) {
			res.status(500).json({
				success: false,
				error: "Failed to retrieve created order",
			});
			return;
		}

		// Normalize _id
		const orderWithId = {
			...populatedOrder,
			id: populatedOrder._id.toString(),
			_id: populatedOrder._id.toString(),
		};

		res.status(201).json({
			success: true,
			data: orderWithId,
			message: "Order created successfully",
		});
	} catch (error: any) {
		console.error("Error creating order:", error);

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
			error: "Failed to create order",
		});
	}
};

// PUT /api/order/:id - Update order
export const put_order = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const updateData = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({
				success: false,
				error: "Invalid order ID",
			});
			return;
		}

		// Check if order exists
		const existingOrder = await order_model.findById(id);
		if (!existingOrder) {
			res.status(404).json({
				success: false,
				error: "Order not found",
			});
			return;
		}

		// Handle status changes
		let statusChangedToCancelled = false;
		if (updateData.status && updateData.status !== existingOrder.status) {
			const now = new Date();
			const oldStatus = existingOrder.status;
			
			switch (updateData.status) {
				case OrderStatus.DELIVERED:
					updateData.deliveredDate = now;
					break;
				case OrderStatus.CANCELLED:
					updateData.cancelledDate = now;
					statusChangedToCancelled = true;
					// Restore stock for cancelled orders
					for (const item of existingOrder.items) {
						await product_model.findByIdAndUpdate(item.product, {
							$inc: { stock: item.quantity },
						});
					}
					break;
				case OrderStatus.PENDING:
					// If transitioning back to pending from a completed state, clear dates but don't restore stock
					if (oldStatus === OrderStatus.DELIVERED || oldStatus === OrderStatus.CANCELLED) {
						// Clear delivery/cancellation dates
						updateData.deliveredDate = undefined;
						updateData.cancelledDate = undefined;
						updateData.cancellationReason = undefined;
						
						// Note: We don't restore stock when moving from delivered to pending
						// because the items were actually delivered to the customer.
						// Stock should only be restored when orders are cancelled or deleted.
					}
					break;
				case OrderStatus.PROCESSING:
				case OrderStatus.SHIPPED:
					// If transitioning from delivered/cancelled back to processing/shipped, clear dates but don't restore stock
					if (oldStatus === OrderStatus.DELIVERED || oldStatus === OrderStatus.CANCELLED) {
						// Clear delivery/cancellation dates
						updateData.deliveredDate = undefined;
						updateData.cancelledDate = undefined;
						updateData.cancellationReason = undefined;
						
						// Note: We don't restore stock when moving from delivered to processing/shipped
						// because the items were actually delivered to the customer.
						// Stock should only be restored when orders are cancelled or deleted.
					}
					break;
			}
			
			// Note: Removed duplicate stock restoration logic
			// Stock should only be restored when orders are cancelled or deleted, not when changing status
		}

		// Handle refund
		if (updateData.paymentStatus === "refunded" && existingOrder.paymentStatus !== "refunded") {
			updateData.refundDate = new Date();
			updateData.refundAmount = updateData.refundAmount || existingOrder.totalAmount;
		}

		// Handle expected delivery date conversion
		if (updateData.expectedDeliveryDate) {
			updateData.expectedDeliveryDate = new Date(updateData.expectedDeliveryDate);
		}

		// Validate customer data if provided
		if (updateData.customer) {
			if (updateData.customer.name && updateData.customer.name.trim().length === 0) {
				res.status(400).json({
					success: false,
					error: "Customer name cannot be empty",
				});
				return;
			}
		}

		// Validate payment method if provided
		if (updateData.paymentMethod) {
			const validPaymentMethods = ["cash", "card", "upi", "netbanking", "wallet"];
			if (!validPaymentMethods.includes(updateData.paymentMethod)) {
				res.status(400).json({
					success: false,
					error: "Invalid payment method",
				});
				return;
			}
		}

		// Validate numeric fields
		if (updateData.shippingCharges !== undefined) {
			if (updateData.shippingCharges < 0) {
				res.status(400).json({
					success: false,
					error: "Shipping charges cannot be negative",
				});
				return;
			}
		}

		if (updateData.discount !== undefined) {
			if (updateData.discount < 0) {
				res.status(400).json({
					success: false,
					error: "Discount percentage cannot be negative",
				});
				return;
			}
			if (updateData.discount > 100) {
				res.status(400).json({
					success: false,
					error: "Discount percentage cannot exceed 100%",
				});
				return;
			}
		}

		// Handle items update - only validate stock if items are actually being modified
		// Check if items are actually different from existing order
		let itemsChanged = false;
		if (updateData.items) {
			if (!Array.isArray(updateData.items) || updateData.items.length === 0) {
				res.status(400).json({
					success: false,
					error: "Order must have at least one item",
				});
				return;
			}

			// Check if items array is different from existing order
			if (updateData.items.length !== existingOrder.items.length) {
				itemsChanged = true;
			} else {
				// Compare each item to see if anything changed
				for (let i = 0; i < updateData.items.length; i++) {
					const newItem = updateData.items[i];
					const existingItem = existingOrder.items[i];
					
					if (!existingItem || 
						newItem.product.toString() !== existingItem.product.toString() ||
						newItem.quantity !== existingItem.quantity ||
						newItem.unitPrice !== existingItem.unitPrice ||
						newItem.gstRate !== existingItem.gstRate) {
						itemsChanged = true;
						break;
					}
				}
			}

			// Only validate stock if items are actually being modified
			if (itemsChanged) {
				// Get fresh order data to ensure we have the latest state
				const currentOrder = await order_model.findById(id);
				if (!currentOrder) {
					res.status(404).json({
						success: false,
						error: "Order not found",
					});
					return;
				}

				// Validate each item
				for (const item of updateData.items) {
					if (!item.product || !item.quantity || item.quantity < 1) {
						res.status(400).json({
							success: false,
							error: "Each item must have a valid product and quantity",
						});
						return;
					}

					// Extract product ID from item (handle both string and object formats)
					const itemProductId = typeof item.product === 'string' 
						? item.product 
						: item.product._id || item.product.id;

					// Check if product exists
					const product = await product_model.findById(itemProductId);
					if (!product) {
						res.status(400).json({
							success: false,
							error: `Product with ID ${itemProductId} not found`,
						});
						return;
					}
					
					// Find existing item to calculate net stock change
					const existingItem = currentOrder.items.find(existingItem => 
						existingItem.product.toString() === itemProductId.toString()
					);
					
					// Calculate net stock change (positive = need more stock, negative = will free up stock)
					const netStockChange = item.quantity - (existingItem ? existingItem.quantity : 0);
					
					// For quantity reductions (netStockChange <= 0), always allow
					if (netStockChange <= 0) {
						// Don't use continue, just let it fall through
					} else {
						// For quantity increases (netStockChange > 0), check if we have enough stock
						
						// Calculate available stock considering current order's impact
						// If this is a pending order, the stock is already reserved, so we need to add it back
						const availableStock = currentOrder.status === OrderStatus.PENDING 
							? product.stock + (existingItem ? existingItem.quantity : 0)
							: product.stock;
						
						if (availableStock < netStockChange) {
							res.status(400).json({
								success: false,
								error: `Insufficient stock for product "${product.title}". Available: ${availableStock}, Required: ${netStockChange}`,
							});
							return;
						}
					}
				}
			}
		}

		// Handle stock updates for items changes - only if items actually changed and not cancelling
		if (updateData.items && itemsChanged && !statusChangedToCancelled) {
			// Get fresh order data for stock updates
			const currentOrderForStock = await order_model.findById(id);
			if (!currentOrderForStock) {
				res.status(404).json({
					success: false,
					error: "Order not found",
				});
				return;
			}

			// Use a transaction to ensure atomicity
			const session = await mongoose.startSession();
			try {
				await session.withTransaction(async () => {
					// For orders that are not pending, we need to restore stock first before making changes
					if (currentOrderForStock.status !== OrderStatus.PENDING) {
						// Restore all stock from the existing order
						for (const existingItem of currentOrderForStock.items) {
							await product_model.findByIdAndUpdate(
								existingItem.product,
								{ $inc: { stock: existingItem.quantity } },
								{ session }
							);
						}
					}

					// Now handle the new items (this works for both pending and non-pending orders)
					// Restore stock for removed items (only for pending orders, already handled above for others)
					if (currentOrderForStock.status === OrderStatus.PENDING) {
						for (const existingItem of currentOrderForStock.items) {
							const stillExists = updateData.items.find(item => {
								const itemProductId = typeof item.product === 'string' 
									? item.product 
									: item.product._id || item.product.id;
								return itemProductId.toString() === existingItem.product.toString();
							});
							if (!stillExists) {
								await product_model.findByIdAndUpdate(
									existingItem.product,
									{ $inc: { stock: existingItem.quantity } },
									{ session }
								);
							}
						}
					}

					// Update stock for modified items (only for pending orders, already handled above for others)
					if (currentOrderForStock.status === OrderStatus.PENDING) {
						for (const item of updateData.items) {
							// Extract product ID from item (handle both string and object formats)
							const itemProductId = typeof item.product === 'string' 
								? item.product 
								: item.product._id || item.product.id;
								
							const existingItem = currentOrderForStock.items.find(existingItem => 
								existingItem.product.toString() === itemProductId.toString()
							);
							
							if (existingItem) {
								const quantityDifference = item.quantity - existingItem.quantity;
							if (quantityDifference !== 0) {
								await product_model.findByIdAndUpdate(
										itemProductId,
										{ $inc: { stock: -quantityDifference } },
										{ session }
									);
								}
							} else {
								// New item
								await product_model.findByIdAndUpdate(
									itemProductId,
									{ $inc: { stock: -item.quantity } },
									{ session }
								);
							}
						}
					} else {
						// For non-pending orders, deduct stock for all new items
						for (const item of updateData.items) {
							// Extract product ID from item (handle both string and object formats)
							const itemProductId = typeof item.product === 'string' 
								? item.product 
								: item.product._id || item.product.id;
								
							await product_model.findByIdAndUpdate(
								itemProductId,
								{ $inc: { stock: -item.quantity } },
								{ session }
							);
						}
					}
				});
			} catch (error) {
				console.error("Stock update transaction failed:", error);
				throw error;
			} finally {
				await session.endSession();
			}
		}

		// Recalculate totals if items are actually changed, discount, or shipping charges are being updated
		if ((updateData.items && itemsChanged) || updateData.discount !== undefined || updateData.shippingCharges !== undefined) {
			// Get the current order to merge with updates
			const currentOrder = await order_model.findById(id);
			if (!currentOrder) {
				res.status(404).json({
					success: false,
					error: "Order not found",
				});
				return;
			}

			// Merge current order with updates
			const mergedOrder = { ...currentOrder.toObject(), ...updateData };
			
			// Recalculate item totals if items are being updated
			if (updateData.items) {
				for (const item of mergedOrder.items) {
					if (item.product && item.quantity) {
						const product = await product_model.findById(item.product);
						if (product) {
							const unitPrice = item.unitPrice || product.price;
							const gstRate = item.gstRate || product.gst;
							
							const totals = calculateItemTotals({
								quantity: item.quantity,
								unitPrice: unitPrice,
								gstRate: gstRate
							});
							
							item.totalPrice = totals.totalPrice;
							item.gstAmount = totals.gstAmount;
							item.finalPrice = totals.finalPrice;
							item.unitPrice = unitPrice;
							item.gstRate = gstRate;
						}
					}
				}
			}

			// Calculate order totals
			const itemsArray = mergedOrder.items.map((item) => ({
				totalPrice: item.totalPrice,
				gstAmount: item.gstAmount
			}));
			
			const orderTotals = calculateOrderTotals(
				itemsArray, 
				mergedOrder.shippingCharges || 0, 
				mergedOrder.discount || 0
			);
			
			// Update the totals in updateData
			updateData.subtotal = orderTotals.subtotal;
			updateData.totalGst = orderTotals.totalGst;
			updateData.totalAmount = orderTotals.totalAmount;
		}

		const updatedOrder = await order_model
			.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
			.populate({
				path: "items.product",
				select: "title category subCategory",
			})
			.lean();

		if (!updatedOrder) {
			res.status(404).json({
				success: false,
				error: "Order not found",
			});
			return;
		}

		// Normalize _id
		const orderWithId = {
			...updatedOrder,
			id: updatedOrder._id.toString(),
			_id: updatedOrder._id.toString(),
		};

		res.json({
			success: true,
			data: orderWithId,
			message: "Order updated successfully",
		});
	} catch (error: any) {
		console.error("Error updating order:", error);

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
			error: "Failed to update order",
		});
	}
};

// DELETE /api/order/:id - Soft delete order
export const delete_order = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({
				success: false,
				error: "Invalid order ID",
			});
			return;
		}

		const order = await order_model.findById(id);
		if (!order) {
			res.status(404).json({
				success: false,
				error: "Order not found",
			});
			return;
		}

		// Only allow deletion of pending orders
		if (order.status !== OrderStatus.PENDING) {
			res.status(400).json({
				success: false,
				error: "Only pending orders can be deleted",
			});
			return;
		}

		// Restore stock
		for (const item of order.items) {
			await product_model.findByIdAndUpdate(item.product, {
				$inc: { stock: item.quantity },
			});
		}

		// Hard delete - completely remove from database
		await order_model.findByIdAndDelete(id);

		res.json({
			success: true,
			message: "Order deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting order:", error);
		res.status(500).json({
			success: false,
			error: "Failed to delete order",
		});
	}
};

// DELETE /api/orders - Delete all orders
export const delete_all_orders = async (req: Request, res: Response): Promise<void> => {
	try {
		const { confirmDeleteAll } = req.body;

		// Require explicit confirmation
		if (!confirmDeleteAll) {
			res.status(400).json({
				success: false,
				error: "Confirmation required to delete all orders",
			});
			return;
		}

		// Get all active orders to restore stock
		const orders = await order_model.find({ isActive: true });
		
		// Restore stock for all orders
		for (const order of orders) {
			for (const item of order.items) {
				await product_model.findByIdAndUpdate(item.product, {
					$inc: { stock: item.quantity },
				});
			}
		}

		// Hard delete all orders - completely remove from database
		const result = await order_model.deleteMany({ isActive: true });

		res.json({
			success: true,
			message: `Successfully deleted ${result.deletedCount} orders and restored stock`,
			data: {
				deletedCount: result.deletedCount,
			},
		});
	} catch (error) {
		console.error("Error deleting all orders:", error);
		res.status(500).json({
			success: false,
			error: "Failed to delete all orders",
		});
	}
};

// GET /api/orders/stats - Get order statistics
export const get_order_stats = async (req: Request, res: Response) => {
	try {
		const { period = "30" } = req.query as Record<string, string>;
		const days = Number(period);
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const [
			totalOrders,
			pendingOrders,
			processingOrders,
			deliveredOrders,
			cancelledOrders,
			totalRevenue,
			recentOrders,
			topProducts,
		] = await Promise.all([
			order_model.countDocuments({ isActive: true }),
			order_model.countDocuments({ isActive: true, status: OrderStatus.PENDING }),
			order_model.countDocuments({ isActive: true, status: OrderStatus.PROCESSING }),
			order_model.countDocuments({ isActive: true, status: OrderStatus.DELIVERED }),
			order_model.countDocuments({ isActive: true, status: OrderStatus.CANCELLED }),
			order_model.aggregate([
				{ $match: { isActive: true, status: OrderStatus.DELIVERED, paymentStatus: "paid" } },
				{ $group: { _id: null, total: { $sum: "$totalAmount" } } },
			]),
			order_model
				.find({ isActive: true, orderDate: { $gte: startDate } })
				.sort({ orderDate: -1 })
				.limit(10)
				.select("orderNumber customer.name totalAmount status orderDate")
				.lean(),
			order_model.aggregate([
				{ $match: { isActive: true, status: OrderStatus.DELIVERED, paymentStatus: "paid" } },
				{ $unwind: "$items" },
				{
					$group: {
						_id: "$items.product",
						productName: { $first: "$items.productName" },
						totalQuantity: { $sum: "$items.quantity" },
						totalRevenue: { $sum: "$items.finalPrice" },
					},
				},
				{ $sort: { totalQuantity: -1 } },
				{ $limit: 10 },
			]),
		]);

		const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

		res.json({
			success: true,
			data: {
				overview: {
					totalOrders,
					pendingOrders,
					processingOrders,
					deliveredOrders,
					cancelledOrders,
					totalRevenue: revenue,
				},
				recentOrders: recentOrders.map((order) => ({
					...order,
					id: order._id.toString(),
					_id: order._id.toString(),
				})),
				topProducts: topProducts.map((product) => ({
					...product,
					id: product._id.toString(),
					_id: product._id.toString(),
				})),
			},
		});
	} catch (error) {
		console.error("Error fetching order stats:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch order statistics",
		});
	}
};
