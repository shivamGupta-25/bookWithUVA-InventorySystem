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
                  className="w-full h-auto p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-accent hover:border-border/80 transition-all duration-200 group"
                >
                  <div className={`p-2 rounded-lg transition-colors ${
                    action.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30' :
                    action.color === 'gray' ? 'bg-gray-50 dark:bg-gray-900/20 group-hover:bg-gray-100 dark:group-hover:bg-gray-900/30' :
                    action.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30' :
                    action.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30' :
                    action.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30' :
                    action.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30' :
                    action.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 group-hover:bg-green-100 dark:group-hover:bg-green-900/30' :
                    action.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30' :
                    'bg-gray-50 dark:bg-gray-900/20 group-hover:bg-gray-100 dark:group-hover:bg-gray-900/30'
                  }`}>
                    <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      action.color === 'red' ? 'text-red-600 dark:text-red-400' :
                      action.color === 'gray' ? 'text-gray-600 dark:text-gray-400' :
                      action.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                      action.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                      action.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                      action.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      action.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      action.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs sm:text-sm font-medium block">{action.title}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors hidden sm:block">
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
