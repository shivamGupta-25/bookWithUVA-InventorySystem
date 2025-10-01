"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Nav from "./Nav";
import { Loader2 } from "lucide-react";

export default function ConditionalNav({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Don't render Nav component on login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

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

  // Don't render Nav component if user is not authenticated
  if (!user) {
    return <>{children}</>;
  }

  // Render Nav component for authenticated users
  return <Nav>{children}</Nav>;
}
