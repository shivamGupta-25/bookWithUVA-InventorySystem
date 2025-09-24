import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { user_model, UserRole } from "../models/user.js";
import { activityLog_model, ActivityType } from "../models/activityLog.js";
import dotenv from "dotenv";
dotenv.config();

// JWT Secret (should be in environment variables)
const JWT_SECRET: Secret = (process.env.JWT_SECRET as unknown as string) || "";
const JWT_EXPIRES_IN: string | number | undefined = process.env.JWT_EXPIRES_IN as
	| string
	| number
	| undefined;
const JWT_REFRESH_EXPIRES_IN: string | number | undefined =
	process.env.JWT_REFRESH_EXPIRES_IN as string | number | undefined;

// JWT Payload Interface
export interface JWTPayload {
	id: string;
	email: string;
	role: string;
	sessionVersion: number;
	iat?: number;
	exp?: number;
}

// Generate JWT Token
export const generateToken = (payload: Omit<JWTPayload, "iat" | "exp">): string => {
	const options: SignOptions = {};
	if (JWT_EXPIRES_IN !== undefined) options.expiresIn = JWT_EXPIRES_IN as any;
	return jwt.sign(payload as any, JWT_SECRET, options);
};

// Generate Refresh Token
export const generateRefreshToken = (
	payload: Omit<JWTPayload, "iat" | "exp">
): string => {
	const options: SignOptions = {};
	if (JWT_REFRESH_EXPIRES_IN !== undefined) options.expiresIn = JWT_REFRESH_EXPIRES_IN as any;
	return jwt.sign(payload as any, JWT_SECRET, options);
};

// Verify JWT Token
export const verifyToken = (token: string): JWTPayload | null => {
	try {
		return jwt.verify(token, JWT_SECRET) as JWTPayload;
	} catch (error) {
		return null;
	}
};

// Get token from request
export const getTokenFromRequest = (req: Request): string | null => {
	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith("Bearer ")) {
		return authHeader.substring(7);
	}
	return null;
};

// Authentication Middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const token = getTokenFromRequest(req);
		
		if (!token) {
			return res.status(401).json({
				success: false,
				error: "Access token is required",
			});
		}

		const decoded = verifyToken(token);
		if (!decoded) {
			return res.status(401).json({
				success: false,
				error: "Invalid or expired token",
			});
		}

		// Get user from database
		const user = await user_model.findById(decoded.id).select("+password");
		if (!user || !user.isActive) {
			return res.status(401).json({
				success: false,
				error: "User not found or inactive",
			});
		}

		// Enforce single active session
		if (typeof decoded.sessionVersion !== "number" || decoded.sessionVersion !== user.sessionVersion) {
			return res.status(401).json({
				success: false,
				error: "Session invalidated due to login from another device",
			});
		}

		// Check if password was changed after token was issued
		if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat!)) {
			return res.status(401).json({
				success: false,
				error: "Password was changed recently. Please login again.",
			});
		}

		// Add user to request object
		(req as any).user = user;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			error: "Authentication failed",
		});
	}
};

// Authorization Middleware
export const authorize = (...roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = (req as any).user;
		
		if (!user) {
			return res.status(401).json({
				success: false,
				error: "Authentication required",
			});
		}

		if (!roles.includes(user.role)) {
			return res.status(403).json({
				success: false,
				error: "Insufficient permissions",
			});
		}

		next();
	};
};

// Activity Logging Middleware
export const logActivity = (activityType: string, description: string, resource?: string) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const user = (req as any).user;
		
		// Skip logging for VIEW operations
		if (activityType === "view") {
			next();
			return;
		}
		
		if (user) {
			try {
				await (activityLog_model as any).logActivity({
					user: user._id,
					userName: user.name,
					userEmail: user.email,
					activityType,
					description,
					resource,
					resourceId: req.params.id || null,
					userAgent: req.get("User-Agent") || "unknown",
					metadata: {
						method: req.method,
						url: req.originalUrl,
						body: req.method !== "GET" ? req.body : undefined,
					},
				});
			} catch (error) {
				console.error("Failed to log activity:", error);
				// Don't fail the request if logging fails
			}
		}
		
		next();
	};
};

// Get client IP address
export const getClientIP = (req: Request): string => {
	return (
		(req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		"unknown"
	);
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
	const errors: string[] = [];
	
	if (password.length < 6) {
		errors.push("Password must be at least 6 characters long");
	}
	
	if (!/(?=.*[a-z])/.test(password)) {
		errors.push("Password must contain at least one lowercase letter");
	}
	
	if (!/(?=.*[A-Z])/.test(password)) {
		errors.push("Password must contain at least one uppercase letter");
	}
	
	if (!/(?=.*\d)/.test(password)) {
		errors.push("Password must contain at least one number");
	}
	
	return (
		{
			isValid: errors.length === 0,
			errors,
		}
	);
};

// Email validation
export const validateEmail = (email: string): boolean => {
	const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	return emailRegex.test(email);
};

// Role hierarchy check
export const hasPermission = (userRole: string, requiredRole: string): boolean => {
	const roleHierarchy = {
		[UserRole.VIEWER]: 1,
		[UserRole.MANAGER]: 2,
		[UserRole.ADMIN]: 3,
	};
	
	return (
		roleHierarchy[userRole as keyof typeof roleHierarchy] >=
		roleHierarchy[requiredRole as keyof typeof roleHierarchy]
	);
};

export default {
	generateToken,
	generateRefreshToken,
	verifyToken,
	authenticate,
	authorize,
	logActivity,
	getClientIP,
	validatePassword,
	validateEmail,
	hasPermission,
};
