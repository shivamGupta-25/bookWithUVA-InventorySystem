"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { useDashboardFilters } from '@/contexts/DashboardFilterContext';

export default function AdvancedFilters() {
  const {
    dateRange,
    isFilterExpanded,
    activeFiltersCount,
    setDateRange,
    setIsFilterExpanded,
    resetFilters,
    getDateRangeDisplay
  } = useDashboardFilters();

  const handleDatePresetChange = (preset) => {
    setDateRange(prev => ({
      ...prev,
      preset,
      // Only preserve custom dates if switching to custom, otherwise clear them
      customStart: preset === 'custom' ? prev.customStart : null,
      customEnd: preset === 'custom' ? prev.customEnd : null
    }));
  };

  const handleCustomDateChange = (field, date) => {
    setDateRange(prev => {
      const newRange = {
        ...prev,
        [field]: date
      };

      // Validate that start date is not after end date
      if (field === 'customStart' && newRange.customEnd && date > newRange.customEnd) {
        // If start date is after end date, clear end date
        newRange.customEnd = null;
      } else if (field === 'customEnd' && newRange.customStart && date < newRange.customStart) {
        // If end date is before start date, clear start date
        newRange.customStart = null;
      }

      return newRange;
    });
  };


  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            {isFilterExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <Collapsible open={isFilterExpanded} onOpenChange={setIsFilterExpanded}>
        <CollapsibleContent>
          <CardContent className="">
            {/* Date Range Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date Range
              </Label>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'yesterday', label: 'Yesterday' },
                  { value: 'last7', label: 'Last 7 Days' },
                  { value: 'last30', label: 'Last 30 Days' },
                  { value: 'thisMonth', label: 'This Month' },
                  { value: 'lastMonth', label: 'Last Month' },
                  { value: 'custom', label: 'Custom' }
                ].map((preset) => (
                  <Button
                    key={preset.value}
                    variant={dateRange.preset === preset.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDatePresetChange(preset.value)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {dateRange.preset === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.customStart ? format(dateRange.customStart, 'PPP') : 'Select start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.customStart}
                          onSelect={(date) => handleCustomDateChange('customStart', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.customEnd ? format(dateRange.customEnd, 'PPP') : 'Select end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.customEnd}
                          onSelect={(date) => handleCustomDateChange('customEnd', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>


          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
