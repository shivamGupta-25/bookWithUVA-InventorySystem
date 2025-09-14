// node scripts/seedData.js

import { config } from "dotenv";
import mongoose from "mongoose";

// Load environment variables
config();

const MONGODB_URI = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
	console.error("MONGODB_URI not found in environment variables");
	process.exit(1);
}

console.log("Connecting to MongoDB...");

// Order Status Enum
const OrderStatus = {
	PENDING: "pending",
	PROCESSING: "processing",
	SHIPPED: "shipped",
	DELIVERED: "delivered",
	CANCELLED: "cancelled",
	REFUNDED: "refunded",
};

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

// Order Schema
const orderSchema = new mongoose.Schema(
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
			},
			phone: {
				type: String,
				trim: true,
				maxLength: [20, "Phone number cannot exceed 20 characters"],
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

// Pre-save middleware to generate order number
orderSchema.pre("save", async function (next) {
	if (this.isNew && !this.orderNumber) {
		const count = await mongoose.model("Order").countDocuments();
		const date = new Date();
		const year = date.getFullYear().toString().slice(-2);
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		this.orderNumber = `ORD${year}${month}${day}${(count + 1).toString().padStart(4, "0")}`;
	}
	next();
});

// Pre-save middleware to calculate totals
orderSchema.pre("save", function (next) {
	if (this.isModified("items") || this.isNew) {
		// Calculate item totals
		this.items.forEach((item) => {
			item.totalPrice = item.quantity * item.unitPrice;
			item.gstAmount = (item.totalPrice * item.gstRate) / 100;
			item.finalPrice = item.totalPrice + item.gstAmount;
		});

		// Calculate order totals
		this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
		this.totalGst = this.items.reduce((sum, item) => sum + item.gstAmount, 0);
		// Calculate discount amount from percentage
		const discountAmount = Math.round((this.subtotal + this.totalGst) * (this.discount / 100) * 100) / 100;
		this.totalAmount = this.subtotal + this.totalGst + this.shippingCharges - discountAmount;
	}
	next();
});

const Order = mongoose.model("Order", orderSchema);

// Distributor schema
const distributorSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		phoneNumber: { type: String, trim: true },
		address: { type: String, trim: true },
		gstinNumber: { type: String, trim: true },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

const Distributor = mongoose.model("Distributor", distributorSchema);

// Product schema (updated to reference Distributor)
const productSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		distributor: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor", required: true },
		category: { type: String, required: true },
		subCategory: { type: String, required: true },
		price: { type: Number, required: true },
		stock: { type: Number, required: true, default: 0 },
		gst: { type: Number, required: true, default: 18 },
		description: { type: String },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

const seedData = [
	{
		title: "The Great Gatsby",
		distributor: "Penguin Random House",
		category: "Books",
		subCategory: "Novels",
		price: 12.99,
		stock: 25,
		gst: 18,
		description: "A classic American novel by F. Scott Fitzgerald",
	},
	{
		title: "To Kill a Mockingbird",
		distributor: "HarperCollins Publishers",
		category: "Books",
		subCategory: "Novels",
		price: 14.99,
		stock: 18,
		gst: 18,
		description: "A novel by Harper Lee about racial injustice",
	},
	{
		title: "1984",
		distributor: "Penguin Random House",
		category: "Books",
		subCategory: "Novels",
		price: 13.99,
		stock: 32,
		gst: 18,
		description: "A dystopian social science fiction novel by George Orwell",
	},
	{
		title: "Pride and Prejudice",
		distributor: "Penguin Random House",
		category: "Books",
		subCategory: "Novels",
		price: 11.99,
		stock: 22,
		gst: 18,
		description: "A romantic novel by Jane Austen",
	},
	{
		title: "The Catcher in the Rye",
		distributor: "Hachette Book Group",
		category: "Books",
		subCategory: "Novels",
		price: 15.99,
		stock: 15,
		gst: 18,
		description: "A novel by J.D. Salinger",
	},
	{
		title: "The Lord of the Rings",
		distributor: "HarperCollins Publishers",
		category: "Books",
		subCategory: "Fantasy",
		price: 24.99,
		stock: 8,
		gst: 18,
		description: "A fantasy novel by J.R.R. Tolkien",
	},
	{
		title: "Harry Potter and the Philosopher's Stone",
		distributor: "Bloomsbury Publishing",
		category: "Books",
		subCategory: "Fantasy",
		price: 16.99,
		stock: 45,
		gst: 18,
		description: "The first book in the Harry Potter series by J.K. Rowling",
	},
	{
		title: "The Hobbit",
		distributor: "HarperCollins Publishers",
		category: "Books",
		subCategory: "Fantasy",
		price: 18.99,
		stock: 20,
		gst: 18,
		description: "A fantasy novel by J.R.R. Tolkien",
	},
	{
		title: "The Chronicles of Narnia",
		distributor: "HarperCollins Publishers",
		category: "Books",
		subCategory: "Fantasy",
		price: 22.99,
		stock: 12,
		gst: 18,
		description: "A series of fantasy novels by C.S. Lewis",
	},
	{
		title: "The Alchemist",
		distributor: "HarperCollins Publishers",
		category: "Books",
		subCategory: "Novels",
		price: 13.99,
		stock: 28,
		gst: 18,
		description: "A novel by Paulo Coelho",
	},
	{
		title: "A4 Notebook - 200 Pages",
		distributor: "Stationery World",
		category: "Stationery",
		subCategory: "Notebooks",
		price: 8.99,
		stock: 50,
		gst: 12,
		description: "High-quality A4 notebook with 200 pages",
	},
	{
		title: "Ball Point Pen Set - 10 Pack",
		distributor: "Office Supplies Co.",
		category: "Stationery",
		subCategory: "Pens",
		price: 12.99,
		stock: 35,
		gst: 12,
		description: "Set of 10 ball point pens in various colors",
	},
	{
		title: "Scientific Calculator",
		distributor: "Tech Tools Ltd",
		category: "Stationery",
		subCategory: "Calculators",
		price: 25.99,
		stock: 15,
		gst: 12,
		description: "Advanced scientific calculator with multiple functions",
	},
];

// Sample order data
const orderSeedData = [
	{
		customer: {
			name: "Rajesh Kumar",
			email: "rajesh.kumar@email.com",
			phone: "9876543210",
			address: {
				street: "123 MG Road, Near City Mall",
				city: "Mumbai",
				state: "Maharashtra",
				pincode: "400001",
				country: "India",
			},
		},
		items: [
			{
				productName: "The Great Gatsby",
				quantity: 2,
				unitPrice: 12.99,
				gstRate: 18,
			},
			{
				productName: "A4 Notebook - 200 Pages",
				quantity: 3,
				unitPrice: 8.99,
				gstRate: 12,
			},
		],
		paymentMethod: "upi",
		shippingCharges: 50,
		discount: 3,
		notes: "Please deliver after 6 PM",
		status: OrderStatus.DELIVERED,
		paymentStatus: "paid",
		orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
		deliveredDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
	},
	{
		customer: {
			name: "Priya Sharma",
			email: "priya.sharma@gmail.com",
			phone: "8765432109",
			address: {
				street: "456 Park Street, Sector 15",
				city: "Delhi",
				state: "Delhi",
				pincode: "110015",
				country: "India",
			},
		},
		items: [
			{
				productName: "Harry Potter and the Philosopher's Stone",
				quantity: 1,
				unitPrice: 16.99,
				gstRate: 18,
			},
			{
				productName: "Ball Point Pen Set - 10 Pack",
				quantity: 2,
				unitPrice: 12.99,
				gstRate: 12,
			},
		],
		paymentMethod: "card",
		shippingCharges: 75,
		discount: 0,
		notes: "Gift wrapping required",
		status: OrderStatus.PROCESSING,
		paymentStatus: "paid",
		orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
		expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
	},
	{
		customer: {
			name: "Amit Patel",
			email: "amit.patel@yahoo.com",
			phone: "7654321098",
			address: {
				street: "789 Brigade Road",
				city: "Bangalore",
				state: "Karnataka",
				pincode: "560001",
				country: "India",
			},
		},
		items: [
			{
				productName: "1984",
				quantity: 1,
				unitPrice: 13.99,
				gstRate: 18,
			},
			{
				productName: "The Lord of the Rings",
				quantity: 1,
				unitPrice: 24.99,
				gstRate: 18,
			},
			{
				productName: "Scientific Calculator",
				quantity: 1,
				unitPrice: 25.99,
				gstRate: 12,
			},
		],
		paymentMethod: "netbanking",
		shippingCharges: 100,
		discount: 8,
		notes: "Urgent delivery needed",
		status: OrderStatus.SHIPPED,
		paymentStatus: "paid",
		orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
		expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
	},
	{
		customer: {
			name: "Sneha Reddy",
			email: "sneha.reddy@outlook.com",
			phone: "6543210987",
			address: {
				street: "321 Anna Salai",
				city: "Chennai",
				state: "Tamil Nadu",
				pincode: "600002",
				country: "India",
			},
		},
		items: [
			{
				productName: "Pride and Prejudice",
				quantity: 1,
				unitPrice: 11.99,
				gstRate: 18,
			},
		],
		paymentMethod: "cash",
		shippingCharges: 0,
		discount: 0,
		notes: "Cash on delivery",
		status: OrderStatus.PENDING,
		paymentStatus: "pending",
		orderDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
		expectedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
	},
	{
		customer: {
			name: "Vikram Singh",
			email: "vikram.singh@hotmail.com",
			phone: "5432109876",
			address: {
				street: "654 Commercial Street",
				city: "Kolkata",
				state: "West Bengal",
				pincode: "700001",
				country: "India",
			},
		},
		items: [
			{
				productName: "The Chronicles of Narnia",
				quantity: 1,
				unitPrice: 22.99,
				gstRate: 18,
			},
			{
				productName: "The Hobbit",
				quantity: 1,
				unitPrice: 18.99,
				gstRate: 18,
			},
		],
		paymentMethod: "wallet",
		shippingCharges: 60,
		discount: 3,
		notes: "Please call before delivery",
		status: OrderStatus.CANCELLED,
		paymentStatus: "refunded",
		orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
		cancelledDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
		cancellationReason: "Customer requested cancellation",
		refundAmount: 41.98,
		refundDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
		refundReason: "Order cancelled by customer",
	},
	{
		customer: {
			name: "Anita Desai",
			email: "anita.desai@email.com",
			phone: "4321098765",
			address: {
				street: "987 Linking Road",
				city: "Mumbai",
				state: "Maharashtra",
				pincode: "400050",
				country: "India",
			},
		},
		items: [
			{
				productName: "To Kill a Mockingbird",
				quantity: 1,
				unitPrice: 14.99,
				gstRate: 18,
			},
			{
				productName: "The Alchemist",
				quantity: 1,
				unitPrice: 13.99,
				gstRate: 18,
			},
			{
				productName: "A4 Notebook - 200 Pages",
				quantity: 5,
				unitPrice: 8.99,
				gstRate: 12,
			},
		],
		paymentMethod: "upi",
		shippingCharges: 80,
		discount: 10,
		notes: "Bulk order for office use",
		status: OrderStatus.DELIVERED,
		paymentStatus: "paid",
		orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
		deliveredDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
	},
];

async function seedDatabase() {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log("Connected to MongoDB successfully!");


		// Drop existing collections if present (reset schema/data)
		const collections = await mongoose.connection.db.listCollections().toArray();
		const names = collections.map((c) => c.name);
		if (names.includes("products")) {
			await mongoose.connection.db.dropCollection("products");
			console.log("Dropped collection: products");
		}
		if (names.includes("distributors")) {
			await mongoose.connection.db.dropCollection("distributors");
			console.log("Dropped collection: distributors");
		}
		if (names.includes("orders")) {
			await mongoose.connection.db.dropCollection("orders");
			console.log("Dropped collection: orders");
		}

		// Create distributors from unique names in seed data
		const uniqueNames = Array.from(new Set(seedData.map((p) => p.distributor)));
		const distributorDocs = await Distributor.insertMany(uniqueNames.map((name) => ({ name })));
		const nameToId = new Map(distributorDocs.map((d) => [d.name, d._id]));
		console.log(`Inserted ${distributorDocs.length} distributors successfully!`);

		// Insert products with distributor ObjectId
		const products = await Product.insertMany(
			seedData.map((p) => ({
				...p,
				distributor: nameToId.get(p.distributor),
			}))
		);
		console.log(`Inserted ${products.length} products successfully!`);

		// Create product name to ID mapping for orders
		const productNameToId = new Map(products.map((p) => [p.title, p._id]));

		// Process order data and create orders
		const processedOrders = [];
		let orderCounter = 1;
		for (const orderData of orderSeedData) {
			try {
				// Process order items with product references
				const processedItems = orderData.items.map((item) => {
					const productId = productNameToId.get(item.productName);
					if (!productId) {
						throw new Error(`Product "${item.productName}" not found in database`);
					}

					// Calculate prices with proper rounding (these will be recalculated by pre-save middleware)
					const totalPrice = Math.round((item.quantity * item.unitPrice) * 100) / 100;
					const gstAmount = Math.round(((totalPrice * item.gstRate) / 100) * 100) / 100;
					const finalPrice = Math.round((totalPrice + gstAmount) * 100) / 100;

					return {
						product: productId,
						productName: item.productName,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						totalPrice,
						gstRate: item.gstRate,
						gstAmount,
						finalPrice,
					};
				});

				// Calculate order totals with proper rounding
				const subtotal = Math.round(processedItems.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
				const totalGst = Math.round(processedItems.reduce((sum, item) => sum + item.gstAmount, 0) * 100) / 100;
				const shippingCharges = orderData.shippingCharges || 0;
				const discountPercentage = orderData.discount || 0;
				const discountAmount = Math.round((subtotal + totalGst) * (discountPercentage / 100) * 100) / 100;
				const totalAmount = Math.round((subtotal + totalGst + shippingCharges - discountAmount) * 100) / 100;

				// Generate order number
				const date = new Date();
				const year = date.getFullYear().toString().slice(-2);
				const month = (date.getMonth() + 1).toString().padStart(2, "0");
				const day = date.getDate().toString().padStart(2, "0");
				const orderNumber = `ORD${year}${month}${day}${orderCounter.toString().padStart(4, "0")}`;
				orderCounter++;

				// Create order object
				const order = {
					orderNumber,
					customer: orderData.customer,
					items: processedItems,
					paymentMethod: orderData.paymentMethod,
					shippingCharges,
					discount: discountPercentage,
					notes: orderData.notes || "",
					status: orderData.status,
					paymentStatus: orderData.paymentStatus,
					subtotal,
					totalGst,
					totalAmount,
					orderDate: orderData.orderDate,
					expectedDeliveryDate: orderData.expectedDeliveryDate,
					deliveredDate: orderData.deliveredDate,
					cancelledDate: orderData.cancelledDate,
					cancellationReason: orderData.cancellationReason,
					refundAmount: orderData.refundAmount,
					refundDate: orderData.refundDate,
					refundReason: orderData.refundReason,
				};

				processedOrders.push(order);
			} catch (error) {
				console.error(`Error processing order for ${orderData.customer.name}:`, error.message);
			}
		}

		// Insert orders
		if (processedOrders.length > 0) {
			const orders = await Order.insertMany(processedOrders);
			console.log(`Inserted ${orders.length} orders successfully!`);

			// Update product stock based on orders (for delivered orders)
			for (const order of orders) {
				if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.SHIPPED || order.status === OrderStatus.PROCESSING) {
					for (const item of order.items) {
						await Product.findByIdAndUpdate(item.product, {
							$inc: { stock: -item.quantity },
						});
					}
				}
			}
			console.log("Updated product stock based on orders!");
		}

		console.log("Database seeded successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Error seeding database:", error.message);
		process.exit(1);
	}
}

seedDatabase();
