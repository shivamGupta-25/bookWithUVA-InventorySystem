"use client";

import React, { useEffect, useState, Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";
import api from '@/lib/api';
import { toast } from "sonner";
import { DashboardFilterProvider, useDashboardFilters } from '@/contexts/DashboardFilterContext';
import AdvancedFilters from './Dashboard/AdvancedFilters';
import FilterSummary from './Dashboard/FilterSummary';

// Lazy load components
const WelcomeBanner = lazy(() => import('./Dashboard/WelcomeBanner'));
const QuickActions = lazy(() => import('./Dashboard/QuickActions'));
const KeyMetrics = lazy(() => import('./Dashboard/KeyMetrics'));
const OverviewCharts = lazy(() => import('./Dashboard/OverviewCharts'));
const OrderAnalytics = lazy(() => import('./Dashboard/OrderAnalytics'));
const InventoryAnalytics = lazy(() => import('./Dashboard/InventoryAnalytics'));
const InventoryAging = lazy(() => import('./Dashboard/InventoryAging'));
const StockAlerts = lazy(() => import('./Dashboard/StockAlerts'));
const DeliveryAnalytics = lazy(() => import('./Dashboard/DeliveryAnalytics'));

// Loading component for Suspense fallback
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Dashboard content component that uses filters
function DashboardContent() {
  const { getFilterParams } = useDashboardFilters();
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
  }, [getFilterParams]);

  // Reload data when filters change
  useEffect(() => {
    loadDashboardData();
  }, [getFilterParams]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get current filter parameters
      const filterParams = getFilterParams();

      // Load all dashboard data in parallel with filter parameters
      const [inventoryResponse, ordersResponse, deliveryResponse, alertsResponse, agingResponse] = await Promise.all([
        api.stats.get(filterParams),
        api.orders.getStats(filterParams),
        api.orders.getDeliveryStats(filterParams),
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
        <Suspense fallback={<ComponentLoader />}>
          <WelcomeBanner />
        </Suspense>
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-foreground mb-2">Loading dashboard...</h3>
              <p className="text-sm text-muted-foreground">Please wait while we fetch your data.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 flex flex-col overflow-x-hidden">
      {/* Welcome Banner */}
      <Suspense fallback={<ComponentLoader />}>
        <WelcomeBanner />
      </Suspense>

      {/* Dashboard Content */}
      <div className="flex-1 space-y-4 sm:space-y-6">
        {/* Quick Actions */}
        <Suspense fallback={<ComponentLoader />}>
          <QuickActions />
        </Suspense>

        {/* Dashboard Title */}
        <div className="flex justify-center my-4 sm:my-6 lg:my-8 items-center gap-2">
          <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-muted-foreground" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight underline underline-offset-4 decoration-2 decoration-muted-foreground">Dashboard</h1>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Key Metrics</h2>
          </div>
          <Suspense fallback={<ComponentLoader />}>
            <KeyMetrics stats={stats} />
          </Suspense>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters />

        {/* Filter Summary */}
        <FilterSummary />

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <TabsList className="inline-flex h-auto p-1 bg-muted/80 backdrop-blur-sm rounded-2xl w-full lg:w-auto lg:flex-1 shadow-sm border border-border/60 gap-1 overflow-x-auto">
              <TabsTrigger
                value="overview"
                className="flex-shrink-0 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-border/50 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-background/50 min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
              >
                <span className="truncate">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex-shrink-0 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-border/50 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-background/50 min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
              >
                <span className="truncate">Orders</span>
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="flex-shrink-0 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-border/50 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-background/50 min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
              >
                <span className="truncate">Inventory</span>
              </TabsTrigger>
              <TabsTrigger
                value="delivery"
                className="flex-shrink-0 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-border/50 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-background/50 min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
              >
                <span className="truncate">Delivery</span>
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="flex-shrink-0 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-border/50 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-background/50 min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
              >
                <span className="truncate">Alerts</span>
              </TabsTrigger>
            </TabsList>
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="text-primary hover:text-primary/80 hover:bg-primary/10 border-primary/20 shrink-0 h-9 sm:h-10 px-2 sm:px-3 lg:ml-4 rounded-xl transition-all duration-300"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Refresh
            </Button>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <Suspense fallback={<ComponentLoader />}>
              <OverviewCharts stats={stats} />
            </Suspense>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 sm:space-y-6">
            <Suspense fallback={<ComponentLoader />}>
              <OrderAnalytics stats={stats} />
            </Suspense>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 sm:space-y-6">
            <Suspense fallback={<ComponentLoader />}>
              <InventoryAnalytics stats={stats} />
            </Suspense>
            <Suspense fallback={<ComponentLoader />}>
              <InventoryAging stats={stats} />
            </Suspense>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4 sm:space-y-6">
            <Suspense fallback={<ComponentLoader />}>
              <DeliveryAnalytics stats={stats} />
            </Suspense>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4 sm:space-y-6">
            <Suspense fallback={<ComponentLoader />}>
              <StockAlerts stats={stats} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Main Dashboard component with filter provider
export default function Dashboard() {
  return (
    <DashboardFilterProvider>
      <DashboardContent />
    </DashboardFilterProvider>
  );
}