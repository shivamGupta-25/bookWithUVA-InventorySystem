"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  ArrowRight,
  Package,
  Plus,
  Search,
  BarChart,
  Settings,
  TrendingUp,
  Users,
  ShoppingCart,
  CalendarDays,
  Clock,
  User as UserIcon,
  LogIn,
  DollarSign,
  AlertTriangle,
  Activity,
  Eye,
  RefreshCw,
  Loader2,
  TrendingDown,
  Minus,
  Shield,
  Truck,
  Timer,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Clock3
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend, Label } from 'recharts';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/monetaryUtils';
import { toast } from "sonner";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    inventory: {
      totalProducts: 0,
      inStockProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      inventoryValue: 0,
      categoryStats: [],
      distributorStats: []
    },
    orders: {
      totalOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0
    },
    delivery: {
      totalDelivered: 0,
      onTimeDeliveries: 0,
      lateDeliveries: 0,
      earlyDeliveries: 0,
      onTimeRate: 0,
      avgDeliveryTime: 0,
      avgExpectedDeliveryTime: 0,
      avgDeliveryDelay: 0
    },
    recentOrders: [],
    topProducts: [],
    stockAlerts: [],
    upcomingDeliveries: [],
    overdueDeliveries: [],
    deliveryStatusDistribution: [],
    trends: {
      orderTrends: [],
      revenueTrends: [],
      deliveryTrends: [],
      deliveryByDayOfWeek: [],
      deliveryPerformanceByPeriod: []
    },
    aging: {
      agingBuckets: [],
      deadStockCount: 0,
      averageDaysSinceLastSale: 0,
      deadStockProducts: []
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all dashboard data in parallel
      const [inventoryResponse, ordersResponse, deliveryResponse, alertsResponse, agingResponse] = await Promise.all([
        api.stats.get(),
        api.orders.getStats({ period: '30' }),
        api.orders.getDeliveryStats({ period: '30' }),
        api.stockAlerts.getAll({ status: 'active', limit: '5' }),
        api.stats.getAging({ thresholdDays: '60', bucket30: '30', bucket60: '60', bucket90: '90' })
      ]);

      const [inventoryData, ordersData, deliveryData, alertsData, agingData] = await Promise.all([
        inventoryResponse.json(),
        ordersResponse.json(),
        deliveryResponse.json(),
        alertsResponse.json(),
        agingResponse.json()
      ]);

      if (inventoryData.success && ordersData.success && deliveryData.success) {
        setStats({
          inventory: {
            ...inventoryData.data,
            categoryStats: inventoryData.data.categoryStats || [],
            distributorStats: inventoryData.data.distributorStats || []
          },
          orders: ordersData.data.overview,
          delivery: deliveryData.data.overview,
          recentOrders: ordersData.data.recentOrders || [],
          topProducts: ordersData.data.topProducts || [],
          stockAlerts: alertsData.success ? alertsData.data.alerts || [] : [],
          upcomingDeliveries: deliveryData.data.upcomingDeliveries || [],
          overdueDeliveries: deliveryData.data.overdueDeliveries || [],
          deliveryStatusDistribution: deliveryData.data.deliveryStatusDistribution || [],
          trends: {
            ...ordersData.data.trends,
            deliveryTrends: deliveryData.data.trends?.deliveryTrends || [],
            deliveryByDayOfWeek: deliveryData.data.trends?.deliveryByDayOfWeek || [],
            deliveryPerformanceByPeriod: deliveryData.data.trends?.deliveryPerformanceByPeriod || []
          },
          aging: agingData && agingData.success ? agingData.data : { agingBuckets: [], deadStockCount: 0, averageDaysSinceLastSale: 0, deadStockProducts: [] }
        });
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadDashboardData();
    toast.success('Dashboard data refreshed');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col">
        <WelcomeBanner />
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading dashboard...</h3>
              <p className="text-sm text-gray-600">Please wait while we fetch your data.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 flex flex-col overflow-x-hidden">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Dashboard Content */}
      <div className="flex-1 space-y-4 sm:space-y-6">
        {/* Quick Actions */}
        <QuickActions />

        {/* Dashboard Title */}
        <div className="flex justify-center my-4 sm:my-6 lg:my-8 items-center gap-2">
          <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-slate-600" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight underline underline-offset-4 decoration-2 decoration-slate-600">Dashboard</h1>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Key Metrics</h2>
          </div>
          <KeyMetrics stats={stats} />
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <TabsList className="inline-flex h-auto p-1 bg-gray-50/80 backdrop-blur-sm rounded-2xl w-full lg:w-auto lg:flex-1 shadow-sm border border-gray-200/60 gap-1 overflow-x-auto">
              <TabsTrigger
                value="overview"
                className="flex-shrink-0 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:hover:bg-white/50 min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
              >
                <span className="truncate">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex-shrink-0 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:hover:bg-white/50 min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
              >
                <span className="truncate">Orders</span>
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="flex-shrink-0 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:hover:bg-white/50 min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
              >
                <span className="truncate">Inventory</span>
              </TabsTrigger>
              <TabsTrigger
                value="delivery"
                className="flex-shrink-0 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:hover:bg-white/50 min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
              >
                <span className="truncate">Delivery</span>
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="flex-shrink-0 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:hover:bg-white/50 min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
              >
                <span className="truncate">Alerts</span>
              </TabsTrigger>
            </TabsList>
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 shrink-0 h-9 sm:h-10 px-2 sm:px-3 lg:ml-4 rounded-xl transition-all duration-300"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Refresh
            </Button>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <OverviewCharts stats={stats} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 sm:space-y-6">
            <OrderAnalytics stats={stats} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 sm:space-y-6">
            <InventoryAnalytics stats={stats} />
            <InventoryAging stats={stats} />
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4 sm:space-y-6">
            <DeliveryAnalytics stats={stats} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4 sm:space-y-6">
            <StockAlerts stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function WelcomeBanner() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }), [now]);
  const formattedTime = useMemo(() => now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), [now]);
  const formattedLastLogin = useMemo(() => {
    if (!user?.lastLogin) return null;
    try {
      const d = new Date(user.lastLogin);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleString();
    } catch {
      return null;
    }
  }, [user?.lastLogin]);

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

  const displayName = user?.name || "there";
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Guest";

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 border border-white/10 p-3 sm:p-4 md:p-5 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        {/* Left: Greeting */}
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 sm:w-18 sm:h-18 ring-2 ring-white/10 shadow-lg shadow-white/10">
            <AvatarImage src={user?.avatar || getDefaultAvatarByRole(user?.role)} alt={displayName} />
            <AvatarFallback>
              <UserIcon className="h-4 w-4 text-white" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent truncate">
              Welcome, {displayName}
            </h1>
            <p className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 text-amber-100 border border-amber-200/20 px-2 py-0.5 text-[10px] sm:text-xs mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              <span className="capitalize font-medium text-sm">{roleLabel}</span>
            </p>
          </div>
        </div>

        {/* Right: Date/Time + Quick actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 text-white/90">
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 sm:px-2 py-1 text-[9px] sm:text-xs border border-white/15 backdrop-blur-sm ring-1 ring-white/10 whitespace-nowrap">
              <CalendarDays className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">{formattedDate}</span>
              <span className="sm:hidden">{formattedDate.split(',')[0]}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 sm:px-2 py-1 text-[9px] sm:text-xs border border-white/15 backdrop-blur-sm ring-1 ring-white/10 whitespace-nowrap">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-[10px] sm:text-sm text-white/90 max-w-full sm:max-w-lg">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[10px] sm:text-xs border border-white/15 backdrop-blur-sm ring-1 ring-white/10">
          <LogIn className="h-3 w-3" />
          Last login: {formattedLastLogin || "—"}
        </span>
        <p className="mt-4 text-white/80">
          Efficiently manage your product inventory with our comprehensive tracking system.
        </p>
      </div>
    </div>
  );
}

function QuickActions() {
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

function KeyMetrics({ stats }) {
  const metrics = [
    {
      title: "Products",
      value: stats.inventory.totalProducts,
      description: "Total items in stock"
    },
    {
      title: "Orders",
      value: stats.orders.totalOrders,
      description: "Total orders placed"
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.orders.totalRevenue),
      description: "Total sales revenue"
    },
    {
      title: "Inventory Value",
      value: formatCurrency(stats.inventory.inventoryValue),
      description: "Current stock value"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {metrics.map((metric, index) => {
        return (
          <Card key={index} className="group relative overflow-hidden border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:shadow-lg h-full">
            <CardContent className="p-2 sm:p-3 md:p-4 h-full flex flex-col">
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors mb-1 truncate">
                  {metric.value}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-600 transition-colors mb-1 truncate">
                  {metric.title}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-400 transition-colors leading-tight line-clamp-2">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function OverviewCharts({ stats }) {
  // Order status distribution data
  const orderStatusData = [
    { name: 'Pending', value: stats.orders.pendingOrders, color: '#f59e0b' },
    { name: 'Processing', value: stats.orders.processingOrders, color: '#3b82f6' },
    { name: 'Delivered', value: stats.orders.deliveredOrders, color: '#10b981' },
    { name: 'Cancelled', value: stats.orders.cancelledOrders, color: '#ef4444' }
  ];

  // Top products data
  const topProductsData = stats.topProducts.slice(0, 5).map(product => ({
    name: product.productName.length > 15 ? product.productName.substring(0, 15) + '...' : product.productName,
    fullName: product.productName,
    revenue: product.totalRevenue,
    quantity: product.totalQuantity
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Order Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Order Status Distribution
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 bg-blue-50/50 border-l-2 border-blue-200 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-gray-700">Analysis:</span> Breakdown of orders by current status. Shows the distribution of pending, processing, delivered, and cancelled orders to understand order pipeline health.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10 }}>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => {
                    // Only show labels for segments with significant values (>5%)
                    if (percent < 0.05) return '';
                    // Use shorter labels on smaller screens
                    const isSmallScreen = window.innerWidth < 640;
                    return isSmallScreen ? `${value}` : `${name}: ${value}`;
                  }}
                  labelLine={false}
                  labelStyle={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    fill: '#374151'
                  }}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} orders`,
                    `${props.payload.name} Status`
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {orderStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-600 text-xs">{item.name}</span>
                <span className="text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Selling Products
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 bg-green-50/50 border-l-2 border-green-200 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-gray-700">Revenue Focus:</span> Products ranked by total revenue generated. Calculated by summing final prices of all delivered orders for each product to identify top revenue drivers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={topProductsData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={11}
                  interval={0}
                  tick={{ fontSize: 9 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                >
                </XAxis>
                <YAxis
                  fontSize={11}
                  tick={{ fontSize: 9 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value}`}
                >
                </YAxis>
                <Tooltip
                  formatter={(value, name, props) => [
                    formatCurrency(value),
                    'Total Revenue'
                  ]}
                  labelFormatter={(label, payload) => `Product: ${payload?.[0]?.payload?.fullName || label}`}
                  contentStyle={{
                    fontSize: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No recent orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{order.orderNumber}</span>
                      <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.customer.name} • {formatDate(order.orderDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrderAnalytics({ stats }) {
  // Use real-time data from the API
  const orderTrendsData = stats.trends.orderTrends && stats.trends.orderTrends.length > 0
    ? stats.trends.orderTrends.map(trend => ({
      name: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: trend.orders || 0,
      revenue: trend.revenue || 0
    }))
    : [
      // Fallback data if no real-time data is available
      { name: 'No Data', orders: 0, revenue: 0 }
    ];

  return (
    <div className="space-y-6">
      {/* Order Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Order Trends (Last 7 Days)
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 bg-purple-50/50 border-l-2 border-purple-200 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-gray-700">Trend Analysis:</span> Daily order count and revenue trends over the past week. Bar chart shows order volume while line chart displays revenue trends to identify business growth patterns.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-1 sm:p-2">
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={orderTrendsData} margin={{ top: 0, right: 0, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  tick={{ fontSize: 9 }}
                  interval={0}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                >
                  <Label value="Date" offset={-5} position="insideBottom" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                </XAxis>
                <YAxis
                  yAxisId="left"
                  fontSize={11}
                  tick={{ fontSize: 9 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                >
                  <Label value="Number of Orders" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                </YAxis>
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  fontSize={11}
                  tick={{ fontSize: 9 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value}`}
                >
                  <Label value="Revenue (₹)" angle={90} position="insideRight" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                </YAxis>
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'orders') {
                      return [`${value} orders`, 'Order Count'];
                    } else if (name === 'revenue') {
                      return [formatCurrency(value), 'Revenue'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    fontSize: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="rect"
                  wrapperStyle={{ paddingBottom: '10px' }}
                />
                <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue" dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Order Status Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: 'Pending', count: stats.orders.pendingOrders, color: '#f59e0b', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
                { status: 'Processing', count: stats.orders.processingOrders, color: '#3b82f6', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
                { status: 'Delivered', count: stats.orders.deliveredOrders, color: '#10b981', bgColor: 'bg-green-50', textColor: 'text-green-700' },
                { status: 'Cancelled', count: stats.orders.cancelledOrders, color: '#ef4444', bgColor: 'bg-red-50', textColor: 'text-red-700' }
              ].map((item) => {
                // Calculate percentage with proper rounding
                const percentage = stats.orders.totalOrders > 0
                  ? Math.round((item.count / stats.orders.totalOrders) * 100 * 100) / 100  // Round to 2 decimal places
                  : 0;

                return (
                  <div key={item.status} className={`p-3 rounded-lg ${item.bgColor} border border-opacity-20`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className={`text-sm font-semibold ${item.textColor}`}>{item.status}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${item.textColor}`}>{item.count}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: item.color
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {/* Total verification */}
              {stats.orders.totalOrders > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Orders:</span>
                    <span className="font-semibold text-gray-900">{stats.orders.totalOrders}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(stats.orders.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Orders</span>
                <span className="text-lg font-bold">{stats.orders.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Order Value</span>
                <span className="text-lg font-bold">
                  {stats.orders.totalOrders > 0
                    ? formatCurrency(stats.orders.totalRevenue / stats.orders.totalOrders)
                    : formatCurrency(0)
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InventoryAnalytics({ stats }) {
  const stockLevelsData = [
    { name: 'In Stock', value: stats.inventory.inStockProducts, color: '#10b981' },
    { name: 'Low Stock', value: stats.inventory.lowStockProducts, color: '#f59e0b' },
    { name: 'Out of Stock', value: stats.inventory.outOfStockProducts, color: '#ef4444' }
  ];

  // Real-time category distribution data
  const categoryData = stats.inventory.categoryStats.slice(0, 5).map(cat => ({
    name: cat._id.length > 12 ? cat._id.substring(0, 12) + '...' : cat._id,
    fullName: cat._id,
    count: cat.count,
    value: cat.totalValue
  }));

  // Real-time distributor distribution data
  const distributorData = stats.inventory.distributorStats.slice(0, 5).map(dist => ({
    name: (dist.distributorName || 'Unknown').length > 12 ? (dist.distributorName || 'Unknown').substring(0, 12) + '...' : (dist.distributorName || 'Unknown'),
    fullName: dist.distributorName || 'Unknown',
    count: dist.count,
    value: dist.totalValue
  }));

  return (
    <div className="space-y-6">
      {/* Stock Levels Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Levels Distribution
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 bg-orange-50/50 border-l-2 border-orange-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Inventory Health:</span> Current inventory status across all products. Categorizes products as in-stock (above low threshold), low stock (between out-of-stock and low thresholds), or out-of-stock to monitor inventory health.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockLevelsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ value }) => `${value}`}
                    labelLine={false}
                    labelStyle={{
                      fontWeight: 'bold',
                      fill: '#374151',
                    }}
                  >
                    {stockLevelsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} products`,
                      `${props.payload.name} Status`
                    ]}
                    labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-4">
              {stockLevelsData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Inventory Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stats.inventory.totalProducts}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">In Stock</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{stats.inventory.inStockProducts}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium">Low Stock</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">{stats.inventory.lowStockProducts}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">Out of Stock</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{stats.inventory.outOfStockProducts}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.inventory.inventoryValue)}</div>
                  <div className="text-sm text-gray-600">Total Inventory Value</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category and Distributor Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Products by Category
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 bg-indigo-50/50 border-l-2 border-indigo-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Category Analysis:</span> Distribution of products across different categories. Shows product count per category to understand inventory composition and identify category performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={11}
                    interval={0}
                    tick={{ fontSize: 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  >
                    <Label value="Product Categories" offset={-5} position="insideBottom" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                  </XAxis>
                  <YAxis
                    fontSize={11}
                    tick={{ fontSize: 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  >
                    <Label value="Number of Products" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                  </YAxis>
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} products`,
                      'Product Count'
                    ]}
                    labelFormatter={(label, payload) => `Category: ${payload?.[0]?.payload?.fullName || label}`}
                    contentStyle={{
                      fontSize: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Products"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Products by Distributor
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 bg-teal-50/50 border-l-2 border-teal-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Supplier Relations:</span> Distribution of products across different distributors. Shows product count per distributor to understand supplier relationships and identify key distribution partners.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={distributorData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={11}
                    interval={0}
                    tick={{ fontSize: 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  >
                    <Label value="Distributor Names" offset={-5} position="insideBottom" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                  </XAxis>
                  <YAxis
                    fontSize={11}
                    tick={{ fontSize: 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  >
                    <Label value="Number of Products" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                  </YAxis>
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} products`,
                      'Product Count'
                    ]}
                    labelFormatter={(label, payload) => `Distributor: ${payload?.[0]?.payload?.fullName || label}`}
                    contentStyle={{
                      fontSize: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Products"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InventoryAging({ stats }) {
  const agingBuckets = stats.aging.agingBuckets || [];
  const bucketChartData = agingBuckets.map(b => ({ name: b.label, count: b.count }));

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Chart + List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Inventory Aging & Dead Stock
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 bg-red-50/50 border-l-2 border-red-200 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-gray-700">Dead Stock Alert:</span> Time since last sale and products likely to be dead stock. Analyzes products by days since last sale to identify slow-moving inventory and potential dead stock requiring attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            <div className="p-3 rounded-lg border border-purple-200/60 bg-purple-50">
              <div className="text-[11px] sm:text-xs text-gray-600">Dead Stock</div>
              <div className="text-xl sm:text-2xl font-bold text-purple-700">{stats.aging.deadStockCount}</div>
            </div>
            <div className="p-3 rounded-lg border border-indigo-200/60 bg-indigo-50">
              <div className="text-[11px] sm:text-xs text-gray-600">Avg Days Since Last Sale</div>
              <div className="text-xl sm:text-2xl font-bold text-indigo-700">{stats.aging.averageDaysSinceLastSale}</div>
            </div>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={bucketChartData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  fontSize={(typeof window !== 'undefined' && window.innerWidth < 640) ? 10 : 11}
                  tick={{ fontSize: (typeof window !== 'undefined' && window.innerWidth < 640) ? 8 : 9 }}
                  interval={0}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  angle={(typeof window !== 'undefined' && window.innerWidth < 640) ? -35 : -10}
                  textAnchor="end"
                  height={(typeof window !== 'undefined' && window.innerWidth < 640) ? 38 : 46}
                />
                <YAxis
                  fontSize={(typeof window !== 'undefined' && window.innerWidth < 640) ? 10 : 11}
                  tick={{ fontSize: (typeof window !== 'undefined' && window.innerWidth < 640) ? 8 : 9 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip
                  formatter={(value) => [`${value} products`, 'Count']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Products" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="text-sm font-semibold text-gray-900">Top Dead Stock Products</div>
            {stats.aging.deadStockProducts.length === 0 ? (
              <div className="text-xs text-gray-500">No dead stock detected</div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {stats.aging.deadStockProducts.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 sm:p-2.5 border rounded-md hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{p.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                        <span>Stock: {p.stock}</span>
                        {p.neverSold ? (
                          <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-1.5 py-0.5 text-[10px] sm:text-[11px]">Never sold</span>
                        ) : p.daysSinceLastSale != null ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-1.5 py-0.5 text-[10px] sm:text-[11px]">{p.daysSinceLastSale} days</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StockAlerts({ stats }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Stock Alerts
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 bg-amber-50/50 border-l-2 border-amber-200 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-gray-700">Stock Alerts:</span> Products that need immediate attention. Shows products with low stock or out-of-stock status based on configured thresholds to prevent stockouts and maintain inventory levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.stockAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No active stock alerts</p>
              <p className="text-sm">All products are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.stockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{alert.productName}</span>
                      <Badge className={`text-xs ${alert.alertType === 'low-stock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {alert.alertType === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Current stock: {alert.currentStock} units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {alert.currentStock} units
                    </div>
                    <div className="text-xs text-gray-500">
                      Threshold: {alert.threshold}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DeliveryAnalytics({ stats }) {
  // Delivery performance data
  const deliveryPerformanceData = [
    { name: 'On Time', value: stats.delivery.onTimeDeliveries, color: '#10b981' },
    { name: 'Late', value: stats.delivery.lateDeliveries, color: '#ef4444' },
    { name: 'Early', value: stats.delivery.earlyDeliveries, color: '#3b82f6' }
  ];

  // Delivery trends data
  const deliveryTrendsData = stats.trends.deliveryTrends && stats.trends.deliveryTrends.length > 0
    ? stats.trends.deliveryTrends.map(trend => ({
      name: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      deliveries: trend.deliveries || 0,
      avgDeliveryTime: trend.avgDeliveryTime || 0
    }))
    : [
      { name: 'No Data', deliveries: 0, avgDeliveryTime: 0 }
    ];

  // Delivery by day of week data
  const deliveryByDayData = stats.trends.deliveryByDayOfWeek || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Delivery Performance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">On-Time Rate</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mt-1">{stats.delivery.onTimeRate}%</p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Avg Delivery Time</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 mt-1">{stats.delivery.avgDeliveryTime} days</p>
              </div>
              <Timer className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Delivered</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 mt-1">{stats.delivery.totalDelivered}</p>
              </div>
              <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Avg Delay</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600 mt-1">{stats.delivery.avgDeliveryDelay} days</p>
              </div>
              <Clock3 className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Performance Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart className="h-4 w-4 sm:h-5 sm:w-5" />
              Delivery Performance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600 bg-emerald-50/50 border-l-2 border-emerald-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Performance Metrics:</span> Breakdown of deliveries by performance. Categorizes deliveries as on-time (delivered on or before expected date), late (after expected date), or early (more than 1 day before expected date) to measure delivery efficiency.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48 sm:h-64 md:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={deliveryPerformanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={window.innerWidth < 640 ? 40 : 50}
                    outerRadius={window.innerWidth < 640 ? 70 : 85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value, percent }) => {
                      if (percent < 0.05) return '';
                      const isSmallScreen = window.innerWidth < 640;
                      const isVerySmallScreen = window.innerWidth < 480;
                      if (isVerySmallScreen) return `${value}`;
                      if (isSmallScreen) return `${name}: ${value}`;
                      return `${name}: ${value}`;
                    }}
                    labelLine={false}
                    labelStyle={{
                      fontSize: window.innerWidth < 640 ? '8px' : '10px',
                      fontWeight: 'bold',
                      fill: '#374151'
                    }}
                  >
                    {deliveryPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} deliveries`,
                      `${props.payload.name}`
                    ]}
                    labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-3 sm:mt-4">
              {deliveryPerformanceData.map((item, index) => (
                <div key={index} className="text-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs sm:text-sm font-medium truncate">{item.name}</span>
                  </div>
                  <div className="text-sm sm:text-base lg:text-lg font-bold">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Delivery Trends (Last 7 Days)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600 bg-cyan-50/50 border-l-2 border-cyan-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Delivery Trends:</span> Daily delivery count and average delivery time. Bar chart shows delivery volume while line chart displays average delivery time in days to track delivery performance trends.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-1">
            <div className="h-48 sm:h-64 md:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={deliveryTrendsData}
                  margin={{
                    top: 15,
                    right: 0,
                    left: 0,
                    bottom: 0
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    interval={0}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    angle={window.innerWidth < 640 ? -45 : 0}
                    textAnchor={window.innerWidth < 640 ? 'end' : 'middle'}
                    height={window.innerWidth < 640 ? 50 : 60}
                  >
                  </XAxis>
                  <YAxis
                    yAxisId="left"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    width={window.innerWidth < 640 ? 30 : 40}
                  >
                  </YAxis>
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    tickFormatter={(value) => `${value}d`}
                    width={window.innerWidth < 640 ? 30 : 40}
                  >
                  </YAxis>
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'deliveries') {
                        return [`${value} deliveries`, 'Delivery Count'];
                      } else if (name === 'avgDeliveryTime') {
                        return [`${value} days`, 'Avg Delivery Time'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      fontSize: window.innerWidth < 640 ? '11px' : '12px',
                      padding: window.innerWidth < 640 ? '8px' : '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{
                      fontWeight: 'bold',
                      color: '#374151',
                      marginBottom: '4px',
                      fontSize: window.innerWidth < 640 ? '11px' : '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={window.innerWidth < 640 ? 30 : 36}
                    iconType="rect"
                    wrapperStyle={{
                      paddingBottom: window.innerWidth < 640 ? '5px' : '10px',
                      fontSize: window.innerWidth < 640 ? '11px' : '12px'
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="deliveries"
                    fill="#3b82f6"
                    name="Deliveries"
                    radius={[2, 2, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgDeliveryTime"
                    stroke="#10b981"
                    strokeWidth={window.innerWidth < 640 ? 2 : 3}
                    name="Avg Time"
                    dot={{
                      fill: '#10b981',
                      strokeWidth: window.innerWidth < 640 ? 1 : 2,
                      r: window.innerWidth < 640 ? 3 : 4
                    }}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming and Overdue Deliveries */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Upcoming Deliveries (Next 7 Days)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600 bg-yellow-50/50 border-l-2 border-yellow-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Upcoming Schedule:</span> Orders scheduled for delivery in the next week. Shows upcoming deliveries to help plan logistics and ensure timely order fulfillment.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.upcomingDeliveries.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm sm:text-base">No upcoming deliveries</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                {stats.upcomingDeliveries.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <span className="font-medium text-xs sm:text-sm text-gray-900 truncate">{order.orderNumber}</span>
                        <Badge className={`text-xs px-1.5 py-0.5 ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {order.customer.name} • Expected: {formatDate(order.expectedDeliveryDate)}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-semibold text-xs sm:text-sm text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Overdue Deliveries
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600 bg-rose-50/50 border-l-2 border-rose-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Urgent Attention:</span> Orders past their expected delivery date. Identifies overdue orders requiring immediate attention to maintain customer satisfaction and delivery performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.overdueDeliveries.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-green-300" />
                <p className="text-sm sm:text-base">No overdue deliveries</p>
                <p className="text-xs sm:text-sm">All deliveries are on track!</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                {stats.overdueDeliveries.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <span className="font-medium text-xs sm:text-sm text-gray-900 truncate">{order.orderNumber}</span>
                        <Badge className={`text-xs px-1.5 py-0.5 ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {order.customer.name} • Expected: {formatDate(order.expectedDeliveryDate)}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-semibold text-xs sm:text-sm text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delivery Performance by Day of Week */}
      {deliveryByDayData.length > 0 && (
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart className="h-4 w-4 sm:h-5 sm:w-5" />
              Delivery Performance by Day of Week
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600 bg-violet-50/50 border-l-2 border-violet-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Weekly Patterns:</span> This chart analyzes delivery performance patterns across days of the week. <strong className="underline">Blue bars</strong> show the number of deliveries completed each day (Sunday=1, Monday=2, etc.). <strong className="underline">Green line</strong> shows average <span className="underline font-medium">delivery time in days from order date to delivery date</span>. <span className="underline font-medium">Use this to identify which days have the most deliveries and which days have faster/slower delivery times.</span> <span className="underline font-medium">Lower line values indicate faster deliveries, while higher bars show busier delivery days.</span> This helps optimize delivery scheduling and resource allocation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-48 sm:h-64 md:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={deliveryByDayData}
                  margin={{
                    top: 15,
                    right: 0,
                    left: 0,
                    bottom: 0
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    interval={0}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    angle={window.innerWidth < 640 ? -45 : 0}
                    textAnchor={window.innerWidth < 640 ? 'end' : 'middle'}
                    height={window.innerWidth < 640 ? 50 : 60}
                  >
                  </XAxis>
                  <YAxis
                    yAxisId="left"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    width={window.innerWidth < 640 ? 30 : 40}
                  >
                  </YAxis>
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    tickFormatter={(value) => `${value}d`}
                    width={window.innerWidth < 640 ? 30 : 40}
                  >
                  </YAxis>
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'deliveryCount') {
                        return [`${value} deliveries`, 'Delivery Count'];
                      } else if (name === 'avgDeliveryTime') {
                        return [`${value} days`, 'Avg Delivery Time'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Day: ${label}`}
                    contentStyle={{
                      fontSize: window.innerWidth < 640 ? '11px' : '12px',
                      padding: window.innerWidth < 640 ? '8px' : '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{
                      fontWeight: 'bold',
                      color: '#374151',
                      marginBottom: '4px',
                      fontSize: window.innerWidth < 640 ? '11px' : '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={window.innerWidth < 640 ? 30 : 36}
                    iconType="rect"
                    wrapperStyle={{
                      paddingBottom: window.innerWidth < 640 ? '5px' : '10px',
                      fontSize: window.innerWidth < 640 ? '11px' : '12px'
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="deliveryCount"
                    fill="#3b82f6"
                    name="Delivery Count"
                    radius={[2, 2, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgDeliveryTime"
                    stroke="#10b981"
                    strokeWidth={window.innerWidth < 640 ? 2 : 3}
                    name="Avg Time"
                    dot={{
                      fill: '#10b981',
                      strokeWidth: window.innerWidth < 640 ? 1 : 2,
                      r: window.innerWidth < 640 ? 3 : 4
                    }}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions
function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}