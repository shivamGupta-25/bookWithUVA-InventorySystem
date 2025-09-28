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
          <CardDescription className="text-sm text-foreground bg-red-50/50 dark:bg-red-950/20 border-l-2 border-red-200 dark:border-red-800 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-foreground">Dead Stock Alert:</span> Time since last sale and products likely to be dead stock. Analyzes products by days since last sale to identify slow-moving inventory and potential dead stock requiring attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            <div className="p-3 rounded-lg border border-purple-200/60 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-950/20">
              <div className="text-[11px] sm:text-xs text-foreground">Dead Stock</div>
              <div className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.aging.deadStockCount}</div>
            </div>
            <div className="p-3 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/20">
              <div className="text-[11px] sm:text-xs text-foreground">Avg Days Since Last Sale</div>
              <div className="text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-400">{stats.aging.averageDaysSinceLastSale}</div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  fontSize={(typeof window !== 'undefined' && window.innerWidth < 640) ? 10 : 11}
                  tick={{ fontSize: (typeof window !== 'undefined' && window.innerWidth < 640) ? 8 : 9 }}
                  interval={0}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  angle={(typeof window !== 'undefined' && window.innerWidth < 640) ? -35 : -10}
                  textAnchor="end"
                  height={(typeof window !== 'undefined' && window.innerWidth < 640) ? 38 : 46}
                />
                <YAxis
                  fontSize={(typeof window !== 'undefined' && window.innerWidth < 640) ? 10 : 11}
                  tick={{ fontSize: (typeof window !== 'undefined' && window.innerWidth < 640) ? 8 : 9 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip
                  formatter={(value) => [`${value} products`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#000', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Products" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="text-sm font-semibold text-foreground">Top Dead Stock Products</div>
            {stats.aging.deadStockProducts.length === 0 ? (
              <div className="text-xs text-foreground">No dead stock detected</div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {stats.aging.deadStockProducts.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 sm:p-2.5 border rounded-md hover:bg-accent transition-colors">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-xs sm:text-sm font-medium text-foreground truncate">{p.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] sm:text-xs text-foreground">
                        <span>Stock: {p.stock}</span>
                        {p.neverSold ? (
                          <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 text-[10px] sm:text-[11px]">Never sold</span>
                        ) : p.daysSinceLastSale != null ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 text-[10px] sm:text-[11px]">{p.daysSinceLastSale} days</span>
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
