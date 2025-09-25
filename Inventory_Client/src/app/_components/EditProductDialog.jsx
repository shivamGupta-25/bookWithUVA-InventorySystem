"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Combobox from "@/components/ui/combobox";
import { 
  Save, 
  Loader2,
  X
} from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';

const EditProductDialog = ({ 
  isOpen, 
  onClose, 
  product, 
  categories, 
  subCategories, 
  distributors,
  onProductUpdated,
  readOnly = false,
}) => {
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
  const [saving, setSaving] = useState(false);
  const [localCategories, setLocalCategories] = useState([]);
  const [localSubCategories, setLocalSubCategories] = useState([]);
  const [localDistributors, setLocalDistributors] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load filter options when dialog opens
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (isOpen) {
        setLoadingOptions(true);
        try {
          const response = await api.products.getAll({ limit: 1 });
          const data = await response.json();
          
          if (data.success) {
            setLocalCategories(data.data.filters.categories);
            setLocalSubCategories(data.data.filters.subCategories);
            setLocalDistributors((data.data.filters.distributors || []).map((name) => ({ id: name, name })));
          }
        } catch (error) {
          console.error('Error loading filter options:', error);
          // Fallback to props if API fails
          setLocalCategories(categories);
          setLocalSubCategories(subCategories);
          setLocalDistributors((distributors || []).map((name) => ({ id: name, name })));
        } finally {
          setLoadingOptions(false);
        }
      }
    };

    loadFilterOptions();
  }, [isOpen, categories, subCategories, distributors]);

  // Update form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        distributor: (product.distributor && product.distributor.id) ? product.distributor.id : (product.distributor || ''),
        category: product.category || '',
        subCategory: product.subCategory || '',
        price: product.price || '',
        stock: product.stock || '',
        gst: product.gst || 18,
        description: product.description || ''
      });
    }
  }, [product]);

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
    if (readOnly) return;
    if (!validateForm()) return;

    setSaving(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        gst: parseFloat(formData.gst)
      };
      const selected = localDistributors.find((d) => d.id === formData.distributor);
      if (selected) {
        payload.distributor = selected.id;
        delete payload.distributorName;
      } else if (formData.distributor) {
        payload.distributorName = formData.distributor;
        delete payload.distributor;
      }
      const response = await api.products.update(product.id, payload);

      const data = await response.json();

      if (data.success) {
        toast.success('Product updated successfully!');
        onProductUpdated();
        onClose();
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

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-1rem)] flex flex-col">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Save className="h-4 w-4" />
            {readOnly ? 'View Product' : 'Edit Product'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} className="space-y-4 pr-1">
            {/* Loading indicator for options */}
            {loadingOptions && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                <span className="text-xs text-gray-600">Loading options...</span>
              </div>
            )}

            {/* Product Title */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Product Title *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter product title"
                className="w-full h-9"
                disabled={saving}
                readOnly={readOnly}
              />
            </div>

            {/* Distributor */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Distributor *
              </label>
              <Combobox
                value={formData.distributor}
                onValueChange={(value) => handleInputChange('distributor', value)}
                options={localDistributors}
                getLabel={(opt) => opt?.name || ''}
                getValue={(opt) => opt?.id || ''}
                placeholder="Select or enter distributor name"
                className={`w-full [&_input]:h-9 ${readOnly ? 'opacity-100 pointer-events-none' : ''}`}
                allowCustom={true}
                disabled={saving || loadingOptions}
              />
            </div>

            {/* Category and Sub-category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  Category *
                </label>
                <Combobox
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                  options={localCategories.filter(cat => cat !== 'All')}
                  placeholder="Select or enter category"
                  className={`w-full [&_input]:h-9 ${readOnly ? 'opacity-100 pointer-events-none' : ''}`}
                  allowCustom={true}
                  disabled={saving || loadingOptions}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  Sub-category *
                </label>
                <Combobox
                  value={formData.subCategory}
                  onValueChange={(value) => handleInputChange('subCategory', value)}
                  options={localSubCategories.filter(sub => sub !== 'All')}
                  placeholder="Select or enter sub-category"
                  className={`w-full [&_input]:h-9 ${readOnly ? 'opacity-100 pointer-events-none' : ''}`}
                  allowCustom={true}
                  disabled={saving || loadingOptions}
                />
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  Price (₹) *
                </label>
              <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  className="w-full h-9"
                disabled={saving}
                readOnly={readOnly}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  Stock Quantity *
                </label>
              <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="0"
                  className="w-full h-9"
                disabled={saving}
                readOnly={readOnly}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
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
                  className="w-full h-9"
                disabled={saving}
                readOnly={readOnly}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description (optional)"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                disabled={saving}
                readOnly={readOnly}
              />
            </div>
          </form>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t bg-white flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving}
            className="w-full sm:w-auto h-9"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          {!readOnly && (
            <Button
              type="submit"
              disabled={saving}
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto h-9"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Update Product
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
