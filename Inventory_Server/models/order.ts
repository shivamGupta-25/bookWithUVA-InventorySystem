import mongoose from "mongoose";
import { calculateItemTotals, calculateOrderTotals } from "../utils/monetaryUtils";

// Order Item Schema (embedded in Order)
const OrderItemSchema = new mongoose.Schema({
	product: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Product",
		required: [true, "Product is required"],
	},
	productName: {
		type: String,
		required: [true, "Product name is required"],
		trim: true,
	},
	quantity: {
		type: Number,
		required: [true, "Quantity is required"],
		min: [1, "Quantity must be at least 1"],
	},
	unitPrice: {
		type: Number,
		required: [true, "Unit price is required"],
		min: [0, "Unit price cannot be negative"],
	},
	totalPrice: {
		type: Number,
		required: [true, "Total price is required"],
		min: [0, "Total price cannot be negative"],
	},
	gstRate: {
		type: Number,
		required: [true, "GST rate is required"],
		min: [0, "GST rate cannot be negative"],
		max: [100, "GST rate cannot exceed 100%"],
	},
	gstAmount: {
		type: Number,
		required: [true, "GST amount is required"],
		min: [0, "GST amount cannot be negative"],
	},
	finalPrice: {
		type: Number,
		required: [true, "Final price is required"],
		min: [0, "Final price cannot be negative"],
	},
}, { _id: false });

