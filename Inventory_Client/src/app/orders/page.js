"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Eye,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Receipt
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import api from '@/lib/api';
import { generateInvoiceWithNotification } from '@/lib/invoiceUtils';
import { formatCurrency } from '@/lib/monetaryUtils';

const OrdersPage = () => {
  const router = useRouter();
  const { canPerformAction, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [preset, setPreset] = useState('all');
  const [startDate, setStartDate] = useState(undefined);
  const [endDate, setEndDate] = useState(undefined);

  // API data states
  const [orders, setOrders] = useState([]);
  const [kpis, setKpis] = useState({
    revenue: 0,
    totalOrders: 0,
    pending: 0,
    processing: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const canDeleteOrders = canPerformAction("delete", "orders");
  const canCreateOrders = canPerformAction("create", "orders");
  const isViewer = user?.role === 'viewer';


  // Preset options for date ranges
  const presetOptions = [
    { label: "All", value: "all" },
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "last7" },
    { label: "Last 30 days", value: "last30" },
    { label: "This month", value: "thisMonth" },
    { label: "Last month", value: "lastMonth" },
    { label: "Custom", value: "custom" }
  ];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, preset, startDate, endDate]);

  // Helper: resolve date range for presets/custom
  const resolveDateRange = useCallback(() => {
    let dateFrom, dateTo;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (preset) {
      case 'today':
        dateFrom = startOfToday;
        dateTo = endOfToday;
        break;
      case 'yesterday': {
        const yStart = new Date(startOfToday);
        yStart.setDate(yStart.getDate() - 1);
        const yEnd = new Date(endOfToday);
        yEnd.setDate(yEnd.getDate() - 1);
        dateFrom = yStart;
        dateTo = yEnd;
        break;
      }
      case 'last7': {
        const s = new Date(startOfToday);
        s.setDate(s.getDate() - 6);
        dateFrom = s;
        dateTo = endOfToday;
        break;
      }
      case 'last30': {
        const s = new Date(startOfToday);
        s.setDate(s.getDate() - 29);
        dateFrom = s;
        dateTo = endOfToday;
        break;
      }
      case 'thisMonth': {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        dateFrom = s;
        dateTo = e;
        break;
      }
      case 'lastMonth': {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        dateFrom = s;
        dateTo = e;
        break;
      }
      case 'custom': {
        if (startDate) {
          const s = new Date(startDate);
          // normalize to start-of-day
          dateFrom = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        }
        if (endDate) {
          const e = new Date(endDate);
          // normalize to end-of-day to include same-day ranges fully
          dateTo = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999);
        }
        // If both provided and equal days, above normalization already covers full day
        break;
      }
      default:
        // 'all' or unknown -> no date filters
        break;
    }

    return {
      ...(dateFrom ? { dateFrom: dateFrom.toISOString() } : {}),
      ...(dateTo ? { dateTo: dateTo.toISOString() } : {}),
    };
  }, [preset, startDate, endDate]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        // Build params: orders list uses resolved dateFrom/dateTo; analytics can use preset or resolved too
        const resolvedRange = resolveDateRange();
        const analyticsRangeParams = {
          ...(preset && preset !== 'custom' && preset !== 'all' ? { preset } : {}),
          ...(preset === 'custom' ? resolvedRange : {}),
        };

        const queryParams = {
          page: String(currentPage),
          limit: String(pageSize),
          ...(searchTerm && { search: searchTerm }),
          ...resolvedRange
        };

        const [ordersResponse, analyticsResponse] = await Promise.all([
          api.orders.getAll(queryParams),
          api.orders.getAnalytics(analyticsRangeParams)
        ]);

        const [ordersData, analyticsData] = await Promise.all([
          ordersResponse.json(),
          analyticsResponse.json()
        ]);

        if (ordersData.success) {
          setOrders(ordersData.data.orders);
          setTotalPages(ordersData.data.pagination.pages || 1);
        } else {
          setError('Failed to load orders');
        }

        if (analyticsData.success) {
          const { kpis: serverKpis } = analyticsData.data;
          setKpis({
            revenue: serverKpis.revenue || 0,
            totalOrders: serverKpis.totalOrders || 0,
            pending: serverKpis.pending || 0,
            processing: serverKpis.processing || 0,
            delivered: serverKpis.delivered || 0,
            cancelled: serverKpis.cancelled || 0,
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load orders data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, pageSize, searchTerm, preset, startDate, endDate, resolveDateRange]);


  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary', icon: Clock },
      processing: { label: 'Processing', variant: 'default', icon: Package },
      shipped: { label: 'Shipped', variant: 'default', icon: Truck },
      delivered: { label: 'Delivered', variant: 'default', icon: CheckCircle },
      cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
      refunded: { label: 'Refunded', variant: 'outline', icon: RefreshCw }
    };

    const config = statusConfig[status] || { label: status, variant: 'default', icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' },
      paid: { label: 'Paid', variant: 'default' },
      failed: { label: 'Failed', variant: 'destructive' },
      refunded: { label: 'Refunded', variant: 'outline' }
    };

    const config = statusConfig[paymentStatus] || { label: paymentStatus, variant: 'default' };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPreset('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const clearDateRange = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (preset && preset !== 'all' && preset !== 'custom') count++;
    if (preset === 'custom' && (startDate || endDate)) count++;
    return count;
  };

  // Validate date range
  const isDateRangeValid = () => {
    if (preset !== 'custom') return true;
    if (!startDate || !endDate) return true;
    return startDate <= endDate;
  };

  const handleCreateOrder = () => {
    router.push('/NewOrder');
  };

  const handleViewOrder = (id) => {
    router.push(`/orders/${id}`);
  };

  // Generate invoice for an order
  const generateInvoice = (order) => {
    generateInvoiceWithNotification(order, toast);
  };


  const handleDeleteClick = (id) => {
    setOrderToDelete(id);
    setDeleteDialogOpen(true);
  };

  const refreshOrdersData = async () => {
    try {
      const resolvedRange = resolveDateRange();
      const analyticsRangeParams = {
        ...(preset && preset !== 'custom' && preset !== 'all' ? { preset } : {}),
        ...(preset === 'custom' ? resolvedRange : {}),
      };
      const queryParams = {
        page: String(currentPage),
        limit: String(pageSize),
        ...(searchTerm && { search: searchTerm }),
        ...resolvedRange
      };
      const [ordersResponse, analyticsResponse] = await Promise.all([
        api.orders.getAll(queryParams),
        api.orders.getAnalytics(analyticsRangeParams)
      ]);

      const [ordersData, analyticsData] = await Promise.all([
        ordersResponse.json(),
        analyticsResponse.json()
      ]);

      if (ordersData.success) {
        setOrders(ordersData.data.orders);
        setTotalPages(ordersData.data.pagination.pages || 1);
      }

      if (analyticsData.success) {
        setKpis(analyticsData.data.kpis);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh orders data');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    setDeleting(true);
    try {
      const response = await api.orders.delete(orderToDelete);
      const data = await response.json();

      if (data.success) {
        toast.success('Order deleted successfully!');
        await refreshOrdersData();
      } else {
        toast.error('Failed to delete order: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order. Please try again.');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = async () => {
    setDeletingAll(true);
    try {
      const response = await api.orders.deleteAll();
      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully deleted ${data.data.deletedCount} orders and restored stock!`);
        await refreshOrdersData();
      } else {
        toast.error('Failed to delete all orders: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting all orders:', error);
      toast.error('Failed to delete all orders. Please try again.');
    } finally {
      setDeletingAll(false);
      setDeleteAllDialogOpen(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-2 sm:p-3 md:p-4 lg:p-2 overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
                <span className="truncate">Order Management</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
                Manage customer orders and track their status
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {canCreateOrders && (
                <Button
                  onClick={handleCreateOrder}
                  size="lg"
                  className="relative group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-0 rounded-lg px-6 py-3 min-w-[160px] cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                    <span className="text-base font-medium">New Order</span>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards (based on filter) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {/* Total Orders Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-primary/20 bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-primary">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{kpis.totalOrders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">In selected range</p>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-purple-700 dark:text-purple-300">Revenue</CardTitle>
                <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">₹{kpis.revenue.toLocaleString()}</div>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Paid totals</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-300">Pending</CardTitle>
                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-amber-900 dark:text-amber-100">{kpis.pending.toLocaleString()}</div>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Awaiting processing</p>
              </div>
            </CardContent>
          </Card>

          {/* Processing Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-300">Processing</CardTitle>
                <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{kpis.processing.toLocaleString()}</div>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70">In progress</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivered Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 hover:bg-green-50 dark:hover:bg-green-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-green-700 dark:text-green-300">Delivered</CardTitle>
                <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">{kpis.delivered.toLocaleString()}</div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">Completed</p>
              </div>
            </CardContent>
          </Card>

          {/* Cancelled Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-red-700 dark:text-red-300">Cancelled</CardTitle>
                <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-red-900 dark:text-red-100">{kpis.cancelled.toLocaleString()}</div>
                <p className="text-xs text-red-600/70 dark:text-red-400/70">Cancelled</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filter and Search */}
        <Card className="bg-card border border-border/60 shadow-sm mb-6 rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Search Section */}
            <div className="p-6 border-b border-border">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search orders by number, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Filters Section */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Filter Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
                    <p className="text-sm text-muted-foreground mt-1">Preset ranges or custom dates</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={refreshOrdersData}
                      variant="outline"
                      size="sm"
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 border-primary/20 px-4 py-2 font-medium"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent border-border px-4 py-2 font-medium"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                    {orders.length > 0 && canDeleteOrders && (
                      <Button
                        onClick={handleDeleteAllClick}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 border-destructive/20 px-4 py-2 font-medium"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All
                      </Button>
                    )}
                  </div>
                </div>

                {/* Primary Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Preset</label>
                    <Select value={preset} onValueChange={setPreset}>
                      <SelectTrigger className="h-11 border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="Select preset" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-border shadow-lg">
                        {presetOptions.map((p) => (
                          <SelectItem key={p.value} value={p.value} className="rounded-md">
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">From</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={preset !== 'custom'}
                          className="justify-start h-11 w-full border-input rounded-lg"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">To</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={preset !== 'custom'}
                          className="justify-start h-11 w-full border-input rounded-lg"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Date range validity note */}
                {preset === 'custom' && !isDateRangeValid() && (
                  <div className="text-xs text-destructive">Invalid date range. &quot;From&quot; should be before &quot;To&quot;.</div>
                )}

                {/* Results Count and Filter Summary */}
                <div className="space-y-3">
                  <div className="flex items-end">
                    <div className="w-full p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Results</p>
                          <p className="text-lg font-semibold text-foreground">
                            {orders.length} results
                            {/* Page No. */}
                            <span className="ml-2 text-xs text-muted-foreground">
                              Page {currentPage} of {totalPages}
                            </span>
                          </p>
                        </div>
                        {getActiveFilterCount() > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Active Filters</p>
                            <p className="text-sm font-medium text-primary">
                              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active Filters Summary */}
                  {getActiveFilterCount() > 0 && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-primary">Active Filters:</span>
                        {searchTerm && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            Search: &quot;{searchTerm}&quot;
                          </span>
                        )}
                        {preset && preset !== 'custom' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">Preset: {presetOptions.find(p => p.value === preset)?.label}</span>
                        )}
                        {startDate && endDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            Date: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                          </span>
                        )}
                        {(startDate || endDate) && !(startDate && endDate) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            Date: {startDate ? `From ${startDate.toLocaleDateString()}` : `Until ${endDate.toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="bg-card border-0 shadow-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4 animate-spin" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">Loading orders...</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Please wait while we fetch your orders.</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="bg-card border-0 shadow-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">Error loading orders</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {!loading && !error && orders.length === 0 ? (
          <Card className="bg-card border-0 shadow-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No orders found</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : !loading && !error && (
          <>
            {/* Desktop Table View */}
            <Card className="bg-card border-0 shadow-sm hidden lg:block p-2">
              <CardContent className="p-0">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Order #</TableHead>
                      <TableHead className="min-w-[150px]">Customer</TableHead>
                      <TableHead className="min-w-[100px]">Items</TableHead>
                      <TableHead className="min-w-[100px]">Total</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Payment</TableHead>
                      <TableHead className="min-w-[100px]">Date</TableHead>
                      <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-semibold text-foreground text-sm">
                            {order.orderNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground text-sm">{order.customer.name}</div>
                            {order.customer.email && (
                              <div className="text-xs text-muted-foreground">{order.customer.email}</div>
                            )}
                            {order.customer.phone && (
                              <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-bold text-foreground">{formatCurrency(order.totalAmount)}</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateInvoice(order)}
                              className="h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/20 flex-shrink-0"
                              title="Generate invoice"
                            >
                              <Receipt className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOrder(order.id)}
                              className="h-7 w-7 p-0 hover:bg-primary/10 flex-shrink-0"
                              title={isViewer ? "View order" : "View/Edit order"}
                            >
                              {isViewer ? (
                                <Eye className="h-4 w-4 text-primary" />
                              ) : (
                                <Edit className="h-4 w-4 text-primary" />
                              )}
                            </Button>
                            {order.status === 'pending' && canDeleteOrders && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(order.id)}
                                className="h-7 w-7 p-0 hover:bg-destructive/10 flex-shrink-0"
                                title="Delete order"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile/Tablet Card View */}
            <div className="space-y-3 lg:hidden">
              {orders.map((order) => (
                <Card key={order.id} className="bg-card border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      {/* Header with order number and status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-base">
                            {order.orderNumber}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{order.customer.name}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(order.status)}
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </div>
                      </div>

                      {/* Order details grid */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Items</p>
                          <p className="text-foreground font-medium">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Total</p>
                          <p className="text-foreground font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Date</p>
                          <p className="text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Customer</p>
                          <p className="text-muted-foreground truncate">{order.customer.email || 'No email'}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateInvoice(order)}
                          className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/20 flex-shrink-0"
                          title="Generate invoice"
                        >
                          <Receipt className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order.id)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 flex-shrink-0"
                          title={isViewer ? "View order" : "View/Edit order"}
                        >
                          {isViewer ? (
                            <Eye className="h-4 w-4 text-primary" />
                          ) : (
                            <Edit className="h-4 w-4 text-primary" />
                          )}
                        </Button>
                        {order.status === 'pending' && canDeleteOrders && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(order.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 flex-shrink-0"
                            title="Delete order"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Pagination - Responsive */}
        {totalPages > 1 && (
          <Pagination className="mt-4 p-3 sm:p-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap px-2">
                  Page {currentPage} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this order? This action cannot be undone and will restore the product stock.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90 text-white dark:bg-red-600 dark:hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete All Confirmation Dialog */}
        <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Orders</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete ALL orders? This action cannot be undone and will restore all product stock.
                This will permanently remove {orders.length} order{orders.length !== 1 ? 's' : ''} from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingAll}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAllConfirm}
                disabled={deletingAll}
                className="bg-destructive hover:bg-destructive/90 text-white dark:bg-red-600 dark:hover:bg-red-700"
              >
                {deletingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting All...
                  </>
                ) : (
                  'Delete All Orders'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Floating Action Button for Mobile */}
        {canCreateOrders && (
          <div className="fixed bottom-6 right-6 z-50 lg:hidden">
            <Button
              onClick={handleCreateOrder}
              size="lg"
              className="relative group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 active:scale-95 border-0 rounded-full w-14 h-14 p-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center">
                <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
              </div>
            </Button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default OrdersPage;
