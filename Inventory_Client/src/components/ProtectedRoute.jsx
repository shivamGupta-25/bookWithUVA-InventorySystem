"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { user, loading, hasPermission, canPerformAction } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not logged in, redirect to login
        router.push("/login");
        return;
      }

      // Check role requirement
      if (requiredRole && !hasPermission(requiredRole)) {
        // User doesn't have required role, redirect to dashboard
        router.push("/");
        return;
      }

      // Check permission requirement
      if (requiredPermission) {
        const { action, resource } = requiredPermission;
        if (!canPerformAction(action, resource)) {
          // User doesn't have required permission, redirect to dashboard
          router.push("/");
          return;
        }
      }
    }
  }, [user, loading, requiredRole, requiredPermission, hasPermission, canPerformAction, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting - never render protected content if not authenticated
  if (!user || (requiredRole && !hasPermission(requiredRole)) || 
      (requiredPermission && !canPerformAction(requiredPermission.action, requiredPermission.resource))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
