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

// Distributor schema (new)
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

		console.log("Database seeded successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Error seeding database:", error.message);
		process.exit(1);
	}
}

seedDatabase();
