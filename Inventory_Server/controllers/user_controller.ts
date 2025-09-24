import { Request, Response } from "express";
import { user_model, UserRole } from "../models/user.js";
import { activityLog_model, ActivityType } from "../models/activityLog.js";

// Get all users (Admin only)
export const getAllUsers = async (req: Request, res: Response) => {
	try {
		const { page = 1, limit = 10, role, search, isActive } = req.query;
		const currentUser = (req as any).user;

		// Build filter object
		const filter: any = {};
		
		if (role) {
			filter.role = role;
		}
		
		if (isActive !== undefined) {
			filter.isActive = isActive === "true";
		}
		
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
			];
		}

		// Calculate pagination
		const skip = (Number(page) - 1) * Number(limit);

		// Get users with pagination
		const users = await user_model
			.find(filter)
			.select("-password")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Number(limit));

		// Get total count
		const totalUsers = await user_model.countDocuments(filter);


		res.status(200).json({
			success: true,
			data: {
				users,
				pagination: {
					currentPage: Number(page),
					totalPages: Math.ceil(totalUsers / Number(limit)),
					totalUsers,
					hasNext: skip + users.length < totalUsers,
					hasPrev: Number(page) > 1,
				},
			},
		});
	} catch (error) {
		console.error("Get all users error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

// Get user by ID (Admin only)
export const getUserById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const currentUser = (req as any).user;

		const user = await user_model.findById(id).select("-password");
		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}


		res.status(200).json({
			success: true,
			data: {
				user,
			},
		});
	} catch (error) {
		console.error("Get user by ID error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

// Update user (Admin only)
export const updateUser = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name, email, role, isActive, avatar } = req.body;
		const currentUser = (req as any).user;

		// Find user
		const user = await user_model.findById(id);
		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Store old values for logging
		const oldValues = {
			name: user.name,
			email: user.email,
			role: user.role,
			isActive: user.isActive,
			avatar: user.avatar,
		};

		// Prepare updates
		const updates: any = {};
		
		if (name && name.trim()) {
			updates.name = name.trim();
		}
		
		if (email && email !== user.email) {
			// Check if email is already taken
			const existingUser = await user_model.findByEmail(email);
			if (existingUser && existingUser._id.toString() !== id) {
				return res.status(409).json({
					success: false,
					error: "Email is already taken by another user",
				});
			}
			updates.email = email.toLowerCase();
		}
		
		if (role && Object.values(UserRole).includes(role)) {
			updates.role = role;
		}
		
		if (typeof isActive === "boolean") {
			updates.isActive = isActive;
		}
		
		if (avatar !== undefined) {
			updates.avatar = avatar;
		}

		// Update user
		const updatedUser = await user_model.findByIdAndUpdate(
			id,
			updates,
			{ new: true, runValidators: true }
		);

		// Log activity
		await activityLog_model.logActivity({
			user: currentUser._id,
			userName: currentUser.name,
			userEmail: currentUser.email,
			activityType: ActivityType.USER_UPDATE,
			description: `Updated user: ${user.name} (${user.email})`,
			resource: "User",
			resourceId: user._id,
			oldValues,
			newValues: updates,
			userAgent: req.get("User-Agent") || "unknown",
		});

		// Remove password from response
		const userResponse = updatedUser!.toObject();
		delete userResponse.password;

		res.status(200).json({
			success: true,
			message: "User updated successfully",
			data: {
				user: userResponse,
			},
		});
	} catch (error) {
		console.error("Update user error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

// Delete user (Admin only)
export const deleteUser = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const currentUser = (req as any).user;

		// Prevent self-deletion
		if (id === currentUser._id.toString()) {
			return res.status(400).json({
				success: false,
				error: "You cannot delete your own account",
			});
		}

		// Find user
		const user = await user_model.findById(id);
		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Delete user
		await user_model.findByIdAndDelete(id);

		// Log activity
		await activityLog_model.logActivity({
			user: currentUser._id,
			userName: currentUser.name,
			userEmail: currentUser.email,
			activityType: ActivityType.USER_DELETE,
			description: `Deleted user: ${user.name} (${user.email})`,
			resource: "User",
			resourceId: user._id,
			userAgent: req.get("User-Agent") || "unknown",
		});

		res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		console.error("Delete user error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

// Activate/Deactivate user (Admin only)
export const toggleUserStatus = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { isActive } = req.body;
		const currentUser = (req as any).user;

		// Prevent self-deactivation
		if (id === currentUser._id.toString() && isActive === false) {
			return res.status(400).json({
				success: false,
				error: "You cannot deactivate your own account",
			});
		}

		// Find user
		const user = await user_model.findById(id);
		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Update user status
		user.isActive = isActive;
		await user.save();

		// Log activity
		await activityLog_model.logActivity({
			user: currentUser._id,
			userName: currentUser.name,
			userEmail: currentUser.email,
			activityType: isActive ? ActivityType.USER_ACTIVATE : ActivityType.USER_DEACTIVATE,
			description: `${isActive ? "Activated" : "Deactivated"} user: ${user.name} (${user.email})`,
			resource: "User",
			resourceId: user._id,
			userAgent: req.get("User-Agent") || "unknown",
		});

		// Remove password from response
		const userResponse = user.toObject();
		delete userResponse.password;

		res.status(200).json({
			success: true,
			message: `User ${isActive ? "activated" : "deactivated"} successfully`,
			data: {
				user: userResponse,
			},
		});
	} catch (error) {
		console.error("Toggle user status error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

// Get user statistics (Admin only)
export const getUserStats = async (req: Request, res: Response) => {
	try {
		const currentUser = (req as any).user;

		// Get user counts by role
		const totalUsers = await user_model.countDocuments();
		const activeUsers = await user_model.countDocuments({ isActive: true });
		const inactiveUsers = await user_model.countDocuments({ isActive: false });
		
		const adminCount = await user_model.countDocuments({ role: UserRole.ADMIN, isActive: true });
		const managerCount = await user_model.countDocuments({ role: UserRole.MANAGER, isActive: true });
		const viewerCount = await user_model.countDocuments({ role: UserRole.VIEWER, isActive: true });

		// Get recent users (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const recentUsers = await user_model.countDocuments({
			createdAt: { $gte: thirtyDaysAgo },
		});


		res.status(200).json({
			success: true,
			data: {
				stats: {
					totalUsers,
					activeUsers,
					inactiveUsers,
					byRole: {
						admin: adminCount,
						manager: managerCount,
						viewer: viewerCount,
					},
					recentUsers,
				},
			},
		});
	} catch (error) {
		console.error("Get user stats error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};
