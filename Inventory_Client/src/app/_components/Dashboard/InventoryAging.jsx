"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { blockChartInteraction } from './utils';

export default function InventoryAging({ stats }) {
  const agingBuckets = stats.aging.agingBuckets || [];
  const bucketChartData = agingBuckets.map(b => ({ name: b.label, count: b.count }));

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Chart + List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Inventory Aging & Dead Stock
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 bg-red-50/50 border-l-2 border-red-200 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-gray-700">Dead Stock Alert:</span> Time since last sale and products likely to be dead stock. Analyzes products by days since last sale to identify slow-moving inventory and potential dead stock requiring attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            <div className="p-3 rounded-lg border border-purple-200/60 bg-purple-50">
              <div className="text-[11px] sm:text-xs text-gray-600">Dead Stock</div>
              <div className="text-xl sm:text-2xl font-bold text-purple-700">{stats.aging.deadStockCount}</div>
            </div>
            <div className="p-3 rounded-lg border border-indigo-200/60 bg-indigo-50">
              <div className="text-[11px] sm:text-xs text-gray-600">Avg Days Since Last Sale</div>
              <div className="text-xl sm:text-2xl font-bold text-indigo-700">{stats.aging.averageDaysSinceLastSale}</div>
            </div>
          </div>
          <div className="h-64 sm:h-80"
            onMouseDownCapture={blockChartInteraction}
            onClickCapture={blockChartInteraction}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={bucketChartData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  fontSize={(typeof window !== 'undefined' && window.innerWidth < 640) ? 10 : 11}
                  tick={{ fontSize: (typeof window !== 'undefined' && window.innerWidth < 640) ? 8 : 9 }}
                  interval={0}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  angle={(typeof window !== 'undefined' && window.innerWidth < 640) ? -35 : -10}
                  textAnchor="end"
                  height={(typeof window !== 'undefined' && window.innerWidth < 640) ? 38 : 46}
                />
                <YAxis
                  fontSize={(typeof window !== 'undefined' && window.innerWidth < 640) ? 10 : 11}
                  tick={{ fontSize: (typeof window !== 'undefined' && window.innerWidth < 640) ? 8 : 9 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip
                  formatter={(value) => [`${value} products`, 'Count']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Products" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="text-sm font-semibold text-gray-900">Top Dead Stock Products</div>
            {stats.aging.deadStockProducts.length === 0 ? (
              <div className="text-xs text-gray-500">No dead stock detected</div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {stats.aging.deadStockProducts.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 sm:p-2.5 border rounded-md hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{p.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                        <span>Stock: {p.stock}</span>
                        {p.neverSold ? (
                          <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-1.5 py-0.5 text-[10px] sm:text-[11px]">Never sold</span>
                        ) : p.daysSinceLastSale != null ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-1.5 py-0.5 text-[10px] sm:text-[11px]">{p.daysSinceLastSale} days</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
