"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateRangePicker from "@/components/ui/DateRangePicker";
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
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [sortBy, setSortBy] = useState('orderDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState(undefined);
  const [endDate, setEndDate] = useState(undefined);

  // API data states
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0
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


  // Order status options
  const orderStatusOptions = [
    { label: "All Status", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Processing", value: "processing" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Refunded", value: "refunded" }
  ];

  const paymentStatusOptions = [
    { label: "All Payment", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Paid", value: "paid" },
    { label: "Failed", value: "failed" },
    { label: "Refunded", value: "refunded" }
  ];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedPaymentStatus, sortBy, sortOrder, startDate, endDate]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        // Load orders and stats in parallel
        const queryParams = {
          page: String(currentPage),
          limit: String(pageSize),
          ...(searchTerm && { search: searchTerm }),
          ...(selectedStatus && selectedStatus !== 'all' && { status: selectedStatus }),
          ...(selectedPaymentStatus && selectedPaymentStatus !== 'all' && { paymentStatus: selectedPaymentStatus }),
          ...(startDate && { dateFrom: startDate.toISOString() }),
          ...(endDate && { dateTo: endDate.toISOString() }),
          sortBy,
          sortOrder,
        };

        const [ordersResponse, statsResponse] = await Promise.all([
          api.orders.getAll(queryParams),
          api.orders.getStats()
        ]);

        const [ordersData, statsData] = await Promise.all([
          ordersResponse.json(),
          statsResponse.json()
        ]);

        if (ordersData.success) {
          setOrders(ordersData.data.orders);
          setTotalPages(ordersData.data.pagination.pages || 1);
        } else {
          setError('Failed to load orders');
        }

        if (statsData.success) {
          setStats(statsData.data.overview);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load orders data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, pageSize, searchTerm, selectedStatus, selectedPaymentStatus, sortBy, sortOrder, startDate, endDate]);

  // Enhanced filtering logic
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      // Search filtering
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer.email && order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filtering
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.paymentStatus === selectedPaymentStatus;

      // Enhanced date range filtering
      const orderDate = new Date(order.orderDate);
      let matchesDateRange = true;

      if (startDate || endDate) {
        // Normalize dates to start of day for accurate comparison
        const orderDateStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

        if (startDate) {
          const startDateStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          matchesDateRange = matchesDateRange && orderDateStart >= startDateStart;
        }

        if (endDate) {
          const endDateEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
          matchesDateRange = matchesDateRange && orderDate <= endDateEnd;
        }
      }

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDateRange;
    });

    // Sort orders
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'orderDate':
          aValue = new Date(a.orderDate);
          bValue = new Date(b.orderDate);
          break;
        case 'totalAmount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'customer':
          aValue = a.customer.name;
          bValue = b.customer.name;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [orders, searchTerm, selectedStatus, selectedPaymentStatus, sortBy, sortOrder, startDate, endDate]);

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
    setSelectedStatus('all');
    setSelectedPaymentStatus('all');
    setSortBy('orderDate');
    setSortOrder('desc');
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
    if (selectedStatus !== 'all') count++;
    if (selectedPaymentStatus !== 'all') count++;
    if (startDate || endDate) count++;
    return count;
  };

  // Validate date range
  const isDateRangeValid = () => {
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
      const queryParams = {
        page: String(currentPage),
        limit: String(pageSize),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus && selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedPaymentStatus && selectedPaymentStatus !== 'all' && { paymentStatus: selectedPaymentStatus }),
        ...(startDate && { dateFrom: startDate.toISOString() }),
        ...(endDate && { dateTo: endDate.toISOString() }),
        sortBy,
        sortOrder,
      };
      const [ordersResponse, statsResponse] = await Promise.all([
        api.orders.getAll(queryParams),
        api.orders.getStats()
      ]);

      const [ordersData, statsData] = await Promise.all([
        ordersResponse.json(),
        statsResponse.json()
      ]);

      if (ordersData.success) {
        setOrders(ordersData.data.orders);
        setTotalPages(ordersData.data.pagination.pages || 1);
      }

      if (statsData.success) {
        setStats(statsData.data.overview);
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
                <span className="truncate">Order Management</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {/* Total Orders Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-blue-200 bg-blue-50/50 hover:bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-blue-700">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-blue-900">{stats.totalOrders.toLocaleString()}</div>
                <p className="text-xs text-blue-600/70">
                  All orders
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Orders Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-amber-200 bg-amber-50/50 hover:bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-amber-700">
                  Pending
                </CardTitle>
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-amber-900">{stats.pendingOrders.toLocaleString()}</div>
                <p className="text-xs text-amber-600/70">
                  Awaiting
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Processing Orders Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-purple-200 bg-purple-50/50 hover:bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-purple-700">
                  Processing
                </CardTitle>
                <Package className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-purple-900">{stats.processingOrders.toLocaleString()}</div>
                <p className="text-xs text-purple-600/70">
                  In progress
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Delivered Orders Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-green-200 bg-green-50/50 hover:bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-green-700">
                  Delivered
                </CardTitle>
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-green-900">{stats.deliveredOrders.toLocaleString()}</div>
                <p className="text-xs text-green-600/70">
                  Completed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cancelled Orders Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-red-200 bg-red-50/50 hover:bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-red-700">
                  Cancelled
                </CardTitle>
                <XCircle className="h-3.5 w-3.5 text-red-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-red-900">{stats.cancelledOrders.toLocaleString()}</div>
                <p className="text-xs text-red-600/70">
                  Cancelled
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue Card */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-emerald-700">
                  Revenue
                </CardTitle>
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div>
                <div
                  className="text-lg font-bold text-emerald-900 cursor-help"
                  title={stats.totalRevenue >= 1000 ? `₹${stats.totalRevenue.toLocaleString()}` : undefined}
                >
                  ₹{stats.totalRevenue >= 1000000
                    ? `${(stats.totalRevenue / 1000000).toFixed(1)}M`
                    : stats.totalRevenue >= 1000
                      ? `${(stats.totalRevenue / 1000).toFixed(1)}K`
                      : stats.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-emerald-600/70">
                  Total
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white border border-gray-200/60 shadow-sm mb-6 rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Search Section */}
            <div className="p-6 border-b border-gray-100">
              <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search orders by number, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Filters Section */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Filter Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    <p className="text-sm text-gray-500 mt-1">Refine your search results</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={refreshOrdersData}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 px-4 py-2 font-medium"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200 px-4 py-2 font-medium"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                    {orders.length > 0 && canDeleteOrders && (
                      <Button
                        onClick={handleDeleteAllClick}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-4 py-2 font-medium"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All
                      </Button>
                    )}
                  </div>
                </div>

                {/* Primary Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Order Status</label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        {orderStatusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value} className="rounded-md">
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Payment Status</label>
                    <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="All Payment" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        {paymentStatusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value} className="rounded-md">
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="Sort Options" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        <SelectItem value="orderDate" className="rounded-md">Order Date</SelectItem>
                        <SelectItem value="totalAmount" className="rounded-md">Total Amount</SelectItem>
                        <SelectItem value="status" className="rounded-md">Status</SelectItem>
                        <SelectItem value="customer" className="rounded-md">Customer Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Sort Order</label>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="Sort Order" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        <SelectItem value="desc" className="rounded-md">Newest First</SelectItem>
                        <SelectItem value="asc" className="rounded-md">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date Range</label>
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onClear={clearDateRange}
                  />
                </div>

                {/* Results Count and Filter Summary */}
                <div className="space-y-3">
                  <div className="flex items-end">
                    <div className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Results</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {filteredOrders.length} of {orders.length}
                            {/* Page No. */}
                            <span className="ml-2 text-xs text-gray-500">
                              Page {currentPage} of {totalPages}
                            </span>
                          </p>
                        </div>
                        {getActiveFilterCount() > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Active Filters</p>
                            <p className="text-sm font-medium text-blue-600">
                              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active Filters Summary */}
                  {getActiveFilterCount() > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-blue-700">Active Filters:</span>
                        {searchTerm && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Search: &quot;{searchTerm}&quot;
                          </span>
                        )}
                        {selectedStatus !== 'all' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Status: {orderStatusOptions.find(s => s.value === selectedStatus)?.label}
                          </span>
                        )}
                        {selectedPaymentStatus !== 'all' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Payment: {paymentStatusOptions.find(s => s.value === selectedPaymentStatus)?.label}
                          </span>
                        )}
                        {startDate && endDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Date: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                          </span>
                        )}
                        {(startDate || endDate) && !(startDate && endDate) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
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
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-3 sm:mb-4 animate-spin" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Loading orders...</h3>
              <p className="text-sm sm:text-base text-gray-600">Please wait while we fetch your orders.</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Error loading orders</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {!loading && !error && filteredOrders.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-sm sm:text-base text-gray-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : !loading && !error && (
          <>
            {/* Desktop Table View */}
            <Card className="bg-white border-0 shadow-sm hidden lg:block p-2">
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
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-semibold text-gray-900 text-sm">
                            {order.orderNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{order.customer.name}</div>
                            {order.customer.email && (
                              <div className="text-xs text-gray-500">{order.customer.email}</div>
                            )}
                            {order.customer.phone && (
                              <div className="text-xs text-gray-500">{order.customer.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateInvoice(order)}
                              className="h-7 w-7 p-0 hover:bg-green-100 flex-shrink-0"
                              title="Generate invoice"
                            >
                              <Receipt className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOrder(order.id)}
                              className="h-7 w-7 p-0 hover:bg-blue-100 flex-shrink-0"
                              title={isViewer ? "View order" : "View/Edit order"}
                            >
                              {isViewer ? (
                                <Eye className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Edit className="h-4 w-4 text-blue-600" />
                              )}
                            </Button>
                            {order.status === 'pending' && canDeleteOrders && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(order.id)}
                                className="h-7 w-7 p-0 hover:bg-red-100 flex-shrink-0"
                                title="Delete order"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
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
              {filteredOrders.map((order) => (
                <Card key={order.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      {/* Header with order number and status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{order.customer.name}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(order.status)}
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </div>
                      </div>

                      {/* Order details grid */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Items</p>
                          <p className="text-gray-900 font-medium">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Total</p>
                          <p className="text-gray-900 font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Date</p>
                          <p className="text-gray-600">{new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Customer</p>
                          <p className="text-gray-600 truncate">{order.customer.email || 'No email'}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateInvoice(order)}
                          className="h-8 w-8 p-0 hover:bg-green-100 flex-shrink-0"
                          title="Generate invoice"
                        >
                          <Receipt className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order.id)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 flex-shrink-0"
                          title={isViewer ? "View order" : "View/Edit order"}
                        >
                          {isViewer ? (
                            <Eye className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Edit className="h-4 w-4 text-blue-600" />
                          )}
                        </Button>
                        {order.status === 'pending' && canDeleteOrders && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(order.id)}
                            className="h-8 w-8 p-0 hover:bg-red-100 flex-shrink-0"
                            title="Delete order"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-4 p-3 sm:p-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
            >
              Previous
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
            >
              Next
            </Button>
          </div>
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
                className="bg-red-600 hover:bg-red-700"
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
                className="bg-red-600 hover:bg-red-700"
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
