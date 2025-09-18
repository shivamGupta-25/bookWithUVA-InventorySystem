import mongoose from "mongoose";

// Activity Type Enum
export const ActivityType = {
	LOGIN: "login",
	LOGOUT: "logout",
	CREATE: "create",
	UPDATE: "update",
	DELETE: "delete",
	PASSWORD_CHANGE: "password_change",
	PASSWORD_RESET_REQUEST: "password_reset_request",
	PASSWORD_RESET: "password_reset",
	PROFILE_UPDATE: "profile_update",
	USER_CREATE: "user_create",
	USER_UPDATE: "user_update",
	USER_DELETE: "user_delete",
	USER_ACTIVATE: "user_activate",
	USER_DEACTIVATE: "user_deactivate",
} as const;

export type ActivityTypeType = typeof ActivityType[keyof typeof ActivityType];

// Activity Log Schema
const ActivityLogSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "User is required"],
		},
		userName: {
			type: String,
			required: [true, "User name is required"],
			trim: true,
		},
		userEmail: {
			type: String,
			required: [true, "User email is required"],
			trim: true,
		},
		activityType: {
			type: String,
			enum: Object.values(ActivityType),
			required: [true, "Activity type is required"],
		},
		description: {
			type: String,
			required: [true, "Description is required"],
			trim: true,
			maxLength: [500, "Description cannot exceed 500 characters"],
		},
		resource: {
			type: String,
			trim: true,
			maxLength: [100, "Resource cannot exceed 100 characters"],
		},
		resourceId: {
			type: mongoose.Schema.Types.ObjectId,
			default: null,
		},
		oldValues: {
			type: mongoose.Schema.Types.Mixed,
			default: null,
		},
		newValues: {
			type: mongoose.Schema.Types.Mixed,
			default: null,
		},
		userAgent: {
			type: String,
			trim: true,
			maxLength: [500, "User agent cannot exceed 500 characters"],
		},
		metadata: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
ActivityLogSchema.index({ user: 1, createdAt: -1 });
ActivityLogSchema.index({ activityType: 1, createdAt: -1 });
ActivityLogSchema.index({ resource: 1, resourceId: 1 });
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ userName: "text", description: "text" });

// Virtual for activity summary
ActivityLogSchema.virtual("activitySummary").get(function () {
	return {
		user: this.userName,
		action: this.activityType,
		resource: this.resource,
		description: this.description,
		timestamp: this.createdAt,
	};
});

// Ensure virtual fields are serialized
ActivityLogSchema.set("toJSON", { virtuals: true });
ActivityLogSchema.set("toObject", { virtuals: true });

// Define static methods interface
interface ActivityLogModel extends mongoose.Model<any> {
	logActivity(data: {
		user: string;
		userName: string;
		userEmail: string;
		activityType: string;
		description: string;
		resource?: string;
		resourceId?: string;
	oldValues?: any;
	newValues?: any;
	userAgent?: string;
		metadata?: any;
	}): Promise<any>;
	getUserActivities(userId: string, limit?: number, skip?: number): Promise<any[]>;
	getActivitiesByType(activityType: string, limit?: number, skip?: number): Promise<any[]>;
	getRecentActivities(limit?: number, skip?: number): Promise<any[]>;
}

// Static method to log activity
ActivityLogSchema.statics.logActivity = function (data: {
	user: string;
	userName: string;
	userEmail: string;
	activityType: string;
	description: string;
	resource?: string;
	resourceId?: string;
	oldValues?: any;
	newValues?: any;
	userAgent?: string;
	metadata?: any;
}) {
	return this.create(data);
};

// Static method to get user activities
ActivityLogSchema.statics.getUserActivities = function (userId: string, limit = 50, skip = 0) {
	return this.find({ user: userId })
		.sort({ createdAt: -1 })
		.limit(limit)
		.skip(skip)
		.populate("user", "name email role");
};

// Static method to get activities by type
ActivityLogSchema.statics.getActivitiesByType = function (activityType: string, limit = 50, skip = 0) {
	return this.find({ activityType })
		.sort({ createdAt: -1 })
		.limit(limit)
		.skip(skip)
		.populate("user", "name email role");
};

// Static method to get recent activities
ActivityLogSchema.statics.getRecentActivities = function (limit = 100, skip = 0) {
	return this.find()
		.sort({ createdAt: -1 })
		.limit(limit)
		.skip(skip)
		.populate("user", "name email role");
};

export const activityLog_model = mongoose.model<any, ActivityLogModel>("ActivityLog", ActivityLogSchema);
export default activityLog_model;
