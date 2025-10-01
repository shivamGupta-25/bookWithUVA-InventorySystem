"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  BarChart,
} from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Legend, Label } from 'recharts';
import { formatCurrency } from '@/lib/monetaryUtils';
import { blockChartInteraction } from './utils';
import { useDashboardFilters } from '@/contexts/DashboardFilterContext';

export default function OrderAnalytics({ stats }) {
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const axisTickColor = isDark ? '#ffffff' : '#000000';
  const { getDateRangeDisplay } = useDashboardFilters();
  // Use real-time data from the API with improved date formatting
  const orderTrendsData = stats.trends.orderTrends && stats.trends.orderTrends.length > 0
    ? stats.trends.orderTrends.map(trend => {
      const date = new Date(trend.date);
      // Format date based on the data range
      const isLongRange = stats.trends.orderTrends.length > 14;
      const name = isLongRange
        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        name,
        orders: trend.orders || 0,
        revenue: trend.revenue || 0
      };
    })
    : [
      // Fallback data if no real-time data is available
      { name: 'No Data', orders: 0, revenue: 0 }
    ];

  return (
    <div className="space-y-6">
      {/* Order Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Order Trends ({getDateRangeDisplay()})
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground bg-purple-50/50 dark:bg-purple-950/20 border-l-2 border-purple-200 dark:border-purple-800 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-foreground">Trend Analysis:</span> Daily order count and revenue trends over the selected period. Bar chart shows order volume while line chart displays revenue trends to identify business growth patterns.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-1 sm:p-2">
          <div className="h-64 sm:h-80"
            onMouseDownCapture={blockChartInteraction}
            onClickCapture={blockChartInteraction}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={orderTrendsData} margin={{ top: 0, right: 0, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  tick={{ fontSize: 9, fill: axisTickColor }}
                  interval={stats.trends.orderTrends.length > 14 ? "preserveStartEnd" : 0}
                  axisLine={{ stroke: axisTickColor }}
                  tickLine={{ stroke: axisTickColor }}
                >
                  <Label value="Date" offset={-5} position="insideBottom" style={{ textAnchor: 'middle', fontSize: '12px', fill: axisTickColor }} />
                </XAxis>
                <YAxis
                  yAxisId="left"
                  fontSize={11}
                  tick={{ fontSize: 9, fill: axisTickColor }}
                  axisLine={{ stroke: axisTickColor }}
                  tickLine={{ stroke: axisTickColor }}
                >
                  <Label value="Number of Orders" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: '12px', fill: axisTickColor }} />
                </YAxis>
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  fontSize={11}
                  tick={{ fontSize: 9, fill: axisTickColor }}
                  axisLine={{ stroke: axisTickColor }}
                  tickLine={{ stroke: axisTickColor }}
                  tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value}`}
                >
                  <Label value="Revenue (₹)" angle={90} position="insideRight" style={{ textAnchor: 'middle', fontSize: '12px', fill: axisTickColor }} />
                </YAxis>
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'orders') {
                      return [`${value} orders`, 'Order Count'];
                    } else if (name === 'revenue') {
                      return [formatCurrency(value), 'Revenue'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    fontSize: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#000'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#000', marginBottom: '4px', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="rect"
                  wrapperStyle={{ paddingBottom: '10px' }}
                />
                <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue" dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Order Status Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: 'Pending', count: stats.orders.pendingOrders, color: '#f59e0b', bgColor: 'bg-yellow-50 dark:bg-yellow-950/20', textColor: 'text-yellow-700 dark:text-yellow-300' },
                { status: 'Processing', count: stats.orders.processingOrders, color: '#3b82f6', bgColor: 'bg-blue-50 dark:bg-blue-950/20', textColor: 'text-blue-700 dark:text-blue-300' },
                { status: 'Delivered', count: stats.orders.deliveredOrders, color: '#10b981', bgColor: 'bg-green-50 dark:bg-green-950/20', textColor: 'text-green-700 dark:text-green-300' },
                { status: 'Cancelled', count: stats.orders.cancelledOrders, color: '#ef4444', bgColor: 'bg-red-50 dark:bg-red-950/20', textColor: 'text-red-700 dark:text-red-300' }
              ].map((item) => {
                // Calculate percentage with proper rounding
                const percentage = stats.orders.totalOrders > 0
                  ? Math.round((item.count / stats.orders.totalOrders) * 100 * 100) / 100  // Round to 2 decimal places
                  : 0;

                return (
                  <div key={item.status} className={`p-3 rounded-lg ${item.bgColor} border border-border/20`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className={`text-sm font-semibold ${item.textColor}`}>{item.status}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${item.textColor}`}>{item.count}</div>
                        <div className="text-xs text-foreground">{percentage}%</div>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: item.color
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {/* Total verification */}
              {stats.orders.totalOrders > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Orders:</span>
                    <span className="font-semibold text-foreground">{stats.orders.totalOrders}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.orders.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Orders</span>
                <span className="text-lg font-bold">{stats.orders.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Order Value</span>
                <span className="text-lg font-bold">
                  {stats.orders.totalOrders > 0
                    ? formatCurrency(stats.orders.totalRevenue / stats.orders.totalOrders)
                    : formatCurrency(0)
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
