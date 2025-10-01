"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useDashboardFilters } from '@/contexts/DashboardFilterContext';

export default function FilterSummary() {
  const {
    dateRange,
    activeFiltersCount,
    setDateRange,
    getDateRangeDisplay
  } = useDashboardFilters();

  if (activeFiltersCount === 0) {
    return null;
  }

  const removeDateFilter = () => {
    setDateRange(prev => ({
      ...prev,
      preset: 'all',
      customStart: null,
      customEnd: null
    }));
  };



  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        Active Filters ({activeFiltersCount}):
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Date Range Filter */}
        {dateRange.preset !== 'all' && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <span>Period: {getDateRangeDisplay()}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={removeDateFilter}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

      </div>
    </div>
  );
}
