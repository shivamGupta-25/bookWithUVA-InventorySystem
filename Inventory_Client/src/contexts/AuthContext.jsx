"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const router = useRouter();

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Get user role from token
  const getUserRole = (token) => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.role;
    } catch (error) {
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = Cookies.get("accessToken");

        if (storedToken && !isTokenExpired(storedToken)) {
          setToken(storedToken);

          // Verify token with server
          const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.data.user);
          } else {
            // Token is invalid, clear it
            Cookies.remove("accessToken");
            Cookies.remove("refreshToken");
            setToken(null);
            setUser(null);
          }
        } else if (storedToken && isTokenExpired(storedToken)) {
          // Try to refresh token
          await refreshAccessToken();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear invalid tokens
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Refresh access token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        // Store new tokens
        Cookies.set("accessToken", accessToken, { expires: 7 }); // 7 days
        Cookies.set("refreshToken", newRefreshToken, { expires: 30 }); // 30 days

        setToken(accessToken);

        // Get user profile
        const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUser(profileData.data.user);
        }

        return true;
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      // Clear invalid tokens
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      setToken(null);
      setUser(null);
      return false;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      const toIST = (dateVal) => {
        try {
          if (!dateVal) return null;
          const d = new Date(dateVal);
          return new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(d);
        } catch {
          return null;
        }
      };

      if (response.ok) {
        const { user: userData, accessToken, refreshToken } = data.data;
        Cookies.set("accessToken", accessToken, { expires: 7 });
        Cookies.set("refreshToken", refreshToken, { expires: 30 });
        setUser(userData);
        setToken(accessToken);
        toast.success("Login successful!", { description: toIST(new Date()) || undefined });
        return { success: true, user: userData };
      } else {
        // Craft helpful error with attempts left and lock info
        const attemptsLeft = data?.data?.attemptsLeft;
        const lockUntil = data?.data?.lockUntil;
        const istLockUntil = toIST(lockUntil);
        let description;
        if (typeof attemptsLeft === "number") {
          description = attemptsLeft > 0
            ? `Attempts left: ${attemptsLeft}`
            : istLockUntil
              ? `Account locked until ${istLockUntil} IST`
              : undefined;
        } else if (istLockUntil) {
          description = `Account locked until ${istLockUntil} IST`;
        }
        // Always show a description with IST timestamp if nothing else
        const fallbackDesc = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata" }).format(new Date());
        toast.error(data.error || "Login failed", { description: description || fallbackDesc });
        return { success: false, error: data.error, attemptsLeft, lockUntil };
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.", {
        description: new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata" }).format(new Date()),
      });
      return { success: false, error: "Network error" };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear tokens and user data
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      setUser(null);
      setToken(null);
      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        toast.success("Profile updated successfully!");
        return { success: true, user: data.data.user };
      } else {
        toast.error(data.error || "Profile update failed");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profile update failed. Please try again.");
      return { success: false, error: "Network error" };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password changed successfully!");
        return { success: true };
      } else {
        toast.error(data.error || "Password change failed");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Password change failed. Please try again.");
      return { success: false, error: "Network error" };
    }
  };

  // Check if user has permission
  const hasPermission = (requiredRole) => {
    if (!user) return false;

    const roleHierarchy = {
      viewer: 1,
      manager: 2,
      admin: 3,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  // Check if user can perform action
  const canPerformAction = (action, resource) => {
    if (!user) return false;

    // Admin can do everything
    if (user.role === "admin") return true;

    // Manager can edit but not delete users
    if (user.role === "manager") {
      if (resource === "users" && action === "delete") return false;
      return true;
    }

    // Viewer can only view
    if (user.role === "viewer") {
      return action === "view";
    }

    return false;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    hasPermission,
    canPerformAction,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
