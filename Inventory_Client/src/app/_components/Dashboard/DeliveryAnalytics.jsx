"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  TrendingUp,
  CheckCircle,
  Timer,
  Truck,
  Clock3,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Legend } from 'recharts';
import { formatCurrency } from '@/lib/monetaryUtils';
import { getStatusColor, formatDate, blockChartInteraction } from './utils';

export default function DeliveryAnalytics({ stats }) {
  // Delivery performance data
  const deliveryPerformanceData = [
    { name: 'On Time', value: stats.delivery.onTimeDeliveries, color: '#10b981' },
    { name: 'Late', value: stats.delivery.lateDeliveries, color: '#ef4444' },
    { name: 'Early', value: stats.delivery.earlyDeliveries, color: '#3b82f6' }
  ];

  // Delivery trends data
  const deliveryTrendsData = stats.trends.deliveryTrends && stats.trends.deliveryTrends.length > 0
    ? stats.trends.deliveryTrends.map(trend => ({
      name: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      deliveries: trend.deliveries || 0,
      avgDeliveryTime: trend.avgDeliveryTime || 0
    }))
    : [
      { name: 'No Data', deliveries: 0, avgDeliveryTime: 0 }
    ];

  // Delivery by day of week data
  const deliveryByDayData = stats.trends.deliveryByDayOfWeek || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Delivery Performance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">On-Time Rate</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mt-1">{stats.delivery.onTimeRate}%</p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Avg Delivery Time</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 mt-1">{stats.delivery.avgDeliveryTime} days</p>
              </div>
              <Timer className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Delivered</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 mt-1">{stats.delivery.totalDelivered}</p>
              </div>
              <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Avg Delay</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600 mt-1">{stats.delivery.avgDeliveryDelay} days</p>
              </div>
              <Clock3 className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Performance Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart className="h-4 w-4 sm:h-5 sm:w-5" />
              Delivery Performance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600 bg-emerald-50/50 border-l-2 border-emerald-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Performance Metrics:</span> Breakdown of deliveries by performance. Categorizes deliveries as on-time (delivered on or before expected date), late (after expected date), or early (more than 1 day before expected date) to measure delivery efficiency.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48 sm:h-64 md:h-72 lg:h-80"
              onMouseDownCapture={blockChartInteraction}
              onClickCapture={blockChartInteraction}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={deliveryPerformanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={window.innerWidth < 640 ? 40 : 50}
                    outerRadius={window.innerWidth < 640 ? 70 : 85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value, percent }) => {
                      if (percent < 0.05) return '';
                      const isSmallScreen = window.innerWidth < 640;
                      const isVerySmallScreen = window.innerWidth < 480;
                      if (isVerySmallScreen) return `${value}`;
                      if (isSmallScreen) return `${name}: ${value}`;
                      return `${name}: ${value}`;
                    }}
                    labelLine={false}
                    labelStyle={{
                      fontSize: window.innerWidth < 640 ? '8px' : '10px',
                      fontWeight: 'bold',
                      fill: '#374151'
                    }}
                  >
                    {deliveryPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} deliveries`,
                      `${props.payload.name}`
                    ]}
                    labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-3 sm:mt-4">
              {deliveryPerformanceData.map((item, index) => (
                <div key={index} className="text-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs sm:text-sm font-medium truncate">{item.name}</span>
                  </div>
                  <div className="text-sm sm:text-base lg:text-lg font-bold">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Delivery Trends (Last 7 Days)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600 bg-cyan-50/50 border-l-2 border-cyan-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Delivery Trends:</span> Daily delivery count and average delivery time. Bar chart shows delivery volume while line chart displays average delivery time in days to track delivery performance trends.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-1">
            <div className="h-48 sm:h-64 md:h-72 lg:h-80"
              onMouseDownCapture={blockChartInteraction}
              onClickCapture={blockChartInteraction}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={deliveryTrendsData}
                  margin={{
                    top: 15,
                    right: 0,
                    left: 0,
                    bottom: 0
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    interval={0}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    angle={window.innerWidth < 640 ? -45 : 0}
                    textAnchor={window.innerWidth < 640 ? 'end' : 'middle'}
                    height={window.innerWidth < 640 ? 50 : 60}
                  >
                  </XAxis>
                  <YAxis
                    yAxisId="left"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    width={window.innerWidth < 640 ? 30 : 40}
                  >
                  </YAxis>
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    tickFormatter={(value) => `${value}d`}
                    width={window.innerWidth < 640 ? 30 : 40}
                  >
                  </YAxis>
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'deliveries') {
                        return [`${value} deliveries`, 'Delivery Count'];
                      } else if (name === 'avgDeliveryTime') {
                        return [`${value} days`, 'Avg Delivery Time'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      fontSize: window.innerWidth < 640 ? '11px' : '12px',
                      padding: window.innerWidth < 640 ? '8px' : '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{
                      fontWeight: 'bold',
                      color: '#374151',
                      marginBottom: '4px',
                      fontSize: window.innerWidth < 640 ? '11px' : '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={window.innerWidth < 640 ? 30 : 36}
                    iconType="rect"
                    wrapperStyle={{
                      paddingBottom: window.innerWidth < 640 ? '5px' : '10px',
                      fontSize: window.innerWidth < 640 ? '11px' : '12px'
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="deliveries"
                    fill="#3b82f6"
                    name="Deliveries"
                    radius={[2, 2, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgDeliveryTime"
                    stroke="#10b981"
                    strokeWidth={window.innerWidth < 640 ? 2 : 3}
                    name="Avg Time"
                    dot={{
                      fill: '#10b981',
                      strokeWidth: window.innerWidth < 640 ? 1 : 2,
                      r: window.innerWidth < 640 ? 3 : 4
                    }}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming and Overdue Deliveries */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Upcoming Deliveries (Next 7 Days)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600 bg-yellow-50/50 border-l-2 border-yellow-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Upcoming Schedule:</span> Orders scheduled for delivery in the next week. Shows upcoming deliveries to help plan logistics and ensure timely order fulfillment.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.upcomingDeliveries.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm sm:text-base">No upcoming deliveries</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                {stats.upcomingDeliveries.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <span className="font-medium text-xs sm:text-sm text-gray-900 truncate">{order.orderNumber}</span>
                        <Badge className={`text-xs px-1.5 py-0.5 ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {order.customer.name} • Expected: {formatDate(order.expectedDeliveryDate)}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-semibold text-xs sm:text-sm text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Overdue Deliveries
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600 bg-rose-50/50 border-l-2 border-rose-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Urgent Attention:</span> Orders past their expected delivery date. Identifies overdue orders requiring immediate attention to maintain customer satisfaction and delivery performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.overdueDeliveries.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-green-300" />
                <p className="text-sm sm:text-base">No overdue deliveries</p>
                <p className="text-xs sm:text-sm">All deliveries are on track!</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                {stats.overdueDeliveries.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <span className="font-medium text-xs sm:text-sm text-gray-900 truncate">{order.orderNumber}</span>
                        <Badge className={`text-xs px-1.5 py-0.5 ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {order.customer.name} • Expected: {formatDate(order.expectedDeliveryDate)}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-semibold text-xs sm:text-sm text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delivery Performance by Day of Week */}
      {deliveryByDayData.length > 0 && (
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart className="h-4 w-4 sm:h-5 sm:w-5" />
              Delivery Performance by Day of Week
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600 bg-violet-50/50 border-l-2 border-violet-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Weekly Patterns:</span> This chart analyzes delivery performance patterns across days of the week. <strong className="underline">Blue bars</strong> show the number of deliveries completed each day (Sunday=1, Monday=2, etc.). <strong className="underline">Green line</strong> shows average <span className="underline font-medium">delivery time in days from order date to delivery date</span>. <span className="underline font-medium">Use this to identify which days have the most deliveries and which days have faster/slower delivery times.</span> <span className="underline font-medium">Lower line values indicate faster deliveries, while higher bars show busier delivery days.</span> This helps optimize delivery scheduling and resource allocation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-48 sm:h-64 md:h-72 lg:h-80"
              onMouseDownCapture={blockChartInteraction}
              onClickCapture={blockChartInteraction}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={deliveryByDayData}
                  margin={{
                    top: 15,
                    right: 0,
                    left: 0,
                    bottom: 0
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    interval={0}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    angle={window.innerWidth < 640 ? -45 : 0}
                    textAnchor={window.innerWidth < 640 ? 'end' : 'middle'}
                    height={window.innerWidth < 640 ? 50 : 60}
                  >
                  </XAxis>
                  <YAxis
                    yAxisId="left"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    width={window.innerWidth < 640 ? 30 : 40}
                  >
                  </YAxis>
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={window.innerWidth < 640 ? 9 : 11}
                    tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    tickFormatter={(value) => `${value}d`}
                    width={window.innerWidth < 640 ? 30 : 40}
                  >
                  </YAxis>
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'deliveryCount') {
                        return [`${value} deliveries`, 'Delivery Count'];
                      } else if (name === 'avgDeliveryTime') {
                        return [`${value} days`, 'Avg Delivery Time'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Day: ${label}`}
                    contentStyle={{
                      fontSize: window.innerWidth < 640 ? '11px' : '12px',
                      padding: window.innerWidth < 640 ? '8px' : '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{
                      fontWeight: 'bold',
                      color: '#374151',
                      marginBottom: '4px',
                      fontSize: window.innerWidth < 640 ? '11px' : '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={window.innerWidth < 640 ? 30 : 36}
                    iconType="rect"
                    wrapperStyle={{
                      paddingBottom: window.innerWidth < 640 ? '5px' : '10px',
                      fontSize: window.innerWidth < 640 ? '11px' : '12px'
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="deliveryCount"
                    fill="#3b82f6"
                    name="Delivery Count"
                    radius={[2, 2, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgDeliveryTime"
                    stroke="#10b981"
                    strokeWidth={window.innerWidth < 640 ? 2 : 3}
                    name="Avg Time"
                    dot={{
                      fill: '#10b981',
                      strokeWidth: window.innerWidth < 640 ? 1 : 2,
                      r: window.innerWidth < 640 ? 3 : 4
                    }}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
