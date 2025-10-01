"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const DashboardFilterContext = createContext();

export const useDashboardFilters = () => {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
};

export const DashboardFilterProvider = ({ children }) => {
  // Date range filters - Essential for trend analysis
  const [dateRange, setDateRange] = useState({
    preset: 'all', // 'all', 'today', 'yesterday', 'last7', 'last30', 'thisMonth', 'lastMonth', 'custom'
    customStart: null,
    customEnd: null
  });

  // Filter state
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;

    // Date range (only count if not default)
    if (dateRange.preset !== 'all') count++;

    setActiveFiltersCount(count);
  }, [dateRange]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setDateRange({
      preset: 'all',
      customStart: null,
      customEnd: null
    });
  }, []);

  // Get current filter parameters for API calls
  const getFilterParams = useCallback(() => {
    const params = {};

    // Date range
    if (dateRange.preset === 'custom') {
      if (dateRange.customStart) params.dateFrom = dateRange.customStart.toISOString().split('T')[0];
      if (dateRange.customEnd) params.dateTo = dateRange.customEnd.toISOString().split('T')[0];
    } else {
      // Always send the preset, including "all"
      params.preset = dateRange.preset;
    }

    // Add timestamp to prevent caching issues
    params._t = Date.now();

    return params;
  }, [dateRange]);

  // Get date range for display
  const getDateRangeDisplay = useCallback(() => {
    if (dateRange.preset === 'custom') {
      if (dateRange.customStart && dateRange.customEnd) {
        // Validate date range
        if (dateRange.customStart > dateRange.customEnd) {
          return 'Invalid Date Range';
        }
        return `${dateRange.customStart.toLocaleDateString()} - ${dateRange.customEnd.toLocaleDateString()}`;
      } else if (dateRange.customStart) {
        return `From ${dateRange.customStart.toLocaleDateString()}`;
      } else if (dateRange.customEnd) {
        return `Until ${dateRange.customEnd.toLocaleDateString()}`;
      }
      return 'Custom Range';
    }

    const presetLabels = {
      all: 'All Time',
      today: 'Today',
      yesterday: 'Yesterday',
      last7: 'Last 7 Days',
      last30: 'Last 30 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month'
    };

    return presetLabels[dateRange.preset] || 'All Time';
  }, [dateRange]);

  const value = {
    // State
    dateRange,
    isFilterExpanded,
    activeFiltersCount,

    // Setters
    setDateRange,
    setIsFilterExpanded,

    // Actions
    resetFilters,
    getFilterParams,
    getDateRangeDisplay
  };

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
};
