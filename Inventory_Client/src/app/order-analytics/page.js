"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Loader2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';
import { formatCurrency } from '@/lib/monetaryUtils';

const OrderAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    overview: {
      totalOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0
    },
    recentOrders: [],
    topProducts: []
  });
  const [period, setPeriod] = useState('30');

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.orders.getStats({ period });
        const data = await response.json();

        if (data.success) {
          setStats(data.data);
        } else {
          toast.error('Failed to load analytics: ' + data.error);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [period]);

  const refreshData = async () => {
    try {
      const response = await api.orders.getStats({ period });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        toast.success('Analytics data refreshed');
      } else {
        toast.error('Failed to refresh analytics');
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast.error('Failed to refresh analytics');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Remove the local formatCurrency function since we're importing it from utils

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-2 sm:p-3 md:p-4 lg:p-2 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading analytics...</h3>
            <p className="text-sm text-gray-600">Please wait while we fetch the data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-3 md:p-4 lg:p-2 overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
              <span className="truncate">Order Analytics</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
              Insights and analytics for your order management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {/* Total Orders */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-700/80">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">{stats.overview.totalOrders}</p>
                <div className="flex items-center text-xs text-blue-600/70">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  <span>All time</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl"></div>
                <div className="relative bg-blue-500/20 p-1.5 rounded-xl">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-yellow-700/80">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.overview.pendingOrders}</p>
                <div className="flex items-center text-xs text-yellow-600/70">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Awaiting</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-xl"></div>
                <div className="relative bg-yellow-500/20 p-1.5 rounded-xl">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Orders */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-purple-700/80">Processing</p>
                <p className="text-2xl font-bold text-purple-900">{stats.overview.processingOrders}</p>
                <div className="flex items-center text-xs text-purple-600/70">
                  <Package className="h-3 w-3 mr-1" />
                  <span>In progress</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-xl"></div>
                <div className="relative bg-purple-500/20 p-1.5 rounded-xl">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivered Orders */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-green-700/80">Delivered</p>
                <p className="text-2xl font-bold text-green-900">{stats.overview.deliveredOrders}</p>
                <div className="flex items-center text-xs text-green-600/70">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>Completed</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/10 rounded-full blur-xl"></div>
                <div className="relative bg-green-500/20 p-1.5 rounded-xl">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancelled Orders */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-red-700/80">Cancelled</p>
                <p className="text-2xl font-bold text-red-900">{stats.overview.cancelledOrders}</p>
                <div className="flex items-center text-xs text-red-600/70">
                  <Minus className="h-3 w-3 mr-1" />
                  <span>Cancelled</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/10 rounded-full blur-xl"></div>
                <div className="relative bg-red-500/20 p-1.5 rounded-xl">
                  <Minus className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-emerald-700/80">Revenue</p>
                <p className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.overview.totalRevenue)}</p>
                <div className="flex items-center text-xs text-emerald-600/70">
                  <DollarSign className="h-3 w-3 mr-1" />
                  <span>Total</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl"></div>
                <div className="relative bg-emerald-500/20 p-1.5 rounded-xl">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
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

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No product data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {product.productName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.totalQuantity} units sold
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm text-gray-900">
                        {formatCurrency(product.totalRevenue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Revenue
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Distribution */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Order Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { status: 'pending', label: 'Pending', count: stats.overview.pendingOrders, color: 'yellow' },
              { status: 'processing', label: 'Processing', count: stats.overview.processingOrders, color: 'blue' },
              { status: 'delivered', label: 'Delivered', count: stats.overview.deliveredOrders, color: 'green' },
              { status: 'cancelled', label: 'Cancelled', count: stats.overview.cancelledOrders, color: 'red' },
            ].map((item) => {
              const percentage = stats.overview.totalOrders > 0 
                ? Math.round((item.count / stats.overview.totalOrders) * 100) 
                : 0;
              
              return (
                <div key={item.status} className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-2 rounded-full bg-${item.color}-100 flex items-center justify-center`}>
                    <span className={`text-2xl font-bold text-${item.color}-600`}>{item.count}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderAnalyticsPage;
