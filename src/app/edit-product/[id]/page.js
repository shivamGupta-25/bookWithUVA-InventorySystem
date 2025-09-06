"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';

const EditProduct = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    distributor: '',
    category: '',
    subCategory: '',
    price: '',
    stock: '',
    gst: 18,
    description: ''
  });

  // Load product data and filter options
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load product data and filter options in parallel
        const [productResponse, filtersResponse] = await Promise.all([
          api.products.getById(productId),
          api.products.getAll({ limit: 1 })
        ]);

        const [productData, filtersData] = await Promise.all([
          productResponse.json(),
          filtersResponse.json()
        ]);

        if (productData.success) {
          const product = productData.data;
          setFormData({
            title: product.title || '',
            distributor: product.distributor || '',
            category: product.category || '',
            subCategory: product.subCategory || '',
            price: product.price || '',
            stock: product.stock || '',
            gst: product.gst || 18,
            description: product.description || ''
          });
        } else {
          toast.error('Product not found');
        }

        if (filtersData.success) {
          setCategories(filtersData.data.filters.categories);
          setSubCategories(filtersData.data.filters.subCategories);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId]);

  const handleInputChange = (field, value) => {
    // Handle decimal formatting for price and GST
    if (field === 'price' || field === 'gst') {
      // Allow only numbers and one decimal point
      const cleanValue = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      } else {
        value = cleanValue;
      }
      // Limit decimal places to 2 for price, 2 for GST
      if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
      }
    } else if (field === 'stock') {
      // Allow only whole numbers for stock
      value = value.replace(/[^0-9]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['title', 'distributor', 'category', 'subCategory', 'price', 'stock'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    // Validate price
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price (must be a positive number)');
      return false;
    }
    if (price > 999999.99) {
      toast.error('Price cannot exceed ₹999,999.99');
      return false;
    }

    // Validate stock
    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) {
      toast.error('Please enter a valid stock quantity (must be a positive whole number)');
      return false;
    }
    if (stock > 999999) {
      toast.error('Stock quantity cannot exceed 999,999');
      return false;
    }

    // Validate GST
    const gst = parseFloat(formData.gst);
    if (isNaN(gst) || gst < 0 || gst > 100) {
      toast.error('GST must be between 0 and 100');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);

    try {
      const response = await api.products.update(productId, {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        gst: parseFloat(formData.gst)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product updated successfully!');
        // Redirect to inventory after 2 seconds
        setTimeout(() => {
          router.push('/inventory');
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading product data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </Button>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-1">Update the product information below.</p>
            </div>
          </div>
        </div>


        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Product Title *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter product title"
                    className="w-full"
                  />
                </div>

              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Distributor *
                </label>
                <Input
                  type="text"
                  value={formData.distributor}
                  onChange={(e) => handleInputChange('distributor', e.target.value)}
                  placeholder="Enter distributor name"
                  className="w-full"
                />
              </div>

              {/* Category and Sub-category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat !== 'All').map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Sub-category *
                  </label>
                  <Select value={formData.subCategory} onValueChange={(value) => handleInputChange('subCategory', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.filter(sub => sub !== 'All').map((subCategory) => (
                        <SelectItem key={subCategory} value={subCategory}>
                          {subCategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pricing and Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Price (₹) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Stock Quantity *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    placeholder="0"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    GST (%) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.gst}
                    onChange={(e) => handleInputChange('gst', e.target.value)}
                    placeholder="18"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter product description (optional)"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <div className="flex-1 sm:flex-none">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 font-medium"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Product
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex-1 sm:flex-none">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={saving}
                    className="w-full sm:w-auto px-8 py-2.5 font-medium border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProduct;
