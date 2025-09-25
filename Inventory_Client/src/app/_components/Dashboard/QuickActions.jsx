"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Plus,
  ShoppingCart,
  Package,
  Users,
  Shield,
  Settings,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function QuickActions() {
  const { user, hasPermission } = useAuth();

  // Define quick actions based on user role
  const getQuickActions = () => {
    // For Admin: Only show the most important management actions
    if (hasPermission("admin")) {
      return [
        {
          title: "User Management",
          href: "/users",
          icon: Shield,
          color: "red",
          description: "Manage users"
        },
        {
          title: "Settings",
          href: "/settings",
          icon: Settings,
          color: "gray",
          description: "System settings"
        },
        {
          title: "Activity Logs",
          href: "/activity-logs",
          icon: Activity,
          color: "orange",
          description: "View system logs"
        }
      ];
    }

    // For Manager: Show product and order management actions
    if (hasPermission("manager")) {
      return [
        {
          title: "Add Product",
          href: "/NewProduct",
          icon: Plus,
          color: "purple",
          description: "Create new product"
        },
        {
          title: "New Order",
          href: "/NewOrder",
          icon: ShoppingCart,
          color: "emerald",
          description: "Place new order"
        },
        {
          title: "Inventory",
          href: "/inventory",
          icon: Package,
          color: "blue",
          description: "Manage products"
        },
        {
          title: "Orders",
          href: "/orders",
          icon: ShoppingCart,
          color: "green",
          description: "Manage orders"
        }
      ];
    }

    // For Viewer: Show basic viewing actions
    return [
      {
        title: "View Inventory",
        href: "/inventory",
        icon: Package,
        color: "blue",
        description: "Browse all products"
      },
      {
        title: "View Orders",
        href: "/orders",
        icon: ShoppingCart,
        color: "green",
        description: "Check order status"
      },
      {
        title: "Distributors",
        href: "/distributors",
        icon: Users,
        color: "indigo",
        description: "View suppliers"
      }
    ];
  };

  const quickActions = getQuickActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          {user?.role === 'admin'
            ? 'Manage your inventory system'
            : user?.role === 'manager'
              ? 'Manage products and orders'
              : 'View inventory and orders'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
                >
                  <div className={`p-2 rounded-lg bg-${action.color}-50 group-hover:bg-${action.color}-100 transition-colors`}>
                    <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 text-${action.color}-600`} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs sm:text-sm font-medium block">{action.title}</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-400 transition-colors hidden sm:block">
                      {action.description}
                    </span>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