// Order Status Enum
export const OrderStatus = {
	PENDING: "pending",
	PROCESSING: "processing",
	SHIPPED: "shipped",
	DELIVERED: "delivered",
	CANCELLED: "cancelled",
	REFUNDED: "refunded",
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// Order Schema
const OrderSchema = new mongoose.Schema(
	{
		orderNumber: {
			type: String,
			required: [true, "Order number is required"],
			unique: true,
			trim: true,
		},
		customer: {
			name: {
				type: String,
				required: [true, "Customer name is required"],
				trim: true,
				maxLength: [100, "Customer name cannot exceed 100 characters"],
			},
			email: {
				type: String,
				trim: true,
				lowercase: true,
				maxLength: [100, "Email cannot exceed 100 characters"],
				validate: {
					validator: function(v) {
						if (!v) return true; // Allow empty emails
						// More comprehensive email validation
						const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
						return emailRegex.test(v);
					},
					message: "Please enter a valid email address"
				}
			},
			phone: {
				type: String,
				trim: true,
				maxLength: [20, "Phone number cannot exceed 20 characters"],
				validate: {
					validator: function(v) {
						if (!v) return true; // Allow empty phone numbers
						// Remove all non-digit characters
						const digits = v.replace(/\D/g, '');
						// Check if it's exactly 10 digits and doesn't start with 0
						return digits.length === 10 && !digits.startsWith('0');
					},
					message: "Phone number must be exactly 10 digits and cannot start with 0"
				}
			},
			address: {
				street: {
					type: String,
					trim: true,
					maxLength: [200, "Street address cannot exceed 200 characters"],
				},
				city: {
					type: String,
					trim: true,
					maxLength: [50, "City cannot exceed 50 characters"],
				},
				state: {
					type: String,
					trim: true,
					maxLength: [50, "State cannot exceed 50 characters"],
				},
				pincode: {
					type: String,
					trim: true,
					maxLength: [10, "Pincode cannot exceed 10 characters"],
				},
				country: {
					type: String,
					trim: true,
					maxLength: [50, "Country cannot exceed 50 characters"],
					default: "India",
				},
			},
		},
		items: [OrderItemSchema],
		status: {
			type: String,
			enum: Object.values(OrderStatus),
			default: OrderStatus.PENDING,
			required: [true, "Order status is required"],
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "paid", "failed", "refunded"],
			default: "pending",
			required: [true, "Payment status is required"],
		},
		paymentMethod: {
			type: String,
			enum: ["cash", "card", "upi", "netbanking", "wallet"],
			required: [true, "Payment method is required"],
		},
		subtotal: {
			type: Number,
			required: [true, "Subtotal is required"],
			min: [0, "Subtotal cannot be negative"],
		},
		totalGst: {
			type: Number,
			required: [true, "Total GST is required"],
			min: [0, "Total GST cannot be negative"],
		},
		shippingCharges: {
			type: Number,
			default: 0,
			min: [0, "Shipping charges cannot be negative"],
		},
		discount: {
			type: Number,
			default: 0,
			min: [0, "Discount percentage cannot be negative"],
			max: [100, "Discount percentage cannot exceed 100%"],
		},
		totalAmount: {
			type: Number,
			required: [true, "Total amount is required"],
			min: [0, "Total amount cannot be negative"],
		},
		notes: {
			type: String,
			trim: true,
			maxLength: [500, "Notes cannot exceed 500 characters"],
		},
		orderDate: {
			type: Date,
			default: Date.now,
			required: [true, "Order date is required"],
		},
		expectedDeliveryDate: {
			type: Date,
		},
		deliveredDate: {
			type: Date,
		},
		cancelledDate: {
			type: Date,
		},
		cancellationReason: {
			type: String,
			trim: true,
			maxLength: [200, "Cancellation reason cannot exceed 200 characters"],
		},
		refundAmount: {
			type: Number,
			min: [0, "Refund amount cannot be negative"],
		},
		refundDate: {
			type: Date,
		},
		refundReason: {
			type: String,
			trim: true,
			maxLength: [200, "Refund reason cannot exceed 200 characters"],
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
// Note: orderNumber index is automatically created by unique: true
OrderSchema.index({ "customer.name": "text", "customer.email": "text" });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ createdAt: -1 });

// Virtual for order age in days
OrderSchema.virtual("orderAge").get(function () {
	const now = new Date();
	const orderDate = this.orderDate || this.createdAt;
	const diffTime = Math.abs(now.getTime() - orderDate.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for order summary
OrderSchema.virtual("orderSummary").get(function () {
	const items = this.items as unknown as any[];
	return {
		itemCount: items.length,
		totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
		status: this.status,
		paymentStatus: this.paymentStatus,
		totalAmount: this.totalAmount,
	};
});

// Ensure virtual fields are serialized
OrderSchema.set("toJSON", { virtuals: true });
OrderSchema.set("toObject", { virtuals: true });

// Pre-save middleware to generate order number
OrderSchema.pre("save", function (next) {
	console.log("Pre-save middleware called:", {
		isNew: this.isNew,
		hasOrderNumber: !!this.orderNumber,
		orderNumber: this.orderNumber
	});
	
	if (this.isNew && !this.orderNumber) {
		console.log("Generating order number...");
		// Use timestamp-based order number for now to avoid async issues
		const timestamp = Date.now().toString().slice(-6);
		this.orderNumber = `ORD${timestamp}`;
		console.log("Generated order number:", this.orderNumber);
	}
	next();
});

// Pre-save middleware to calculate totals
OrderSchema.pre("save", function (next) {
	if (this.isModified("items") || this.isModified("discount") || this.isModified("shippingCharges") || this.isNew) {
		const items = this.items as unknown as any[];
		
		// Calculate item totals using utility functions
		items.forEach((item) => {
			const totals = calculateItemTotals({
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				gstRate: item.gstRate
			});
			item.totalPrice = totals.totalPrice;
			item.gstAmount = totals.gstAmount;
			item.finalPrice = totals.finalPrice;
		});

		// Calculate order totals using utility functions
		// Convert to regular array for the utility function
		const itemsArray = items.map((item) => ({
			totalPrice: item.totalPrice,
			gstAmount: item.gstAmount
		}));
		
		const orderTotals = calculateOrderTotals(itemsArray, this.shippingCharges, this.discount);
		this.subtotal = orderTotals.subtotal;
		this.totalGst = orderTotals.totalGst;
		this.totalAmount = orderTotals.totalAmount;
	}
	next();
});

export const order_model = mongoose.model("Order", OrderSchema);
export default order_model;
