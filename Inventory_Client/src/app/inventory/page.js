"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Eye,
  Trash2,
  Plus,
  BookOpen,
  TrendingUp,
  Package,
  AlertTriangle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import EditProductDialog from "@/app/_components/EditProductDialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import api from '@/lib/api';
import { Switch } from "@/components/ui/switch";

const Inventory = () => {
  const router = useRouter();
  const { canPerformAction, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All Sub Categories');
  const [selectedDistributor, setSelectedDistributor] = useState('All Distributors');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All Prices');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [selectedProductStatus, setSelectedProductStatus] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  // API data states
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStockProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  });
  const [settings, setSettings] = useState({
    stockAlertThresholds: {
      lowStockThreshold: 10,
      outOfStockThreshold: 0,
    }
  });
  const [categories, setCategories] = useState(['All Categories']);
  const [subCategories, setSubCategories] = useState(['All Sub Categories']);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const canDeleteProducts = canPerformAction("delete", "products");
  const canCreateProducts = canPerformAction("create", "products");
  const canUpdateProducts = canPerformAction("update", "products");
  const isViewer = user?.role === 'viewer';

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  // Price ranges for filtering (memoized to avoid changing dependencies)
  const priceRanges = useMemo(() => ([
    { label: "All Prices", min: 0, max: Infinity },
    { label: "Under ₹10", min: 0, max: 10 },
    { label: "₹10 - ₹15", min: 10, max: 15 },
    { label: "₹15 - ₹20", min: 15, max: 20 },
    { label: "₹20+", min: 20, max: Infinity }
  ]), []);

  // Stock status options
  const stockStatus = [
    { label: "All", value: "all" },
    { label: "In Stock", value: "in-stock" },
    { label: "Low Stock", value: "low-stock" },
    { label: "Out of Stock", value: "out-of-stock" }
  ];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubCategory, selectedDistributor, selectedPriceRange, selectedStockStatus, selectedProductStatus, sortBy]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        // Load products, stats, and settings in parallel
        // Map UI filters to API params
        const priceRange = priceRanges.find((r) => r.label === selectedPriceRange);
        const queryParams = {
          page: String(currentPage),
          limit: String(pageSize),
          ...(searchTerm && { search: searchTerm }),
          ...(selectedCategory && selectedCategory !== 'All Categories' && { category: selectedCategory }),
          ...(selectedSubCategory && selectedSubCategory !== 'All Sub Categories' && { subCategory: selectedSubCategory }),
          ...(priceRange && priceRange.label !== 'All Prices' && {
            ...(Number.isFinite(priceRange.min) ? { priceMin: String(priceRange.min) } : {}),
            ...(Number.isFinite(priceRange.max) && priceRange.max !== Infinity ? { priceMax: String(priceRange.max) } : {}),
          }),
          ...(selectedStockStatus && selectedStockStatus !== 'all' && { stockStatus: selectedStockStatus }),
          // Sort mapping
          ...(() => {
            switch (sortBy) {
              case 'price-low':
                return { sortBy: 'price', sortOrder: 'asc' };
              case 'price-high':
                return { sortBy: 'price', sortOrder: 'desc' };
              case 'stock-low':
                return { sortBy: 'stock', sortOrder: 'asc' };
              case 'stock-high':
                return { sortBy: 'stock', sortOrder: 'desc' };
              case 'gst-low':
                return { sortBy: 'gst', sortOrder: 'asc' };
              case 'gst-high':
                return { sortBy: 'gst', sortOrder: 'desc' };
              case 'title':
              default:
                return { sortBy: 'title', sortOrder: 'asc' };
            }
          })(),
        };

        const [productsResponse, statsResponse, settingsResponse] = await Promise.all([
          api.products.getAll(queryParams),
          api.stats.get(),
          api.settings.get()
        ]);

        const [productsData, statsData, settingsData] = await Promise.all([
          productsResponse.json(),
          statsResponse.json(),
          settingsResponse.json()
        ]);

        if (productsData.success) {
          setProducts(productsData.data.products);
          setTotalPages(productsData.data.pagination.pages || 1);
          setTotalItems(productsData.data.pagination?.total || productsData.data.products.length || 0);
          // Filter out any existing "All" entries to prevent duplicates
          const filteredCategories = productsData.data.filters.categories.filter(cat =>
            cat !== 'All' && cat !== 'All Categories'
          );
          const filteredSubCategories = productsData.data.filters.subCategories.filter(subCat =>
            subCat !== 'All' && subCat !== 'All Sub Categories'
          );
          setCategories(['All Categories', ...filteredCategories]);
          setSubCategories(['All Sub Categories', ...filteredSubCategories]);
          setDistributors(['All Distributors', ...(productsData.data.filters.distributors || [])]);
        } else {
          setError('Failed to load products');
        }

        if (statsData.success) {
          setStats(statsData.data);
        }

        if (settingsData.success && settingsData.data.settings) {
          setSettings(settingsData.data.settings);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load inventory data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, pageSize, searchTerm, selectedCategory, selectedSubCategory, selectedPriceRange, selectedStockStatus, sortBy, priceRanges]);

  // Filter and search products
  const filteredBooks = useMemo(() => {
    let filtered = products.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || book.distributor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'All Categories' || book.category === selectedCategory;
      const matchesSubCategory = selectedSubCategory === 'All Sub Categories' || book.subCategory === selectedSubCategory;
      const matchesDistributor = selectedDistributor === 'All Distributors' || book.distributor === selectedDistributor;

      const priceRange = priceRanges.find(range => range.label === selectedPriceRange);
      const matchesPrice = !priceRange || (book.price >= priceRange.min && book.price < priceRange.max);

      let matchesStock = true;
      const { lowStockThreshold, outOfStockThreshold } = settings.stockAlertThresholds;
      if (selectedStockStatus === 'out-of-stock') matchesStock = book.stock <= outOfStockThreshold;
      else if (selectedStockStatus === 'low-stock') matchesStock = book.stock > outOfStockThreshold && book.stock <= lowStockThreshold;
      else if (selectedStockStatus === 'in-stock') matchesStock = book.stock > lowStockThreshold;

      let matchesProductStatus = true;
      if (selectedProductStatus === 'active') matchesProductStatus = !!book.isActive;
      else if (selectedProductStatus === 'inactive') matchesProductStatus = !book.isActive;

      return matchesSearch && matchesCategory && matchesSubCategory && matchesDistributor && matchesPrice && matchesStock && matchesProductStatus;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'distributor':
          return a.distributor.localeCompare(b.distributor);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'stock-low':
          return a.stock - b.stock;
        case 'stock-high':
          return b.stock - a.stock;
        case 'gst-low':
          return a.gst - b.gst;
        case 'gst-high':
          return b.gst - a.gst;
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedSubCategory, selectedDistributor, selectedPriceRange, selectedStockStatus, selectedProductStatus, sortBy, settings, priceRanges]);

  const getStockStatus = (stock) => {
    const { lowStockThreshold, outOfStockThreshold } = settings.stockAlertThresholds;
    if (stock <= outOfStockThreshold) return { label: 'Out of Stock', variant: 'destructive' };
    if (stock <= lowStockThreshold) return { label: 'Low Stock', variant: 'secondary' };
    return { label: 'In Stock', variant: 'default' };
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedSubCategory('All Sub Categories');
    setSelectedDistributor('All Distributors');
    setSelectedPriceRange('All Prices');
    setSelectedStockStatus('all');
    setSelectedProductStatus('all');
    setSortBy('title');
  };

  const handleAddProduct = () => {
    router.push('/NewProduct');
  };

  const handleEdit = (id) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setProductToEdit(product);
      setEditDialogOpen(true);
    }
  };

  const handleDeleteClick = (id) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (id, currentIsActive) => {
    try {
      const response = await api.products.update(id, { isActive: !currentIsActive });
      const data = await response.json();
      if (data.success) {
        toast.success(!currentIsActive ? 'Product activated' : 'Product deactivated');
        await refreshInventoryData();
      } else {
        toast.error('Failed to update status: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error toggling active status', err);
      toast.error('Status update failed. Please try again.');
    }
  };

  const refreshInventoryData = async () => {
    try {
      const priceRange = priceRanges.find((r) => r.label === selectedPriceRange);
      const queryParams = {
        page: String(currentPage),
        limit: String(pageSize),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && selectedCategory !== 'All Categories' && { category: selectedCategory }),
        ...(selectedSubCategory && selectedSubCategory !== 'All Sub Categories' && { subCategory: selectedSubCategory }),
        ...(priceRange && priceRange.label !== 'All Prices' && {
          ...(Number.isFinite(priceRange.min) ? { priceMin: String(priceRange.min) } : {}),
          ...(Number.isFinite(priceRange.max) && priceRange.max !== Infinity ? { priceMax: String(priceRange.max) } : {}),
        }),
        ...(selectedStockStatus && selectedStockStatus !== 'all' && { stockStatus: selectedStockStatus }),
        ...(() => {
          switch (sortBy) {
            case 'price-low':
              return { sortBy: 'price', sortOrder: 'asc' };
            case 'price-high':
              return { sortBy: 'price', sortOrder: 'desc' };
            case 'stock-low':
              return { sortBy: 'stock', sortOrder: 'asc' };
            case 'stock-high':
              return { sortBy: 'stock', sortOrder: 'desc' };
            case 'gst-low':
              return { sortBy: 'gst', sortOrder: 'asc' };
            case 'gst-high':
              return { sortBy: 'gst', sortOrder: 'desc' };
            case 'title':
            default:
              return { sortBy: 'title', sortOrder: 'asc' };
          }
        })(),
      };

      const [productsResponse, statsResponse, settingsResponse] = await Promise.all([
        api.products.getAll(queryParams),
        api.stats.get(),
        api.settings.get()
      ]);

      const [productsData, statsData, settingsData] = await Promise.all([
        productsResponse.json(),
        statsResponse.json(),
        settingsResponse.json()
      ]);

      if (productsData.success) {
        setProducts(productsData.data.products);
        setTotalPages(productsData.data.pagination.pages || 1);
        setTotalItems(productsData.data.pagination?.total || productsData.data.products.length || 0);
        // Filter out any existing "All" entries to prevent duplicates
        const filteredCategories = productsData.data.filters.categories.filter(cat =>
          cat !== 'All' && cat !== 'All Categories'
        );
        const filteredSubCategories = productsData.data.filters.subCategories.filter(subCat =>
          subCat !== 'All' && subCat !== 'All Sub Categories'
        );
        setCategories(['All Categories', ...filteredCategories]);
        setSubCategories(['All Sub Categories', ...filteredSubCategories]);
        setDistributors(['All Distributors', ...(productsData.data.filters.distributors || [])]);
      }

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (settingsData.success && settingsData.data.settings) {
        setSettings(settingsData.data.settings);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh inventory data');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      const response = await api.products.delete(productToDelete);
      const data = await response.json();

      if (data.success) {
        toast.success('Product deleted successfully!');
        await refreshInventoryData();
      } else {
        toast.error('Failed to delete product: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setProductToEdit(null);
  };

  const handleProductUpdated = () => {
    refreshInventoryData();
  };

  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = async () => {
    setDeletingAll(true);
    try {
      const response = await api.products.deleteAll();
      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully deleted ${data.deletedCount} products!`);
        await refreshInventoryData();
      } else {
        toast.error('Failed to delete all products: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting all products:', error);
      toast.error('Failed to delete all products. Please try again.');
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
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
                <span className="truncate">Inventory Management</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
                Manage your product inventory with ease
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {canCreateProducts && (
                <Button
                  onClick={handleAddProduct}
                  size="lg"
                  className="relative group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-0 rounded-lg px-6 py-3 min-w-[160px] cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                    <span className="text-base font-medium">Add Product</span>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Total Products Card */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-700/80">Total Products</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
                  <div className="flex items-center text-xs text-blue-600/70">
                    <Package className="h-3 w-3 mr-1" />
                    <span>All items</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl"></div>
                  <div className="relative bg-blue-500/20 p-1.5 rounded-xl">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Stock Card */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-emerald-700/80">In Stock</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.inStockProducts}</p>
                  <div className="flex items-center text-xs text-emerald-600/70">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>Available</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl"></div>
                  <div className="relative bg-emerald-500/20 p-1.5 rounded-xl">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Card */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-700/80">Low Stock</p>
                  <p className="text-2xl font-bold text-amber-900">{stats.lowStockProducts}</p>
                  <div className="flex items-center text-xs text-amber-600/70">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    <span>Need restock</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl"></div>
                  <div className="relative bg-amber-500/20 p-1.5 rounded-xl">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Out of Stock Card */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-red-700/80">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-900">{stats.outOfStockProducts}</p>
                  <div className="flex items-center text-xs text-red-600/70">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    <span>Urgent restock</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/10 rounded-full blur-xl"></div>
                  <div className="relative bg-red-500/20 p-1.5 rounded-xl">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
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
                  placeholder="Search products by title or distributor..."
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
                      onClick={refreshInventoryData}
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
                    {canDeleteProducts && (
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
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="rounded-md">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Sub Category</label>
                    <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="All Sub Categories" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        {subCategories.map((subCategory) => (
                          <SelectItem key={subCategory} value={subCategory} className="rounded-md">
                            {subCategory}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Distributor</label>
                    <Select value={selectedDistributor} onValueChange={setSelectedDistributor}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="All Distributors" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        {distributors.map((distributor) => (
                          <SelectItem key={distributor} value={distributor} className="rounded-md">
                            {distributor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Price Range</label>
                    <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="All Prices" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        {priceRanges.map((range) => (
                          <SelectItem key={range.label} value={range.label} className="rounded-md">
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Secondary Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Stock Status</label>
                    <Select value={selectedStockStatus} onValueChange={setSelectedStockStatus}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="All Stock" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        {stockStatus.map((status) => (
                          <SelectItem key={status.value} value={status.value} className="rounded-md">
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Product Status</label>
                    <Select value={selectedProductStatus} onValueChange={setSelectedProductStatus}>
                      <SelectTrigger className="h-11 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                        <SelectItem value="all" className="rounded-md">All</SelectItem>
                        <SelectItem value="active" className="rounded-md">Active</SelectItem>
                        <SelectItem value="inactive" className="rounded-md">Inactive</SelectItem>
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
                        <SelectItem value="title" className="rounded-md">Title A-Z</SelectItem>
                        <SelectItem value="distributor" className="rounded-md">Distributor A-Z</SelectItem>
                        <SelectItem value="price-low" className="rounded-md">Price: Low to High</SelectItem>
                        <SelectItem value="price-high" className="rounded-md">Price: High to Low</SelectItem>
                        <SelectItem value="stock-low" className="rounded-md">Stock: Low to High</SelectItem>
                        <SelectItem value="stock-high" className="rounded-md">Stock: High to Low</SelectItem>
                        <SelectItem value="gst-low" className="rounded-md">GST: Low to High</SelectItem>
                        <SelectItem value="gst-high" className="rounded-md">GST: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Results Count */}
                  <div className="flex items-end">
                    <div className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700">Results</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {filteredBooks.length} of {totalItems}
                        <span className="ml-2 text-xs text-gray-500">
                          Page {currentPage} of {totalPages}
                        </span>
                      </p>
                    </div>
                  </div>
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
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Loading inventory...</h3>
              <p className="text-sm sm:text-base text-gray-600">Please wait while we fetch your products.</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Error loading inventory</h3>
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

        {/* Products List */}
        {!loading && !error && filteredBooks.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No products found</h3>
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
                      <TableHead className="min-w-[150px]">Product</TableHead>
                      <TableHead className="min-w-[120px]">Distributor</TableHead>
                      <TableHead className="min-w-[100px]">Category</TableHead>
                      <TableHead className="min-w-[120px]">Sub Category</TableHead>
                      <TableHead className="min-w-[80px]">Price</TableHead>
                      <TableHead className="min-w-[60px]">GST %</TableHead>
                      <TableHead className="min-w-[60px]">Stock</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooks.map((book) => {
                      const stockStatus = getStockStatus(book.stock);
                      return (
                        <TableRow key={book.id} className={!book.isActive ? "opacity-50" : ""}>
                          <TableCell>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight break-words">{book.title}</h3>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-700 leading-tight break-words">{book.distributor}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs px-2 py-1 font-medium">
                              {book.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-600 leading-tight break-words">{book.subCategory}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-bold text-gray-900">₹{parseFloat(book.price).toFixed(2)}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-600 font-medium">{book.gst}%</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-semibold text-gray-900">{book.stock}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant} className="text-xs px-2 py-1 font-medium">
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(book.id)}
                                className="h-7 w-7 p-0 hover:bg-green-100 flex-shrink-0"
                                title="Edit product"
                              >
                                {isViewer ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Edit className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                              {canUpdateProducts && (
                                <Switch
                                  checked={!!book.isActive}
                                  onCheckedChange={() => handleToggleActive(book.id, book.isActive)}
                                  disabled={!canUpdateProducts}
                                  className="scale-75"
                                  aria-label={book.isActive ? "Deactivate product" : "Activate product"}
                                />
                              )}
                              {canDeleteProducts && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(book.id)}
                                  className="h-7 w-7 p-0 hover:bg-red-100 flex-shrink-0"
                                  title="Delete product"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile/Tablet Card View */}
            <div className="space-y-3 lg:hidden">
              {filteredBooks.map((book) => {
                const stockStatus = getStockStatus(book.stock);
                return (
                  <Card key={book.id} className={`bg-white border-0 shadow-sm hover:shadow-md transition-shadow ${!book.isActive ? 'opacity-50' : ''}`}>
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {/* Header with title and status */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-gray-900 text-base flex-1 min-w-0 leading-tight">
                            {book.title}
                          </h3>
                          <Badge variant={stockStatus.variant} className="text-xs px-2 py-1 font-medium flex-shrink-0">
                            {stockStatus.label}
                          </Badge>
                        </div>

                        {/* Product details grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Distributor</p>
                            <p className="text-gray-900 font-medium truncate">{book.distributor}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Price</p>
                            <p className="text-gray-900 font-bold text-lg">₹{parseFloat(book.price).toFixed(2)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Category</p>
                            <Badge variant="outline" className="text-xs px-2 py-1 font-medium">
                              {book.category}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Stock</p>
                            <p className="text-gray-900 font-semibold text-base">{book.stock}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Sub Category</p>
                            <p className="text-gray-600 truncate">{book.subCategory}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">GST</p>
                            <p className="text-gray-600 font-medium">{book.gst}%</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(book.id)}
                            className="h-8 w-8 p-0 hover:bg-green-100 flex-shrink-0"
                            title="Edit product"
                          >
                            {isViewer ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <Edit className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          {canUpdateProducts && (
                            <Switch
                              checked={!!book.isActive}
                              onCheckedChange={() => handleToggleActive(book.id, book.isActive)}
                              disabled={!canUpdateProducts}
                              className="scale-75"
                              aria-label={book.isActive ? "Deactivate product" : "Activate product"}
                            />
                          )}
                          {canDeleteProducts && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(book.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100 flex-shrink-0"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

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
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
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
              <AlertDialogTitle className="text-red-600">Delete All Products</AlertDialogTitle>
              <div className="space-y-2">
                <AlertDialogDescription className="font-semibold text-gray-900">
                  ⚠️ WARNING: This action is irreversible!
                </AlertDialogDescription>
                <AlertDialogDescription>
                  You are about to delete <strong>ALL {products.length} products</strong> from your database.
                </AlertDialogDescription>
                <AlertDialogDescription className="text-sm text-gray-600">
                  This will permanently remove all product data including:
                </AlertDialogDescription>
                <ul className="text-sm text-gray-600 list-disc list-inside ml-4 space-y-1">
                  <li>Product titles and descriptions</li>
                  <li>Pricing and stock information</li>
                  <li>Category and distributor data</li>
                  <li>All associated product details</li>
                </ul>
                <AlertDialogDescription className="font-medium text-red-600">
                  Are you absolutely sure you want to proceed?
                </AlertDialogDescription>
              </div>
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
                    Deleting All Products...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Products
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Floating Action Button for Mobile */}
        {canCreateProducts && (
          <div className="fixed bottom-6 right-6 z-50 lg:hidden">
            <Button
              onClick={handleAddProduct}
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

        {/* Edit Product Dialog */}
        <EditProductDialog
          isOpen={editDialogOpen}
          onClose={handleEditDialogClose}
          product={productToEdit}
          categories={categories}
          subCategories={subCategories}
          distributors={distributors}
          onProductUpdated={handleProductUpdated}
          readOnly={isViewer}
        />
      </div>
    </ProtectedRoute>
  );
};

export default Inventory;