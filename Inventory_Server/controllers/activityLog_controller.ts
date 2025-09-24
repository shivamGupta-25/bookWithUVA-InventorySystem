import { Request, Response } from "express";
import { activityLog_model, ActivityType } from "../models/activityLog.js";

// Get activity logs (Admin only)
export const getActivityLogs = async (req: Request, res: Response) => {
	try {
		const { 
			page = 1, 
			limit = 50, 
			activityType, 
			userId, 
			resource, 
			startDate, 
			endDate,
			search 
		} = req.query;
		const currentUser = (req as any).user;

		// Build filter object
		const filter: any = {};
		
		if (activityType) {
			filter.activityType = activityType;
		}
		
		if (userId) {
			filter.user = userId;
		}
		
		if (resource) {
			filter.resource = resource;
		}
		
		if (startDate || endDate) {
			filter.createdAt = {};
			if (startDate) {
				filter.createdAt.$gte = new Date(startDate as string);
			}
			if (endDate) {
				filter.createdAt.$lte = new Date(endDate as string);
			}
		}
		
		if (search) {
			filter.$or = [
				{ userName: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
				{ resource: { $regex: search, $options: "i" } },
			];
		}

		// Calculate pagination
		const skip = (Number(page) - 1) * Number(limit);

		// Get activity logs with pagination
		const activityLogs = await activityLog_model
			.find(filter)
			.populate("user", "name email role")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Number(limit));

		// Get total count
		const totalLogs = await activityLog_model.countDocuments(filter);


		res.status(200).json({
			success: true,
			data: {
				activityLogs,
				pagination: {
					currentPage: Number(page),
					totalPages: Math.ceil(totalLogs / Number(limit)),
					totalLogs,
					hasNext: skip + activityLogs.length < totalLogs,
					hasPrev: Number(page) > 1,
				},
			},
		});
	} catch (error) {
		console.error("Get activity logs error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

// Get activity log by ID (Admin only)
export const getActivityLogById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const currentUser = (req as any).user;

		const activityLog = await activityLog_model
			.findById(id)
			.populate("user", "name email role");

		if (!activityLog) {
			return res.status(404).json({
				success: false,
				error: "Activity log not found",
			});
		}


		res.status(200).json({
			success: true,
			data: {
				activityLog,
			},
		});
	} catch (error) {
		console.error("Get activity log by ID error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

// Get user activity logs (Admin only)
export const getUserActivityLogs = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 50, activityType, startDate, endDate } = req.query;
		const currentUser = (req as any).user;

		// Build filter object
		const filter: any = { user: userId };
		
		if (activityType) {
			filter.activityType = activityType;
		}
		
		if (startDate || endDate) {
			filter.createdAt = {};
			if (startDate) {
				filter.createdAt.$gte = new Date(startDate as string);
			}
			if (endDate) {
				filter.createdAt.$lte = new Date(endDate as string);
			}
		}

		// Calculate pagination
		const skip = (Number(page) - 1) * Number(limit);

		// Get user activity logs
		const activityLogs = await activityLog_model
			.find(filter)
			.populate("user", "name email role")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Number(limit));

		// Get total count
		const totalLogs = await activityLog_model.countDocuments(filter);


		res.status(200).json({
			success: true,
			data: {
				activityLogs,
				pagination: {
					currentPage: Number(page),
					totalPages: Math.ceil(totalLogs / Number(limit)),
					totalLogs,
					hasNext: skip + activityLogs.length < totalLogs,
					hasPrev: Number(page) > 1,
				},
			},
		});
	} catch (error) {
		console.error("Get user activity logs error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

// Get activity statistics (Admin only)
export const getActivityStats = async (req: Request, res: Response) => {
	try {
		const { startDate, endDate } = req.query;
		const currentUser = (req as any).user;

		// Build date filter
		const dateFilter: any = {};
		if (startDate || endDate) {
			dateFilter.createdAt = {};
			if (startDate) {
				dateFilter.createdAt.$gte = new Date(startDate as string);
			}
			if (endDate) {
				dateFilter.createdAt.$lte = new Date(endDate as string);
			}
		}

		// Get activity counts by type
		const activityCounts = await activityLog_model.aggregate([
			{ $match: dateFilter },
			{
				$group: {
					_id: "$activityType",
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1 } },
		]);

		// Get total activities
		const totalActivities = await activityLog_model.countDocuments(dateFilter);

		// Get unique users who performed activities
		const uniqueUsers = await activityLog_model.distinct("user", dateFilter);

		// Get recent activities (last 24 hours)
		const last24Hours = new Date();
		last24Hours.setHours(last24Hours.getHours() - 24);
		const recentActivities = await activityLog_model.countDocuments({
			...dateFilter,
			createdAt: { $gte: last24Hours },
		});

		// Get most active users
		const mostActiveUsers = await activityLog_model.aggregate([
			{ $match: dateFilter },
			{
				$group: {
					_id: "$user",
					userName: { $first: "$userName" },
					userEmail: { $first: "$userEmail" },
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1 } },
			{ $limit: 10 },
		]);


		res.status(200).json({
			success: true,
			data: {
				stats: {
					totalActivities,
					uniqueUsers: uniqueUsers.length,
					recentActivities,
					activityCounts,
					mostActiveUsers,
				},
			},
		});
	} catch (error) {
		console.error("Get activity stats error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

// Delete old activity logs (Admin only) - cleanup function
export const deleteOldActivityLogs = async (req: Request, res: Response) => {
	try {
		const { days = 90 } = req.body;
		const currentUser = (req as any).user;

		let filter: any = {};

		// If days is 0, delete all logs
		if (Number(days) === 0) {
			filter = {}; // Empty filter means delete all
		} else {
			// Calculate cutoff date for old logs
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - Number(days));
			filter = { createdAt: { $lt: cutoffDate } };
		}

		// Delete logs based on filter
		const result = await activityLog_model.deleteMany(filter);

		// Log activity (only if we're not deleting all logs, to avoid logging the deletion of the deletion log)
		if (Number(days) !== 0) {
			await activityLog_model.logActivity({
				user: currentUser._id,
				userName: currentUser.name,
				userEmail: currentUser.email,
				activityType: ActivityType.DELETE,
				description: `Deleted ${result.deletedCount} old activity logs (older than ${days} days)`,
				resource: "ActivityLogs",
				userAgent: req.get("User-Agent") || "unknown",
			});
		}

		res.status(200).json({
			success: true,
			message: Number(days) === 0 ? `Deleted all ${result.deletedCount} activity logs` : `Deleted ${result.deletedCount} old activity logs`,
			data: {
				deletedCount: result.deletedCount,
			},
		});
	} catch (error) {
		console.error("Delete activity logs error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};
