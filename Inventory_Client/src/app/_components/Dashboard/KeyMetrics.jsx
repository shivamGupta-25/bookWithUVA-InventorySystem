"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from '@/lib/monetaryUtils';

export default function KeyMetrics({ stats }) {
  const metrics = [
    {
      title: "Products",
      value: stats.inventory.totalProducts,
      description: "Total items in stock"
    },
    {
      title: "Orders",
      value: stats.orders.totalOrders,
      description: "Total orders placed"
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.orders.totalRevenue),
      description: "Total sales revenue"
    },
    {
      title: "Inventory Value",
      value: formatCurrency(stats.inventory.inventoryValue),
      description: "Current stock value"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {metrics.map((metric, index) => {
        return (
          <Card key={index} className="group relative overflow-hidden border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:shadow-lg h-full">
            <CardContent className="p-2 sm:p-3 md:p-4 h-full flex flex-col">
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors mb-1 truncate">
                  {metric.value}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-600 transition-colors mb-1 truncate">
                  {metric.title}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-400 transition-colors leading-tight line-clamp-2">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
