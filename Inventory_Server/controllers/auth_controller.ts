import { Request, Response } from "express";
import { user_model, UserRole } from "../models/user.js";
import { activityLog_model, ActivityType } from "../models/activityLog.js";
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  validatePassword,
  validateEmail
} from "../utils/authUtils.js";
import { sendOTPEmail, sendPasswordResetSuccessEmail } from "../utils/emailService.js";
import dotenv from "dotenv";
dotenv.config();

// Register new user (Admin only)
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = UserRole.VIEWER, avatar } = req.body;
    const currentUser = (req as any).user;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address",
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await (user_model as any).findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
      });
    }


    // Resolve default avatar by role if none provided
    const resolveDefaultAvatar = (r: string) => {
      switch (r) {
        case UserRole.ADMIN:
          return "/avatars/admin.svg";
        case UserRole.MANAGER:
          return "/avatars/manager.svg";
        case UserRole.VIEWER:
        default:
          return "/avatars/viewer.svg";
      }
    };

    // Create new user
    const newUser = await user_model.create({
      name,
      email,
      password,
      role,
      avatar: avatar ?? resolveDefaultAvatar(role),
    });

    // Log activity
    await (activityLog_model as any).logActivity({
      user: currentUser._id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      activityType: ActivityType.USER_CREATE,
      description: `Created new user: ${name} (${email}) with role: ${role}`,
      resource: "User",
      resourceId: newUser._id,
      userAgent: req.get("User-Agent") || "unknown",
    });

    // Remove password from response
    const userResponse = newUser.toObject();
    delete (userResponse as any).password;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find user by email (including password and security fields)
    const user = await (user_model as any)
      .findByEmail(email)
      .select("+password +failedLoginAttempts +lastFailedLoginAt +lockUntil");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Account is deactivated. Please contact administrator.",
      });
    }

    // Enforce account lockout
    const MAX_LOGIN_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
    const LOGIN_WINDOW_MS = Number(process.env.LOGIN_ATTEMPT_WINDOW_MS || 15 * 60 * 1000);
    const LOCK_DURATION_MS = Number(process.env.LOGIN_LOCK_DURATION_MS || 30 * 60 * 1000);

    if (typeof (user as any).isAccountLocked === "function" && (user as any).isAccountLocked()) {
      const unlockAt = (user as any).lockUntil as Date;
      return res.status(423).json({
        success: false,
        error: "Account locked",
        data: { lockUntil: unlockAt }
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      let attemptsLeft: number | undefined;
      let lockUntil: Date | undefined;
      if (typeof (user as any).registerFailedLoginAttempt === "function") {
        const result = await (user as any).registerFailedLoginAttempt(
          MAX_LOGIN_ATTEMPTS,
          LOGIN_WINDOW_MS,
          LOCK_DURATION_MS
        );
        attemptsLeft = result.attemptsLeft;
        lockUntil = result.lockUntil;
      }
      return res.status(401).json({ success: false, error: "Invalid email or password", data: { attemptsLeft, lockUntil } });
    }

    // Update last login
    user.lastLogin = new Date();
    // Increment sessionVersion to invalidate previous sessions
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();

    // Clear failure counters on success
    if (typeof (user as any).clearLoginFailures === "function") {
      await (user as any).clearLoginFailures();
    }

    // Generate tokens
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Log activity
    await (activityLog_model as any).logActivity({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      activityType: ActivityType.LOGIN,
      description: "User logged in successfully",
      userAgent: req.get("User-Agent") || "unknown",
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Log activity
    if (user) {
      await activityLog_model.logActivity({
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        activityType: ActivityType.LOGOUT,
        description: "User logged out successfully",
        userAgent: req.get("User-Agent") || "unknown",
      });
    }

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired refresh token",
      });
    }

    // Get user from database
    const user = await user_model.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "User not found or inactive",
      });
    }

    // Enforce session version for refresh token as well
    if (typeof decoded.sessionVersion !== "number" || decoded.sessionVersion !== user.sessionVersion) {
      return res.status(401).json({
        success: false,
        error: "Session invalidated. Please login again.",
      });
    }

    // Generate new tokens
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
    };

    const newAccessToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, email, avatar } = req.body;
    const updates: any = {};

    // Validate and update name
    if (name && name.trim()) {
      updates.name = name.trim();
    }

    // Validate and update email
    if (email && email !== user.email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: "Please provide a valid email address",
        });
      }

      // Check if email is already taken
      const existingUser = await (user_model as any).findByEmail(email);
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(409).json({
          success: false,
          error: "Email is already taken by another user",
        });
      }

      updates.email = email.toLowerCase();
    }

    // Update avatar
    if (avatar !== undefined) {
      updates.avatar = avatar;
    }

    // Update user
    const updatedUser = await user_model.findByIdAndUpdate(
      user._id,
      updates,
      { new: true, runValidators: true }
    );

    // Log activity
    await (activityLog_model as any).logActivity({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      activityType: ActivityType.PROFILE_UPDATE,
      description: "Updated profile information",
      resource: "User",
      resourceId: user._id,
      oldValues: { name: user.name, email: user.email, avatar: user.avatar },
      newValues: updates,
      userAgent: req.get("User-Agent") || "unknown",
    });

    // Remove password from response
    const userResponse = updatedUser!.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log activity
    await (activityLog_model as any).logActivity({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      activityType: ActivityType.PASSWORD_CHANGE,
      description: "Password changed successfully",
      resource: "User",
      resourceId: user._id,
      userAgent: req.get("User-Agent") || "unknown",
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Verify token
export const verifyTokenEndpoint = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Forgot password - Send OTP
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address",
      });
    }

    // Check if user exists (include lock fields)
    const user = await (user_model as any)
      .findByEmail(email)
      .select("+failedLoginAttempts +lastFailedLoginAt +lockUntil");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found. Please contact your administrator for assistance.",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account is deactivated. Please contact administrator.",
      });
    }

    // Block if account is currently locked
    if ((user as any).isAccountLocked && (user as any).isAccountLocked()) {
      return res.status(423).json({ success: false, error: "Account locked. Contact admin or try later." });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    user.otpCode = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, user.name);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: "Failed to send OTP email. Please try again later.",
      });
    }

    // Log activity
    await (activityLog_model as any).logActivity({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      activityType: ActivityType.PASSWORD_RESET_REQUEST,
      description: "Requested password reset via OTP",
      resource: "User",
      resourceId: user._id,
      userAgent: req.get("User-Agent") || "unknown",
    });

    res.status(200).json({
      success: true,
      message: "OTP sent to your email address",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Verify OTP and reset password
export const resetPasswordWithOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate required fields
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Email, OTP, and new password are required",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address",
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
    }

    // Find user with OTP
    const user = await user_model.findOne({
      email: email.toLowerCase(),
      isActive: true
    }).select("+otpCode +otpExpires");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if OTP exists and is not expired
    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        error: "No valid OTP found. Please request a new password reset.",
      });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        error: "OTP has expired. Please request a new password reset.",
      });
    }

    // Verify OTP
    if (user.otpCode !== otp) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP code",
      });
    }

    // Update password
    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send success email
    await sendPasswordResetSuccessEmail(email, user.name);

    // Log activity
    await (activityLog_model as any).logActivity({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      activityType: ActivityType.PASSWORD_RESET,
      description: "Password reset successfully via OTP",
      resource: "User",
      resourceId: user._id,
      userAgent: req.get("User-Agent") || "unknown",
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
