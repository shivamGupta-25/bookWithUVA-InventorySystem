"use client";

import React, { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RefreshCw,
  ArrowLeft,
  Edit,
  Save,
  Trash2,
  ShoppingCart,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  CreditCard,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Loader2,
  AlertTriangle,
  FileText,
  Download,
  Receipt,
  Eye
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api from '@/lib/api';
import { generateInvoiceWithNotification } from '@/lib/invoiceUtils';

const OrderDetailPage = ({ params }) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const { canPerformAction, user } = useAuth();
  const canDeleteOrders = canPerformAction("delete", "orders");
  const isViewer = user?.role === 'viewer';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItems, setEditingItems] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Editable fields
  const [editData, setEditData] = useState({
    status: '',
    paymentStatus: '',
    notes: '',
    cancellationReason: '',
    refundAmount: 0,
    refundReason: '',
    customer: {
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: ''
      }
    },
    paymentMethod: '',
    shippingCharges: 0,
    discount: 0,
    expectedDeliveryDate: '',
    items: []
  });

  // Order status options
  const orderStatusOptions = [
    { value: "pending", label: "Pending", icon: Clock, color: "secondary" },
    { value: "processing", label: "Processing", icon: Package, color: "default" },
    { value: "shipped", label: "Shipped", icon: Truck, color: "default" },
    { value: "delivered", label: "Delivered", icon: CheckCircle, color: "default" },
    { value: "cancelled", label: "Cancelled", icon: XCircle, color: "destructive" },
    { value: "refunded", label: "Refunded", icon: RefreshCw, color: "outline" }
  ];

  const paymentStatusOptions = [
    { value: "pending", label: "Pending", color: "secondary" },
    { value: "paid", label: "Paid", color: "default" },
    { value: "failed", label: "Failed", color: "destructive" },
    { value: "refunded", label: "Refunded", color: "outline" }
  ];

  const paymentMethodOptions = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "upi", label: "UPI" },
    { value: "netbanking", label: "Net Banking" },
    { value: "wallet", label: "Wallet" }
  ];

  // Handle scroll behavior and prevent unwanted scrolling
  useEffect(() => {
    // Prevent scroll restoration on page load
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Cleanup function to restore default behavior
    return () => {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Load order data
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        // Store current scroll position
        const scrollY = window.scrollY;

        const response = await api.orders.getById(resolvedParams.id);
        const data = await response.json();

        if (data.success) {
          setOrder(data.data);
          setEditData({
            status: data.data.status,
            paymentStatus: data.data.paymentStatus,
            notes: data.data.notes || '',
            cancellationReason: data.data.cancellationReason || '',
            refundAmount: data.data.refundAmount || 0,
            refundReason: data.data.refundReason || '',
            customer: {
              name: data.data.customer.name || '',
              email: data.data.customer.email || '',
              phone: data.data.customer.phone || '',
              address: {
                street: data.data.customer.address?.street || '',
                city: data.data.customer.address?.city || '',
                state: data.data.customer.address?.state || '',
                pincode: data.data.customer.address?.pincode || '',
                country: data.data.customer.address?.country || 'India'
              }
            },
            paymentMethod: data.data.paymentMethod || '',
            shippingCharges: data.data.shippingCharges || 0,
            discount: data.data.discount || 0,
            expectedDeliveryDate: data.data.expectedDeliveryDate ? (() => {
              const date = new Date(data.data.expectedDeliveryDate);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })() : '',
            items: data.data.items || []
          });

          // Restore scroll position after a brief delay to ensure DOM is updated
          setTimeout(() => {
            window.scrollTo(0, scrollY);
          }, 50);
        } else {
          toast.error('Failed to load order: ' + data.error);
          router.push('/orders');
        }
      } catch (error) {
        console.error('Error loading order:', error);
        toast.error('Failed to load order');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [resolvedParams.id, router]);

  // Update item quantity
  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;

    // Get the current item to check stock
    const currentItem = editData.items[index];
    if (!currentItem || !currentItem.product) return;

    // Check if we have product stock information
    const product = currentItem.product;
    if (product && typeof product === 'object' && product.stock !== undefined) {
      // Calculate available stock considering current order's impact
      // For pending orders, stock is already reserved, so we need to add current quantity back
      const currentOrderQuantity = currentItem.quantity || 0;
      const availableStock = order.status === 'pending'
        ? product.stock + currentOrderQuantity
        : product.stock;

      if (newQuantity > availableStock) {
        toast.error(`Insufficient stock! Available: ${availableStock}, Requested: ${newQuantity}`);
        return;
      }
    }

    setEditData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice,
            gstAmount: (newQuantity * item.unitPrice * item.gstRate) / 100,
            finalPrice: newQuantity * item.unitPrice + ((newQuantity * item.unitPrice * item.gstRate) / 100)
          }
          : item
      )
    }));
  };

  // Remove item from order
  const removeItem = (index) => {
    setEditData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Cancel editing and reset data
  const handleCancel = () => {
    setEditing(false);
    setEditingItems(false);
    // Reset edit data to original order data
    if (order) {
      setEditData({
        status: order.status,
        paymentStatus: order.paymentStatus,
        notes: order.notes || '',
        cancellationReason: order.cancellationReason || '',
        refundAmount: order.refundAmount || 0,
        refundReason: order.refundReason || '',
        customer: {
          name: order.customer.name || '',
          email: order.customer.email || '',
          phone: order.customer.phone || '',
          address: {
            street: order.customer.address?.street || '',
            city: order.customer.address?.city || '',
            state: order.customer.address?.state || '',
            pincode: order.customer.address?.pincode || '',
            country: order.customer.address?.country || 'India'
          }
        },
        paymentMethod: order.paymentMethod || '',
        shippingCharges: order.shippingCharges || 0,
        discount: order.discount || 0,
        expectedDeliveryDate: order.expectedDeliveryDate ? (() => {
          const date = new Date(order.expectedDeliveryDate);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })() : '',
        items: order.items || []
      });
    }
  };

  // Save changes
  const handleSave = async () => {
    // Validation
    if (!editData.customer.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    // Validate phone number
    if (editData.customer.phone) {
      const digits = editData.customer.phone.replace(/\D/g, '');
      if (digits.length !== 10 || digits.startsWith('0')) {
        toast.error('Phone number must be exactly 10 digits and cannot start with 0');
        return;
      }
    }

    // Validate email with more comprehensive regex
    if (editData.customer.email) {
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(editData.customer.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    if (editData.shippingCharges < 0) {
      toast.error('Shipping charges cannot be negative');
      return;
    }

    if (editData.discount < 0) {
      toast.error('Discount percentage cannot be negative');
      return;
    }
    if (editData.discount > 100) {
      toast.error('Discount percentage cannot exceed 100%');
      return;
    }

    if (editData.items.length === 0) {
      toast.error('Order must have at least one item');
      return;
    }

    setSaving(true);
    try {
      // Only send the fields that have actually changed to optimize the request
      const updatePayload = {};

      // Check which fields have changed from the original order
      if (editData.status !== order.status) {
        updatePayload.status = editData.status;
      }

      if (editData.paymentStatus !== order.paymentStatus) {
        updatePayload.paymentStatus = editData.paymentStatus;
      }

      if (editData.notes !== (order.notes || '')) {
        updatePayload.notes = editData.notes;
      }

      if (editData.cancellationReason !== (order.cancellationReason || '')) {
        updatePayload.cancellationReason = editData.cancellationReason;
      }

      if (editData.refundAmount !== (order.refundAmount || 0)) {
        updatePayload.refundAmount = editData.refundAmount;
      }

      if (editData.refundReason !== (order.refundReason || '')) {
        updatePayload.refundReason = editData.refundReason;
      }

      // Check customer changes
      const customerChanged =
        editData.customer.name !== order.customer.name ||
        editData.customer.email !== (order.customer.email || '') ||
        editData.customer.phone !== (order.customer.phone || '') ||
        editData.customer.address.street !== (order.customer.address?.street || '') ||
        editData.customer.address.city !== (order.customer.address?.city || '') ||
        editData.customer.address.state !== (order.customer.address?.state || '') ||
        editData.customer.address.pincode !== (order.customer.address?.pincode || '') ||
        editData.customer.address.country !== (order.customer.address?.country || '');

      if (customerChanged) {
        updatePayload.customer = editData.customer;
      }

      if (editData.paymentMethod !== order.paymentMethod) {
        updatePayload.paymentMethod = editData.paymentMethod;
      }

      if (editData.shippingCharges !== (order.shippingCharges || 0)) {
        updatePayload.shippingCharges = editData.shippingCharges;
      }

      if (editData.discount !== (order.discount || 0)) {
        updatePayload.discount = editData.discount;
      }

      const originalExpectedDeliveryDate = order.expectedDeliveryDate ? (() => {
        const date = new Date(order.expectedDeliveryDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })() : '';

      if (editData.expectedDeliveryDate !== originalExpectedDeliveryDate) {
        updatePayload.expectedDeliveryDate = editData.expectedDeliveryDate;
      }

      // Check if items have changed
      const itemsChanged = JSON.stringify(editData.items) !== JSON.stringify(order.items);
      if (itemsChanged) {
        updatePayload.items = editData.items;
      }

      const response = await api.orders.update(resolvedParams.id, updatePayload);
      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
        setEditing(false);
        setEditingItems(false);
        toast.success('Order updated successfully!');
      } else {
        toast.error('Failed to update order: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  // Delete order
  const handleDelete = async () => {
    setSaving(true);
    try {
      const response = await api.orders.delete(resolvedParams.id);
      const data = await response.json();

      if (data.success) {
        toast.success('Order deleted successfully!');
        router.push('/orders');
      } else {
        toast.error('Failed to delete order: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } finally {
      setSaving(false);
      setShowDeleteDialog(false);
    }
  };

  // Generate invoice
  const generateInvoice = () => {
    if (!order) return;
    generateInvoiceWithNotification(order, toast);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = orderStatusOptions.find(s => s.value === status);
    if (!statusConfig) return <Badge variant="default">{status}</Badge>;

    const Icon = statusConfig.icon;
    return (
      <Badge variant={statusConfig.color} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = paymentStatusOptions.find(s => s.value === paymentStatus);
    if (!statusConfig) return <Badge variant="default">{paymentStatus}</Badge>;

    return (
      <Badge variant={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Maintain consistent header structure */}
        <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="hover:bg-slate-100 flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 truncate">
                  Loading...
                </h1>
                <p className="text-sm sm:text-base text-slate-500 hidden sm:block">
                  Please wait
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading content with consistent spacing */}
        <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 pb-16 lg:pb-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium mb-2">Loading order...</h3>
                <p className="text-sm text-muted-foreground">Please wait while we fetch the order details.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        {/* Maintain consistent header structure */}
        <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="hover:bg-slate-100 flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 truncate">
                  Order Not Found
                </h1>
                <p className="text-sm sm:text-base text-slate-500 hidden sm:block">
                  The order doesn&apos;t exist
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error content with consistent spacing */}
        <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 pb-16 lg:pb-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Order not found</h3>
                <p className="text-sm text-muted-foreground mb-4">The order you&apos;re looking for doesn&apos;t exist.</p>
                <Button onClick={() => router.push('/orders')} className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen scroll-smooth bg-background">
      {/* Enhanced Header */}
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="hover:bg-accent flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground truncate">
                Order #{order.orderNumber}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
                Placed on {new Date(order.orderDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Desktop status indicators */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm font-semibold text-foreground">
                  {getStatusBadge(order.status)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Payment</div>
                <div className="text-sm font-semibold text-foreground">
                  {getPaymentStatusBadge(order.paymentStatus)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Method</div>
                <div className="text-sm font-semibold text-foreground">
                  {getPaymentStatusBadge(order.paymentMethod)}
                </div>
              </div>
            </div>
          </div>

        </div>
        {/* Mobile status indicators */}
        <div className="sm:hidden w-full gap-4">
          <div className="flex gap-4">
            {getStatusBadge(order.status)}
            {getPaymentStatusBadge(order.paymentStatus)}
            {getPaymentStatusBadge(order.paymentMethod)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 pb-16 lg:pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Order Status and Payment */}
            <Card className="border-2 border-border hover:border-border/80 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  Order Status & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Order Status</label>
                    {editing ? (
                      <Select value={editData.status} onValueChange={(value) =>
                        setEditData(prev => ({ ...prev, status: value }))
                      }>
                        <SelectTrigger className="h-9 text-sm touch-manipulation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value} className="text-sm">
                              <div className="flex items-center gap-2">
                                <status.icon className="h-4 w-4" />
                                {status.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center p-2 bg-muted rounded-lg">
                        {getStatusBadge(order.status)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Status</label>
                    {editing ? (
                      <Select value={editData.paymentStatus} onValueChange={(value) =>
                        setEditData(prev => ({ ...prev, paymentStatus: value }))
                      }>
                        <SelectTrigger className="h-9 text-sm touch-manipulation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentStatusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value} className="text-sm">
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center p-2 bg-muted rounded-lg">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </div>
                    )}
                  </div>
                </div>

                {editing && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Order Notes</label>
                      <textarea
                        className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none"
                        rows={3}
                        placeholder="Add order notes or special instructions..."
                        value={editData.notes}
                        onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>

                    {editData.status === 'cancelled' && (
                      <div className="space-y-2 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                        <label className="text-sm font-medium text-destructive">Cancellation Reason</label>
                        <textarea
                          className="min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none"
                          rows={2}
                          placeholder="Please provide a reason for cancellation..."
                          value={editData.cancellationReason}
                          onChange={(e) => setEditData(prev => ({ ...prev, cancellationReason: e.target.value }))}
                        />
                      </div>
                    )}

                    {editData.paymentStatus === 'refunded' && (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Refund Amount</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter refund amount"
                            value={editData.refundAmount}
                            onChange={(e) => setEditData(prev => ({ ...prev, refundAmount: Number(e.target.value) || 0 }))}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Refund Reason</label>
                          <textarea
                            className="min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none"
                            rows={2}
                            placeholder="Please provide a reason for refund..."
                            value={editData.refundReason}
                            onChange={(e) => setEditData(prev => ({ ...prev, refundReason: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="border-2 border-border hover:border-border/80 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    {editing ? (
                      <Input
                        type="text"
                        placeholder="Enter customer name"
                        value={editData.customer.name}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          customer: { ...prev.customer, name: e.target.value }
                        }))}
                        className="h-9 text-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{order.customer.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    {editing ? (
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={editData.customer.email}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          customer: { ...prev.customer, email: e.target.value }
                        }))}
                        className="h-9 text-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{order.customer.email || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    {editing ? (
                      <Input
                        type="tel"
                        placeholder="Enter phone number"
                        value={editData.customer.phone}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          customer: { ...prev.customer, phone: e.target.value }
                        }))}
                        className="h-9 text-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{order.customer.phone || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    {editing ? (
                      <Select value={editData.paymentMethod} onValueChange={(value) =>
                        setEditData(prev => ({ ...prev, paymentMethod: value }))
                      }>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethodOptions.map((method) => (
                            <SelectItem key={method.value} value={method.value} className="text-sm">
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize font-medium">{order.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Delivery Address</label>
                  {editing ? (
                    <div className="space-y-3 p-3 bg-muted rounded-lg border">
                      <Input
                        type="text"
                        placeholder="Street Address"
                        value={editData.customer.address.street}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          customer: {
                            ...prev.customer,
                            address: { ...prev.customer.address, street: e.target.value }
                          }
                        }))}
                        className="h-9 text-sm"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          type="text"
                          placeholder="City"
                          value={editData.customer.address.city}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            customer: {
                              ...prev.customer,
                              address: { ...prev.customer.address, city: e.target.value }
                            }
                          }))}
                          className="h-9 text-sm"
                        />
                        <Input
                          type="text"
                          placeholder="State"
                          value={editData.customer.address.state}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            customer: {
                              ...prev.customer,
                              address: { ...prev.customer.address, state: e.target.value }
                            }
                          }))}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          type="text"
                          placeholder="Pincode"
                          value={editData.customer.address.pincode}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            customer: {
                              ...prev.customer,
                              address: { ...prev.customer.address, pincode: e.target.value }
                            }
                          }))}
                          className="h-9 text-sm"
                        />
                        <Input
                          type="text"
                          placeholder="Country"
                          value={editData.customer.address.country}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            customer: {
                              ...prev.customer,
                              address: { ...prev.customer.address, country: e.target.value }
                            }
                          }))}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm space-y-1">
                        {order.customer.address.street && <div className="font-medium">{order.customer.address.street}</div>}
                        <div className="text-muted-foreground">
                          {order.customer.address.city && order.customer.address.city}
                          {order.customer.address.state && `, ${order.customer.address.state}`}
                          {order.customer.address.pincode && ` - ${order.customer.address.pincode}`}
                        </div>
                        {order.customer.address.country && <div className="text-muted-foreground">{order.customer.address.country}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Order Financial Details */}
            <Card className="border-2 border-border hover:border-border/80 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="p-1.5 pr-2.5 pl-2.5 bg-green-100 dark:bg-green-900/20 rounded-full text-xs font-bold text-green-600 dark:text-green-400">₹</span>
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-500" />
                      Shipping Charges
                    </label>
                    {editing ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium text-sm">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 text-sm bg-background"
                          placeholder="0.00"
                          value={editData.shippingCharges}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            shippingCharges: Number(e.target.value) || 0
                          }))}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">₹{(order.shippingCharges || 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="text-green-600 font-bold text-sm">-</span>
                      Discount %
                    </label>
                    {editing ? (
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full pl-3 pr-8 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 text-sm bg-background"
                          placeholder="0"
                          value={editData.discount}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            discount: Number(e.target.value) || 0
                          }))}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 font-medium text-sm">%</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-800">
                        <span className="text-sm text-green-600 dark:text-green-400 font-semibold">-₹{((order.subtotal + order.totalGst) * (order.discount || 0) / 100).toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">({order.discount || 0}%)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-purple-500" />
                    Expected Delivery Date
                  </label>
                  {editing ? (
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal p-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 text-sm h-9"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editData.expectedDeliveryDate ? (
                            format(new Date(editData.expectedDeliveryDate), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editData.expectedDeliveryDate ? new Date(editData.expectedDeliveryDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              // Use timezone-safe date conversion to avoid day shift issues
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const dateString = `${year}-${month}-${day}`;

                              setEditData(prev => ({
                                ...prev,
                                expectedDeliveryDate: dateString
                              }));
                              setCalendarOpen(false);
                            }
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {order.expectedDeliveryDate
                          ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          : 'Not set'
                        }
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="border-2 border-slate-200 hover:border-slate-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShoppingCart className="h-4 w-4" />
                    Order Items ({editing ? editData.items.length : order.items.length})
                  </CardTitle>
                  {editing && order.status === 'pending' && !isViewer && (
                    <Button
                      onClick={() => setEditingItems(!editingItems)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-sm touch-manipulation"
                    >
                      {editingItems ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-2" />
                          Done Editing
                        </>
                      ) : (
                        <>
                          <Edit className="h-3 w-3 mr-2" />
                          Edit Items
                        </>
                      )}
                    </Button>
                  )}
                  {editing && order.status !== 'pending' && (
                    <div className="text-sm text-muted-foreground">
                      Items can only be edited for pending orders
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-2">
                          <TableHead className="font-semibold text-foreground text-sm sm:text-base">Product Details</TableHead>
                          <TableHead className="text-center font-semibold text-foreground text-sm sm:text-base">Quantity</TableHead>
                          <TableHead className="text-right font-semibold text-foreground text-sm sm:text-base">Unit Price</TableHead>
                          <TableHead className="text-right font-semibold text-foreground text-sm sm:text-base">GST</TableHead>
                          <TableHead className="text-right font-semibold text-foreground text-sm sm:text-base">Total</TableHead>
                          {editing && editingItems && <TableHead className="text-center font-semibold text-foreground text-sm sm:text-base">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(editing ? editData.items : order.items).map((item, index) => (
                          <TableRow key={index} className="hover:bg-accent/50 transition-colors duration-200">
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground">{item.productName}</div>
                                {item.product && (
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {item.product.category}
                                    </Badge>
                                    <span>•</span>
                                    <span>{item.product.subCategory}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {editing && editingItems ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                      disabled={item.quantity <= 1}
                                      className="h-6 w-6 p-0 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all duration-200 text-xs"
                                    >
                                      -
                                    </Button>
                                    <span className="w-10 text-center font-medium bg-muted rounded-lg py-1 text-sm">{item.quantity}</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                      className="h-6 w-6 p-0 rounded-lg hover:bg-green-50 hover:border-green-200 transition-all duration-200 text-xs"
                                    >
                                      +
                                    </Button>
                                  </div>
                                  {item.product && typeof item.product === 'object' && item.product.stock !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      Stock: {order.status === 'pending'
                                        ? item.product.stock + item.quantity
                                        : item.product.stock}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="secondary" className="font-medium">
                                  {item.quantity}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="text-xs">
                                {item.gstRate}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              ₹{item.finalPrice.toFixed(2)}
                            </TableCell>
                            {editing && editingItems && (
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg transition-all duration-200 h-7 w-7 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {(editing ? editData.items : order.items).map((item, index) => (
                    <div key={index} className="p-3 border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-sm truncate">{item.productName}</h4>
                            {item.product && (
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {item.product.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground truncate">{item.product.subCategory}</span>
                              </div>
                            )}
                          </div>
                          {editing && editingItems && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItem(index)}
                              className="text-destructive hover:text-destructive hover:bg-red-50 flex-shrink-0 ml-2 h-7 w-7 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-muted-foreground text-xs">Unit Price</span>
                            <div className="font-semibold text-slate-900 text-sm">₹{item.unitPrice.toFixed(2)}</div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-muted-foreground text-xs">GST</span>
                            <div className="font-semibold text-slate-900 text-sm">{item.gstRate}%</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Quantity:</span>
                            {editing && editingItems ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="h-6 w-6 p-0 rounded-lg hover:bg-red-50 hover:border-red-200 text-xs"
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center font-semibold bg-slate-100 rounded-lg py-1 text-xs">{item.quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                    className="h-6 w-6 p-0 rounded-lg hover:bg-green-50 hover:border-green-200 text-xs"
                                  >
                                    +
                                  </Button>
                                </div>
                                {item.product && typeof item.product === 'object' && item.product.stock !== undefined && (
                                  <span className="text-xs text-muted-foreground">
                                    Stock: {order.status === 'pending'
                                      ? item.product.stock + item.quantity
                                      : item.product.stock}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary" className="font-semibold text-sm px-2 py-1">
                                {item.quantity}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="font-bold text-green-600 text-base">₹{item.finalPrice.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {editing && editingItems && editData.items.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="p-4 bg-muted rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No items in this order</h3>
                    <p className="text-sm text-muted-foreground">Add items from the inventory or create a new order.</p>
                  </div>
                )}
                {editing && editingItems && order.status === 'pending' && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Editing Mode:</span>
                        <p className="mt-1">You can modify quantities or remove items. Changes will be saved when you click &quot;Save&quot;.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card className="border-2 border-slate-200 hover:border-slate-300 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarIcon className="h-4 w-4" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0"></div>
                    <div className="text-sm">
                      <div className="font-semibold">Order Placed</div>
                      <div className="text-muted-foreground">{format(new Date(order.orderDate), "PPP 'at' p")}</div>
                    </div>
                  </div>

                  {order.expectedDeliveryDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full flex-shrink-0"></div>
                      <div className="text-sm">
                        <div className="font-semibold">Expected Delivery</div>
                        <div className="text-muted-foreground">{format(new Date(order.expectedDeliveryDate), "PPP 'at' p")}</div>
                      </div>
                    </div>
                  )}

                  {order.deliveredDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="text-sm">
                        <div className="font-semibold">Delivered</div>
                        <div className="text-muted-foreground">{format(new Date(order.deliveredDate), "PPP 'at' p")}</div>
                      </div>
                    </div>
                  )}

                  {order.cancelledDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-destructive rounded-full flex-shrink-0"></div>
                      <div className="text-sm">
                        <div className="font-semibold">Cancelled</div>
                        <div className="text-muted-foreground">{format(new Date(order.cancelledDate), "PPP 'at' p")}</div>
                      </div>
                    </div>
                  )}

                  {order.refundDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <div className="text-sm">
                        <div className="font-semibold">Refunded</div>
                        <div className="text-muted-foreground">{format(new Date(order.refundDate), "PPP 'at' p")}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Notes */}
            {order.notes && (
              <Card className="border-2 border-slate-200 hover:border-slate-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-3 sm:space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Action Buttons */}
            <Card className="hidden lg:block border border-slate-200 hover:border-slate-300 transition-colors">
              <CardContent className="p-3">
                <div className="flex flex-col gap-2">
                  {!editing ? (
                    <>
                      <Button
                        onClick={generateInvoice}
                        variant="default"
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-8 text-sm"
                      >
                        <Receipt className="h-3 w-3 mr-2" />
                        Generate Invoice
                      </Button>
                      {!isViewer && (
                        <Button
                          onClick={() => setEditing(true)}
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-sm"
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          Edit Order
                        </Button>
                      )}
                      {order.status === 'pending' && canDeleteOrders && (
                        <Button
                          onClick={() => setShowDeleteDialog(true)}
                          variant="outline"
                          size="sm"
                          className="w-full text-destructive hover:text-destructive h-8 text-sm"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete Order
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="flex-1 h-8 text-sm"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="border-2 border-slate-200 hover:border-slate-300 transition-colors gap-1.5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-base font-bold text-green-600">₹</span>
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className={editing ? "text-blue-600 font-medium" : ""}>
                      ₹{editing
                        ? editData.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
                        : order.subtotal.toFixed(2)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST:</span>
                    <span className={editing ? "text-blue-600 font-medium" : ""}>
                      ₹{editing
                        ? editData.items.reduce((sum, item) => sum + item.gstAmount, 0).toFixed(2)
                        : order.totalGst.toFixed(2)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span className={editing ? "text-blue-600 font-medium" : ""}>
                      ₹{(editing ? editData.shippingCharges : (order.shippingCharges || 0)).toFixed(2)}
                    </span>
                  </div>

                  {/* Total after GST + Shipping */}
                  <div className="border-t border-border pt-2 mt-3">
                    <div className="flex justify-between text-sm font-semibold text-foreground">
                      <span>Total (GST + shipping):</span>
                      <span className={editing ? "text-blue-600" : ""}>
                        ₹{editing
                          ? (() => {
                            const subtotal = editData.items.reduce((sum, item) => sum + item.totalPrice, 0);
                            const totalGst = editData.items.reduce((sum, item) => sum + item.gstAmount, 0);
                            return (subtotal + totalGst + editData.shippingCharges).toFixed(2);
                          })()
                          : (order.subtotal + order.totalGst + (order.shippingCharges || 0)).toFixed(2)
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      Discount
                      <span className="ml-1 text-xs text-muted-foreground align-middle">
                        ({editing ? (editData.discount ?? 0) : (order.discount ?? 0)}%)
                      </span>
                      :
                    </span>
                    <div className="text-right">
                      <span className={`text-green-600 ${editing ? "font-medium" : ""}`}>
                        -₹{editing
                          ? (() => {
                            const subtotal = editData.items.reduce((sum, item) => sum + item.totalPrice, 0);
                            const totalGst = editData.items.reduce((sum, item) => sum + item.gstAmount, 0);
                            return ((subtotal + totalGst) * (editData.discount || 0) / 100).toFixed(2);
                          })()
                          : ((order.subtotal + order.totalGst) * (order.discount || 0) / 100).toFixed(2)
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-base font-bold">
                    <span>Final Amount:</span>
                    <span className={editing ? "text-blue-600" : ""}>
                      ₹{editing
                        ? (() => {
                          const subtotal = editData.items.reduce((sum, item) => sum + item.totalPrice, 0);
                          const totalGst = editData.items.reduce((sum, item) => sum + item.gstAmount, 0);
                          const discountAmount = (subtotal + totalGst) * (editData.discount || 0) / 100;
                          return (subtotal + totalGst + editData.shippingCharges - discountAmount).toFixed(2);
                        })()
                        : order.totalAmount.toFixed(2)
                      }
                    </span>
                  </div>
                  {editing && (
                    <div className="text-xs text-muted-foreground mt-1">
                      * Total will be recalculated when saved
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg p-3 safe-area-pb">
        <div className="flex gap-2 max-w-full">
          {!editing ? (
            <>
              <Button
                onClick={generateInvoice}
                className="flex-1 h-9 text-sm bg-green-600 hover:bg-green-700 text-white min-w-0"
                size="sm"
              >
                <Receipt className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="hidden xs:inline truncate">Invoice</span>
                <span className="xs:hidden">Inv</span>
              </Button>
              {!isViewer && (
                <Button
                  onClick={() => setEditing(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-sm min-w-0"
                >
                  <Edit className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="hidden xs:inline truncate">Edit</span>
                  <span className="xs:hidden">Edit</span>
                </Button>
              )}
              {order.status === 'pending' && canDeleteOrders && (
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive h-9 text-sm min-w-0 flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="hidden xs:inline">Delete</span>
                  <span className="xs:hidden">Del</span>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-sm min-w-0"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                className="flex-1 h-9 text-sm min-w-0"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin flex-shrink-0" />
                    <span className="hidden xs:inline truncate">Saving...</span>
                    <span className="xs:hidden">Save...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">Save</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone and will restore the product stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive hover:bg-destructive/90 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              {saving ? (
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
    </div>
  );
};

export default OrderDetailPage;
