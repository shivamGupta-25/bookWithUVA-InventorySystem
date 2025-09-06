"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Combobox from "@/components/ui/combobox";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';

const NewProduct = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [distributors, setDistributors] = useState([]);

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

  // Load filter options from API
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await api.products.getAll({ limit: 1 });
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.data.filters.categories);
          setSubCategories(data.data.filters.subCategories);
          setDistributors(data.data.filters.distributors || []);
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

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

    setLoading(true);

    try {
      // Prepare data for API call
      const apiData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        gst: parseFloat(formData.gst)
      };


      const response = await api.products.create(apiData);

      const data = await response.json();

      if (data.success) {
        toast.success('Product created successfully!');
        // Reset form
        setFormData({
          title: '',
          distributor: '',
          category: '',
          subCategory: '',
          price: '',
          stock: '',
          gst: 18,
          description: ''
        });
        // Redirect to inventory after 2 seconds
        // setTimeout(() => {
        //   router.push('/inventory');
        // }, 2000);
      } else {
        toast.error(data.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
              <p className="text-gray-600 mt-1">Fill in the details to add a new product to your inventory.</p>
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Distributor *
                </label>
                <Combobox
                  value={formData.distributor}
                  onValueChange={(value) => handleInputChange('distributor', value)}
                  options={distributors}
                  placeholder="Select or enter distributor name"
                  className="w-full"
                  allowCustom={true}
                />
              </div>

              {/* Category and Sub-category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <Combobox
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    options={categories.filter(cat => cat !== 'All')}
                    placeholder="Select or enter category"
                    className="w-full"
                    allowCustom={true}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Sub-category *
                  </label>
                  <Combobox
                    value={formData.subCategory}
                    onValueChange={(value) => handleInputChange('subCategory', value)}
                    options={subCategories.filter(sub => sub !== 'All')}
                    placeholder="Select or enter sub-category"
                    className="w-full"
                    allowCustom={true}
                  />
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
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Product
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex-1 sm:flex-none">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
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

export default NewProduct;