"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, XCircle, Clock, CalendarDays, ChevronDown, Zap, Calendar, TrendingUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  onClear 
}) => {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [quickSelectOpen, setQuickSelectOpen] = useState(false);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Validate date range
  const isDateRangeValid = () => {
    if (!startDate || !endDate) return true;
    return startDate <= endDate;
  };

  const handleStartDateSelect = (date) => {
    onStartDateChange(date);
    setStartDateOpen(false);
    
    // Auto-adjust end date if it's before the new start date
    if (endDate && date && date > endDate) {
      onEndDateChange(date);
    }
  };

  const handleEndDateSelect = (date) => {
    onEndDateChange(date);
    setEndDateOpen(false);
    
    // Auto-adjust start date if it's after the new end date
    if (startDate && date && date < startDate) {
      onStartDateChange(date);
    }
  };

  const setToday = () => {
    onStartDateChange(today);
    onEndDateChange(today);
    setQuickSelectOpen(false);
  };

  const setYesterday = () => {
    onStartDateChange(yesterday);
    onEndDateChange(yesterday);
    setQuickSelectOpen(false);
  };

  const setLastWeek = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    onStartDateChange(lastWeek);
    onEndDateChange(today);
    setQuickSelectOpen(false);
  };

  const setLastMonth = () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    onStartDateChange(lastMonth);
    onEndDateChange(today);
    setQuickSelectOpen(false);
  };

  // Get current preset range name
  const getCurrentPresetRange = () => {
    if (!startDate || !endDate) return "Preset Ranges";
    
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const todayTime = today.getTime();
    const yesterdayTime = yesterday.getTime();
    
    // Check if it's today
    if (startTime === todayTime && endTime === todayTime) {
      return "Today";
    }
    
    // Check if it's yesterday
    if (startTime === yesterdayTime && endTime === yesterdayTime) {
      return "Yesterday";
    }
    
    // Check if it's last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (startTime === sevenDaysAgo.getTime() && endTime === todayTime) {
      return "Last 7 days";
    }
    
    // Check if it's last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setMonth(thirtyDaysAgo.getMonth() - 1);
    if (startTime === thirtyDaysAgo.getTime() && endTime === todayTime) {
      return "Last 30 days";
    }
    
    // Custom range
    return "Custom Range";
  };

  return (
    <div className="space-y-3">
      {/* Quick Select Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Select</span>
        </div>
        
        <div className="flex gap-2">
          <Popover open={quickSelectOpen} onOpenChange={setQuickSelectOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-10 flex-1 justify-start text-left font-normal border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30"
              >
                <Calendar className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getCurrentPresetRange()}</span>
                <ChevronDown className="ml-auto h-4 w-4 text-gray-500 dark:text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-gray-800">Quick Date Ranges</span>
                </div>
                
                <div className="grid grid-cols-1 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={setToday}
                    className={`w-full justify-start h-9 text-sm transition-colors ${
                      getCurrentPresetRange() === "Today" 
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700" 
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300"
                    }`}
                  >
                    <Clock className="mr-3 h-4 w-4 text-blue-600" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Today</span>
                      <span className="text-xs text-gray-500">{today.toLocaleDateString()}</span>
                    </div>
                    {getCurrentPresetRange() === "Today" && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={setYesterday}
                    className={`w-full justify-start h-9 text-sm transition-colors ${
                      getCurrentPresetRange() === "Yesterday" 
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700" 
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300"
                    }`}
                  >
                    <History className="mr-3 h-4 w-4 text-blue-600" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Yesterday</span>
                      <span className="text-xs text-gray-500">{yesterday.toLocaleDateString()}</span>
                    </div>
                    {getCurrentPresetRange() === "Yesterday" && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={setLastWeek}
                    className={`w-full justify-start h-9 text-sm transition-colors ${
                      getCurrentPresetRange() === "Last 7 days" 
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700" 
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300"
                    }`}
                  >
                    <TrendingUp className="mr-3 h-4 w-4 text-blue-600" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Last 7 days</span>
                      <span className="text-xs text-gray-500">Past week</span>
                    </div>
                    {getCurrentPresetRange() === "Last 7 days" && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={setLastMonth}
                    className={`w-full justify-start h-9 text-sm transition-colors ${
                      getCurrentPresetRange() === "Last 30 days" 
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700" 
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300"
                    }`}
                  >
                    <CalendarDays className="mr-3 h-4 w-4 text-blue-600" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Last 30 days</span>
                      <span className="text-xs text-gray-500">Past month</span>
                    </div>
                    {getCurrentPresetRange() === "Last 30 days" && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    )}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {(startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="h-10 px-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200"
              title="Clear date range"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Range</span>
        </div>
        
        {/* From and To Date Pickers - Side by Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Start Date Picker */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
            <div className="flex gap-2">
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-9 flex-1 justify-start text-left font-normal border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm ${
                      !isDateRangeValid() ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? startDate.toLocaleDateString() : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                    className="rounded-md border shadow-sm"
                    captionLayout="dropdown"
                    disabled={(date) => endDate ? date > endDate : false}
                  />
                </PopoverContent>
              </Popover>
              {startDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartDateChange(undefined)}
                  className="h-9 px-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                  title="Clear start date"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* End Date Picker */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">To</label>
            <div className="flex gap-2">
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-9 flex-1 justify-start text-left font-normal border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm ${
                      !isDateRangeValid() ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? endDate.toLocaleDateString() : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateSelect}
                    className="rounded-md border shadow-sm"
                    captionLayout="dropdown"
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
              {endDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEndDateChange(undefined)}
                  className="h-9 px-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                  title="Clear end date"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Validation Message */}
        {!isDateRangeValid() && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            End date must be after or equal to start date
          </div>
        )}

        {/* Date Range Summary */}
        {startDate && endDate && isDateRangeValid() && (
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
            Showing orders from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
            {startDate.getTime() === endDate.getTime() && ' (same day)'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangePicker;
