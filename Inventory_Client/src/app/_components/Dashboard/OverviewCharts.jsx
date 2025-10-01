"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  TrendingUp,
  CalendarDays,
  ShoppingCart,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/monetaryUtils';
import { getStatusColor, formatDate, blockChartInteraction } from './utils';

export default function OverviewCharts({ stats }) {
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const axisTickColor = isDark ? '#ffffff' : '#000000';
  // Order status distribution data
  const orderStatusData = [
    { name: 'Pending', value: stats.orders.pendingOrders, color: '#f59e0b' },
    { name: 'Processing', value: stats.orders.processingOrders, color: '#3b82f6' },
    { name: 'Delivered', value: stats.orders.deliveredOrders, color: '#10b981' },
    { name: 'Cancelled', value: stats.orders.cancelledOrders, color: '#ef4444' }
  ];

  // Top products data
  const topProductsData = stats.topProducts.slice(0, 5).map(product => ({
    name: product.productName.length > 15 ? product.productName.substring(0, 15) + '...' : product.productName,
    fullName: product.productName,
    revenue: product.totalRevenue,
    quantity: product.totalQuantity
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Order Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Order Status Distribution
          </CardTitle>
          <CardDescription className="text-sm text-accent-foreground/70 bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-200 dark:border-blue-800 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-foreground">Analysis:</span> Breakdown of orders by current status. Shows the distribution of pending, processing, delivered, and cancelled orders to understand order pipeline health.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80"
            onMouseDownCapture={blockChartInteraction}
            onClickCapture={blockChartInteraction}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 14, bottom: 0 }}>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => {
                    // Only show labels for segments with significant values (>5%)
                    if (percent < 0.05) return '';
                    // Use shorter labels on smaller screens
                    const isSmallScreen = window.innerWidth < 640;
                    return isSmallScreen ? `${value}` : `${name}: ${value}`;
                  }}
                  labelLine={false}
                  labelStyle={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    fill: 'hsl(var(--foreground))'
                  }}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} orders`,
                    `${props.payload.name} Status`
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: '#000', fontSize: '12px' }}
                  contentStyle={{
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#000'
                  }}
                  labelFormatter={(label, payload) => `${label}: ${payload.value}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {orderStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-muted-foreground text-xs">{item.name}:</span>
                <span className="text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Selling Products
          </CardTitle>
          <CardDescription className="text-sm text-accent-foreground/70 bg-green-50/50 dark:bg-green-950/20 border-l-2 border-green-200 dark:border-green-800 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-foreground">Revenue Focus:</span> Products ranked by total revenue generated. Calculated by summing final prices of all delivered orders for each product to identify top revenue drivers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 sm:h-80"
            onMouseDownCapture={blockChartInteraction}
            onClickCapture={blockChartInteraction}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={topProductsData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={11}
                  interval={0}
                  tick={{ fontSize: 9, fill: axisTickColor }}
                  axisLine={{ stroke: axisTickColor }}
                  tickLine={{ stroke: axisTickColor }}
                >
                </XAxis>
                <YAxis
                  fontSize={11}
                  tick={{ fontSize: 9, fill: axisTickColor }}
                  axisLine={{ stroke: axisTickColor }}
                  tickLine={{ stroke: axisTickColor }}
                  tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value}`}
                >
                </YAxis>
                <Tooltip
                  formatter={(value, name, props) => [
                    formatCurrency(value),
                    'Total Revenue'
                  ]}
                  labelFormatter={(label, payload) => `Product: ${payload?.[0]?.payload?.fullName || label}`}
                  contentStyle={{
                    fontSize: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#000'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#000', marginBottom: '4px' }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p>No recent orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">{order.orderNumber}</span>
                      <Badge className={`text-xs capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.customer.name} • {formatDate(order.orderDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-foreground">
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
  );
}
