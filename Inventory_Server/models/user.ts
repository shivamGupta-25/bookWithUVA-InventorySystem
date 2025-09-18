import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// User Role Enum
export const UserRole = {
	ADMIN: "admin",
	MANAGER: "manager",
	VIEWER: "viewer",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// User Schema
const UserSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
			maxLength: [100, "Name cannot exceed 100 characters"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			trim: true,
			lowercase: true,
			maxLength: [100, "Email cannot exceed 100 characters"],
			validate: {
				validator: function(v: string) {
					const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
					return emailRegex.test(v);
				},
				message: "Please enter a valid email address"
			}
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minLength: [6, "Password must be at least 6 characters long"],
			select: false, // Don't include password in queries by default
		},
		avatar: {
			type: String,
			default: null,
			trim: true,
		},
		role: {
			type: String,
			enum: Object.values(UserRole),
			default: UserRole.VIEWER,
			required: [true, "User role is required"],
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		lastLogin: {
			type: Date,
			default: null,
		},
		sessionVersion: {
			type: Number,
			default: 0,
		},
		passwordChangedAt: {
			type: Date,
			default: Date.now,
		},
		passwordResetToken: {
			type: String,
			select: false,
		},
		passwordResetExpires: {
			type: Date,
			select: false,
		},
		otpCode: {
			type: String,
			select: false,
		},
		otpExpires: {
			type: Date,
			select: false,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
// Note: email index is automatically created by unique: true
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Virtual for user's full name (can be extended later)
UserSchema.virtual("fullName").get(function () {
	return this.name;
});

// Virtual for user's initials
UserSchema.virtual("initials").get(function () {
	const names = this.name.split(" ");
	return names.map((name: string) => name.charAt(0).toUpperCase()).join("");
});

// Ensure virtual fields are serialized
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

// Pre-save middleware to hash password
UserSchema.pre("save", async function (next) {
	// Only hash the password if it has been modified (or is new)
	if (!this.isModified("password")) return next();

	try {
		// Hash password with cost of 12
		const salt = await bcrypt.genSalt(12);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error as Error);
	}
});

// Pre-save middleware to update passwordChangedAt
UserSchema.pre("save", function (next) {
	if (!this.isModified("password") || this.isNew) return next();
	
	this.passwordChangedAt = new Date(Date.now() - 1000); // Subtract 1 second to ensure token is created after password change
	next();
});

// Instance method to check password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT was issued
UserSchema.methods.changedPasswordAfter = function (JWTTimestamp: number): boolean {
	if (this.passwordChangedAt) {
		const changedTimestamp = parseInt((this.passwordChangedAt.getTime() / 1000).toString(), 10);
		return JWTTimestamp < changedTimestamp;
	}
	return false;
};

// Define static methods interface
interface UserModel extends mongoose.Model<any> {
	findByEmail(email: string): Promise<any>;
	findActiveUsers(): Promise<any[]>;
}

// Static method to find user by email
UserSchema.statics.findByEmail = function (email: string) {
	return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to find active users
UserSchema.statics.findActiveUsers = function () {
	return this.find({ isActive: true }).select("-password");
};

export const user_model = mongoose.model<any, UserModel>("User", UserSchema);
export default user_model;
