"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  TrendingUp,
  BarChart,
  Users,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { formatCurrency } from '@/lib/monetaryUtils';
import { blockChartInteraction } from './utils';

export default function InventoryAnalytics({ stats }) {
  const stockLevelsData = [
    { name: 'In Stock', value: stats.inventory.inStockProducts, color: '#10b981' },
    { name: 'Low Stock', value: stats.inventory.lowStockProducts, color: '#f59e0b' },
    { name: 'Out of Stock', value: stats.inventory.outOfStockProducts, color: '#ef4444' }
  ];

  // Real-time category distribution data
  const categoryData = stats.inventory.categoryStats.slice(0, 5).map(cat => ({
    name: cat._id.length > 12 ? cat._id.substring(0, 12) + '...' : cat._id,
    fullName: cat._id,
    count: cat.count,
    value: cat.totalValue
  }));

  // Real-time distributor distribution data
  const distributorData = stats.inventory.distributorStats.slice(0, 5).map(dist => ({
    name: (dist.distributorName || 'Unknown').length > 12 ? (dist.distributorName || 'Unknown').substring(0, 12) + '...' : (dist.distributorName || 'Unknown'),
    fullName: dist.distributorName || 'Unknown',
    count: dist.count,
    value: dist.totalValue
  }));

  return (
    <div className="space-y-6">
      {/* Stock Levels Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Levels Distribution
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 bg-orange-50/50 border-l-2 border-orange-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Inventory Health:</span> Current inventory status across all products. Categorizes products as in-stock (above low threshold), low stock (between out-of-stock and low thresholds), or out-of-stock to monitor inventory health.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80"
              onMouseDownCapture={blockChartInteraction}
              onClickCapture={blockChartInteraction}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockLevelsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ value }) => `${value}`}
                    labelLine={false}
                    labelStyle={{
                      fontWeight: 'bold',
                      fill: '#374151',
                    }}
                  >
                    {stockLevelsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} products`,
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
            <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-4">
              {stockLevelsData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Inventory Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stats.inventory.totalProducts}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">In Stock</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{stats.inventory.inStockProducts}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium">Low Stock</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">{stats.inventory.lowStockProducts}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">Out of Stock</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{stats.inventory.outOfStockProducts}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.inventory.inventoryValue)}</div>
                  <div className="text-sm text-gray-600">Total Inventory Value</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category and Distributor Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Products by Category
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 bg-indigo-50/50 border-l-2 border-indigo-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Category Analysis:</span> Distribution of products across different categories. Shows product count per category to understand inventory composition and identify category performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64 sm:h-80"
              onMouseDownCapture={blockChartInteraction}
              onClickCapture={blockChartInteraction}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                    <Label value="Product Categories" offset={-5} position="insideBottom" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                  </XAxis>
                  <YAxis
                    fontSize={11}
                    tick={{ fontSize: 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  >
                    <Label value="Number of Products" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                  </YAxis>
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} products`,
                      'Product Count'
                    ]}
                    labelFormatter={(label, payload) => `Category: ${payload?.[0]?.payload?.fullName || label}`}
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
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Products"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Products by Distributor
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 bg-teal-50/50 border-l-2 border-teal-200 pl-3 py-2 rounded-r-md">
              <span className="font-medium text-gray-700">Supplier Relations:</span> Distribution of products across different distributors. Shows product count per distributor to understand supplier relationships and identify key distribution partners.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64 sm:h-80"
              onMouseDownCapture={blockChartInteraction}
              onClickCapture={blockChartInteraction}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={distributorData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                    <Label value="Distributor Names" offset={-5} position="insideBottom" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                  </XAxis>
                  <YAxis
                    fontSize={11}
                    tick={{ fontSize: 9 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  >
                    <Label value="Number of Products" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' }} />
                  </YAxis>
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} products`,
                      'Product Count'
                    ]}
                    labelFormatter={(label, payload) => `Distributor: ${payload?.[0]?.payload?.fullName || label}`}
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
                    dataKey="count"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Products"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
