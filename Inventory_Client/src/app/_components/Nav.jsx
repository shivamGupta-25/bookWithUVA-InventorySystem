"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Menu, X, Home, Users, LogOut, Package, Plus, Settings, ShoppingCart, User, Activity, Shield } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import NotificationBell from "@/components/NotificationBell";

const getDefaultAvatarByRole = (role) => {
  switch (role) {
    case "admin":
      return "/avatars/admin.svg";
    case "manager":
      return "/avatars/manager.svg";
    case "viewer":
    default:
      return "/avatars/viewer.svg";
  }
};

export default function Nav({ children }) {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Note: Redirect logic removed - ConditionalNav handles when to show this component

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1280;
      setIsMobile(isMobileView);
      // Only auto-collapse on mobile, don't force collapse on desktop
      if (isMobileView) {
        setIsCollapsed(true);
      }
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Control body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = isMobile && sidebarOpen ? 'hidden' : 'auto';

    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobile, sidebarOpen]);

  // Navigation items based on user role
  const navigation = useMemo(() => {
    const baseItems = [
      { name: "Dashboard", href: "/", icon: Home, permission: null },
      { name: "Inventory", href: "/inventory", icon: Package, permission: null },
      { name: "Orders", href: "/orders", icon: ShoppingCart, permission: null },
      { name: "Distributors", href: "/distributors", icon: Users, permission: null },
    ];

    const managerItems = [
      { name: "Add Product", href: "/NewProduct", icon: Plus, permission: "manager" },
    ];

    const adminItems = [
      { name: "User Management", href: "/users", icon: Shield, permission: "admin" },
      { name: "Activity Logs", href: "/activity-logs", icon: Activity, permission: "admin" },
    ];

    return [
      ...baseItems,
      ...managerItems,
      ...adminItems,
    ].filter(item => !item.permission || hasPermission(item.permission));
  }, [hasPermission]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      toast.error("Failed to logout");
    }
  }, [logout]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
      // Ensure sidebar is always visible on desktop when toggling
      if (isCollapsed) {
        setSidebarOpen(true);
      }
    }
  }, [isMobile, sidebarOpen, isCollapsed]);

  // Note: Loading state is now handled by ConditionalNav component

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background",
        // Only animate transform on mobile for the slide-in/out behavior
        isMobile ? "transition-transform duration-300 will-change-transform" : "transition-none",
        isCollapsed && !isMobile ? "w-16" : "w-64",
        isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
      )} aria-label="Sidebar navigation">
        <div className="flex h-14 items-center border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={toggleSidebar}
            aria-label={isMobile && sidebarOpen ? "Close menu" : "Open menu"}
          >
            {isMobile && sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {(!isCollapsed || (isMobile && sidebarOpen)) && (
            <Link href="/" className="font-semibold" aria-label="Home">
              Book with UVA
            </Link>
          )}
        </div>

        <ScrollArea className="flex-1">
          <nav className="space-y-1 p-2" aria-label="Primary">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                    isCollapsed && !isMobile && "justify-center"
                  )}
                  onClick={() => { if (isMobile) setSidebarOpen(false); }}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {(!isCollapsed || (isMobile && sidebarOpen)) && (
                    <span className="ml-2 truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t p-2 space-y-1">
          {/* User Info */}
          {user && (
            <div className={cn(
              "px-3 py-2 text-sm",
              isCollapsed && !isMobile && "text-center"
            )}>
              {(!isCollapsed || (isMobile && sidebarOpen)) ? (
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10 ring-2">
                    <AvatarImage src={user.avatar || getDefaultAvatarByRole(user.role)} alt={user.name} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                  </div>
                </div>
              ) : (
                <Avatar className="w-8 h-8 mx-auto ring-1">
                  <AvatarImage src={user.avatar || getDefaultAvatarByRole(user.role)} alt={user.name} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )}

          <Link
            href="/profile"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              isCollapsed && !isMobile && "justify-center"
            )}
          >
            <User className="h-5 w-5 flex-shrink-0" />
            {(!isCollapsed || (isMobile && sidebarOpen)) && (
              <span className="ml-2">Profile</span>
            )}
          </Link>

          {/* Settings (admin only) */}
          {hasPermission("admin") && (
            <Link
              href="/settings"
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isCollapsed && !isMobile && "justify-center"
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || (isMobile && sidebarOpen)) && (
                <span className="ml-2">Settings</span>
              )}
            </Link>
          )}

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isCollapsed && !isMobile && "justify-center"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {(!isCollapsed || (isMobile && sidebarOpen)) && (
              <span className="ml-2">Logout</span>
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-4"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Book with UVA</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>
      )}

      {/* Floating notification bell for desktop */}
      {!isMobile && (
        <div className="fixed top-4 right-4 z-50">
          <NotificationBell />
        </div>
      )}

      {/* Main content */}
      <div className={cn(
        "flex-1",
        isMobile ? "mt-14 ml-0" : (isCollapsed ? "ml-16" : "ml-64")
      )}>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}