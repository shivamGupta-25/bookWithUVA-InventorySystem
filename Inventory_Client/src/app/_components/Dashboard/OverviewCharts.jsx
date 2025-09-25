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
          <CardDescription className="text-sm text-gray-600 bg-blue-50/50 border-l-2 border-blue-200 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-gray-700">Analysis:</span> Breakdown of orders by current status. Shows the distribution of pending, processing, delivered, and cancelled orders to understand order pipeline health.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80"
            onMouseDownCapture={blockChartInteraction}
            onClickCapture={blockChartInteraction}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
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
                    fill: '#374151'
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
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {orderStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-600 text-xs">{item.name}:</span>
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
          <CardDescription className="text-sm text-gray-600 bg-green-50/50 border-l-2 border-green-200 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-gray-700">Revenue Focus:</span> Products ranked by total revenue generated. Calculated by summing final prices of all delivered orders for each product to identify top revenue drivers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 sm:h-80"
            onMouseDownCapture={blockChartInteraction}
            onClickCapture={blockChartInteraction}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={topProductsData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={11}
                  interval={0}
                  tick={{ fontSize: 9 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                >
                </XAxis>
                <YAxis
                  fontSize={11}
                  tick={{ fontSize: 9 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
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
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
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
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No recent orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{order.orderNumber}</span>
                      <Badge className={`text-xs capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.customer.name} • {formatDate(order.orderDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-900">
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
