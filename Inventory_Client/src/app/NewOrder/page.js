"use client";

import React, { useState, useEffect } from 'react';
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
import Combobox from "@/components/ui/combobox";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Plus,
  Minus,
  Trash2,
  Save,
  ArrowLeft,
  ShoppingCart,
  Loader2,
  Package,
  User,
  CreditCard,
  MapPin,
  Calculator,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Truck,
  Percent,
  FileText,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Building,
  Hash,
  Table as TableIcon,
  Eye,
  ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from '@/lib/api';
import { calculateItemTotals, calculateOrderTotals, formatCurrency } from '@/lib/monetaryUtils';

const NewOrderPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [categories, setCategories] = useState(['All Categories']);
  const [orderItems, setOrderItems] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Customer information
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });

  // Order details
  const [orderDetails, setOrderDetails] = useState({
    paymentMethod: 'cash',
    shippingCharges: 0,
    discount: 0,
    notes: '',
    expectedDeliveryDate: ''
  });

  // Load products and categories
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await api.products.getAll({ limit: 1000 });
        const data = await response.json();

        if (data.success) {
          setProducts(data.data.products);
          const filteredCategories = data.data.filters.categories.filter(cat =>
            cat !== 'All' && cat !== 'All Categories'
          );
          setCategories(['All Categories', ...filteredCategories]);
        } else {
          toast.error('Failed to load products');
        }
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory;
    return matchesCategory && product.stock > 0 && product.isActive !== false;
  });

  // Add product to order
  const addProductToOrder = (product) => {
    const existingItem = orderItems.find(item => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Cannot add more items. Insufficient stock.');
        return;
      }
      setOrderItems(prev => prev.map(item =>
        item.product.id === product.id
          ? {
            ...item,
            quantity: item.quantity + 1,
            ...calculateItemTotals({
              quantity: item.quantity + 1,
              unitPrice: item.unitPrice,
              gstRate: item.gstRate
            })
          }
          : item
      ));
    } else {
      setOrderItems(prev => [...prev, {
        product: {
          id: product.id,
          title: product.title,
          price: product.price,
          gst: product.gst,
          stock: product.stock
        },
        quantity: 1,
        unitPrice: product.price,
        gstRate: product.gst,
        ...calculateItemTotals({
          quantity: 1,
          unitPrice: product.price,
          gstRate: product.gst
        })
      }]);
    }
  };

  // Update item quantity
  const updateItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromOrder(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      toast.error('Cannot add more items. Insufficient stock.');
      return;
    }

    setOrderItems(prev => prev.map(item =>
      item.product.id === productId
        ? {
          ...item,
          quantity: newQuantity,
          ...calculateItemTotals({
            quantity: newQuantity,
            unitPrice: item.unitPrice,
            gstRate: item.gstRate
          })
        }
        : item
    ));
  };

  // Remove item from order
  const removeItemFromOrder = (productId) => {
    setOrderItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Calculate totals using utility functions
  const orderTotals = calculateOrderTotals(orderItems, orderDetails.shippingCharges || 0, orderDetails.discount || 0);
  const { subtotal, totalGst, totalAmount } = orderTotals;

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Allow empty phone numbers
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 && !digits.startsWith('0');
  };

  // Validate email
  const validateEmail = (email) => {
    if (!email) return true; // Allow empty emails
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  // Validate form
  const isFormValid = () => {
    if (!customer.name.trim()) {
      toast.error('Customer name is required');
      return false;
    }
    
    // Validate phone number
    if (customer.phone && !validatePhoneNumber(customer.phone)) {
      toast.error('Phone number must be exactly 10 digits and cannot start with 0');
      return false;
    }
    
    // Validate email
    if (customer.email && !validateEmail(customer.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return false;
    }
    if (!orderDetails.paymentMethod) {
      toast.error('Payment method is required');
      return false;
    }
    return true;
  };

  // Validate stock before order submission
  const validateStockBeforeOrder = async () => {
    try {
      // Fetch fresh product data to check current stock levels
      const response = await api.products.getAll({ limit: 1000 });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch product data');
      }
      
      const freshProducts = data.data.products;
      const stockIssues = [];
      
      // Check each item in the order against fresh stock data
      for (const orderItem of orderItems) {
        const freshProduct = freshProducts.find(p => p.id === orderItem.product.id);
        
        if (!freshProduct) {
          stockIssues.push(`Product "${orderItem.product.title}" no longer exists`);
          continue;
        }
        
        if (freshProduct.stock < orderItem.quantity) {
          stockIssues.push(
            `Insufficient stock for "${orderItem.product.title}". Available: ${freshProduct.stock}, Requested: ${orderItem.quantity}`
          );
        }
      }
      
      if (stockIssues.length > 0) {
        toast.error('Stock validation failed: ' + stockIssues.join(', '));
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating stock:', error);
      toast.error('Failed to validate stock. Please try again.');
      return false;
    }
  };

  // Save order
  const handleSaveOrder = async () => {
    if (!isFormValid()) return;

    setSaving(true);
    try {
      // Validate stock before proceeding
      const stockValid = await validateStockBeforeOrder();
      if (!stockValid) {
        setSaving(false);
        return;
      }

      // Calculate totals using utility functions
      const calculatedOrderTotals = calculateOrderTotals(orderItems, orderDetails.shippingCharges || 0, orderDetails.discount || 0);
      const calculatedSubtotal = calculatedOrderTotals.subtotal;
      const calculatedTotalGst = calculatedOrderTotals.totalGst;
      const calculatedTotalAmount = calculatedOrderTotals.totalAmount;

      const orderData = {
        customer,
        items: orderItems.map(item => ({
          product: item.product.id,
          productName: item.product.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          gstRate: item.gstRate,
          gstAmount: item.gstAmount,
          finalPrice: item.finalPrice
        })),
        paymentMethod: orderDetails.paymentMethod,
        shippingCharges: orderDetails.shippingCharges || 0,
        discount: orderDetails.discount || 0,
        notes: orderDetails.notes || '',
        expectedDeliveryDate: orderDetails.expectedDeliveryDate || undefined,
        subtotal: calculatedSubtotal,
        totalGst: calculatedTotalGst,
        totalAmount: calculatedTotalAmount
      };

      const response = await api.orders.create(orderData);
      const data = await response.json();

      if (data.success) {
        toast.success('Order created successfully!');
        router.push('/orders');
      } else {
        toast.error('Failed to create order: ' + (data.error || 'Unknown error'));
        if (data.details) {
          console.error('Validation details:', data.details);
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
      {/* Responsive Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-b">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="hover:bg-slate-100 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">New Order</h1>
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Create a new order</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-xs sm:text-sm text-slate-500">Items</div>
              <div className="text-sm sm:text-lg font-semibold text-slate-900">{orderItems.length}</div>
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-sm text-slate-500">Total</div>
              <div className="text-sm sm:text-lg font-semibold text-slate-900">{formatCurrency(totalAmount)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Add Product Section */}
            <Card className="border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-700 text-base sm:text-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  Add Products
                </CardTitle>
                <p className="text-xs sm:text-sm text-slate-500">Select a category and choose products to add to your order</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Filter and Selection Row */}
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Filter by Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full h-11 sm:h-10">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Select Product</label>
                      <Combobox
                        value={selectedProduct}
                        onValueChange={(value, option) => {
                          if (option) {
                            addProductToOrder(option);
                            setSelectedProduct('');
                          }
                        }}
                        options={filteredProducts}
                        placeholder="Type to search products..."
                        getLabel={(product) => product.title}
                        getValue={(product) => product.id}
                        allowCustom={false}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Stats and Empty State */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{filteredProducts.length} products available</span>
                      </div>
                      {selectedCategory !== 'All Categories' && (
                        <Badge variant="secondary" className="text-xs">
                          {selectedCategory}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                      <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">No products available</p>
                      <p className="text-sm">Try selecting a different category or check back later</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Items ({orderItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    <p>No items added yet</p>
                    <p className="text-sm">Search and select products from above to add them to your order</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.product.id} className="border rounded-lg p-3 sm:p-4 bg-slate-50">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-base sm:text-lg truncate">{item.product.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="truncate">{item.product.distributor}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {item.product.category}
                              </Badge>
                              <span>GST: {item.gstRate}%</span>
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className={item.product.stock < 5 ? "text-red-600 font-medium" : "text-slate-600"}>
                                  Stock: {item.product.stock}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemFromOrder(item.product.id)}
                            className="text-red-600 hover:bg-red-50 flex-shrink-0 ml-2 h-10 w-10 sm:h-8 sm:w-8 p-0 touch-manipulation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-center">
                          <div className="flex items-center justify-center sm:justify-start gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                              className="h-10 w-10 sm:h-8 sm:w-8 p-0 touch-manipulation"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold text-base sm:text-lg w-12 sm:w-8 text-center bg-white rounded px-2 py-2 sm:py-1 min-h-[2.5rem] sm:min-h-0 flex items-center justify-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                              className="h-10 w-10 sm:h-8 sm:w-8 p-0 touch-manipulation"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="text-center sm:text-center">
                            <div className="text-xs sm:text-sm text-slate-600">Unit Price</div>
                            <div className="font-semibold text-sm sm:text-base">{formatCurrency(item.unitPrice)}</div>
                          </div>

                          <div className="text-center sm:text-right">
                            <div className="text-xs sm:text-sm text-slate-600">Total</div>
                            <div className="text-lg sm:text-xl font-bold text-slate-900">{formatCurrency(item.finalPrice)}</div>
                            <div className="text-xs text-slate-500">
                              ({formatCurrency(item.totalPrice)} + {formatCurrency(item.gstAmount)} GST)
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Name *</label>
                    <Input
                      placeholder="Customer name"
                      value={customer.name}
                      onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      value={customer.email}
                      onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone</label>
                    <Input
                      placeholder="Phone number"
                      value={customer.phone}
                      onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Pincode</label>
                    <Input
                      placeholder="Pincode"
                      value={customer.address.pincode}
                      onChange={(e) => setCustomer(prev => ({
                        ...prev,
                        address: { ...prev.address, pincode: e.target.value }
                      }))}
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Address</label>
                  <Input
                    placeholder="Street address"
                    value={customer.address.street}
                    onChange={(e) => setCustomer(prev => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="text-base sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">City</label>
                    <Input
                      placeholder="City"
                      value={customer.address.city}
                      onChange={(e) => setCustomer(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">State</label>
                    <Input
                      placeholder="State"
                      value={customer.address.state}
                      onChange={(e) => setCustomer(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Payment Method *</label>
                  <Select value={orderDetails.paymentMethod} onValueChange={(value) =>
                    setOrderDetails(prev => ({ ...prev, paymentMethod: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="netbanking">Net Banking</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Shipping</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={orderDetails.shippingCharges}
                      onChange={(e) => setOrderDetails(prev => ({
                        ...prev,
                        shippingCharges: Number(e.target.value) || 0
                      }))}
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Discount %</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                        value={orderDetails.discount}
                        onChange={(e) => setOrderDetails(prev => ({
                          ...prev,
                          discount: Number(e.target.value) || 0
                        }))}
                        className="text-base sm:text-sm pr-8"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Expected Delivery</label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-11 sm:h-10"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderDetails.expectedDeliveryDate ? (
                          (() => {
                            const [y, m, d] = orderDetails.expectedDeliveryDate.split('-').map(Number);
                            const localDate = new Date(y, (m || 1) - 1, d || 1);
                            return format(localDate, "PPP");
                          })()
                        ) : (
                          <span className="text-slate-500">Pick a delivery date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={orderDetails.expectedDeliveryDate ? (() => {
                          const [y, m, d] = orderDetails.expectedDeliveryDate.split('-').map(Number);
                          return new Date(y, (m || 1) - 1, d || 1);
                        })() : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateString = `${year}-${month}-${day}`;
                            setOrderDetails(prev => ({
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Notes</label>
                  <Input
                    placeholder="Order notes (optional)"
                    value={orderDetails.notes}
                    onChange={(e) => setOrderDetails(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    className="text-base sm:text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary Only */}
          <div className="space-y-4 sm:space-y-6 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">

            {/* Order Summary */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm sm:text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-sm">
                  <span>GST:</span>
                  <span>{formatCurrency(totalGst)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-sm">
                  <span>Shipping:</span>
                  <span>{formatCurrency(orderDetails.shippingCharges || 0)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-sm">
                  <span>Discount:</span>
                  <div className="text-right">
                    <div className="text-green-600">-{formatCurrency(orderTotals.discountAmount || 0)}</div>
                    <div className="text-xs text-gray-500">({orderDetails.discount || 0}%)</div>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={orderItems.length === 0 || !customer.name.trim() || saving}
                className="w-full h-11 sm:h-10 text-sm sm:text-sm"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Validating Stock & Creating Order...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create Order</span>
                    <span className="sm:hidden">Create</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full h-11 sm:h-10 text-sm sm:text-sm"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Order Creation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create this order? This will:
            </AlertDialogDescription>
            <div className="mt-2">
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Create a new order with {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}</li>
                <li>Update product stock levels</li>
                <li>Generate unique order number</li>
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveOrder}>
              Create Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </ProtectedRoute>
  );
};

export default NewOrderPage;
