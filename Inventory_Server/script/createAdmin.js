import mongoose from "mongoose";
import dotenv from "dotenv";
import { user_model, UserRole } from "../models/user.ts";

dotenv.config();

const createAdminUser = async () => {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.DATABASE_URI);
		console.log("Connected to Database.");

		// Check if admin user already exists
		const existingAdmin = await user_model.findOne({ role: UserRole.ADMIN });
		if (existingAdmin) {
			console.log("Admin user already exists:", existingAdmin.email);
			process.exit(0);
		}

		// Create admin user
		const adminUser = await user_model.create({
			name: "System Administrator",
			email: "guptashivam25oct@gmail.com",
			password: "Admin@123", // Change this in production
			avatar: "https://img.freepik.com/premium-vector/cool-cartoon-boy-avatar_987671-675.jpg?semt=ais_incoming&w=740&q=80",
			role: UserRole.ADMIN,
			isActive: true,
		});

		console.log("Admin user created successfully:");
		console.log("Email:", adminUser.email);
		console.log("Password: Admin@123");
		console.log("Role:", adminUser.role);
		console.log("\n⚠️  IMPORTANT: Change the default password after first login!");

		process.exit(0);
	} catch (error) {
		console.error("Error creating admin user:", error);
		process.exit(1);
	}
};

createAdminUser();
