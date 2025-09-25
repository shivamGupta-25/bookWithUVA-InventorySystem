"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export default function StockAlerts({ stats }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Stock Alerts
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 bg-amber-50/50 border-l-2 border-amber-200 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-gray-700">Stock Alerts:</span> Products that need immediate attention. Shows products with low stock or out-of-stock status based on configured thresholds to prevent stockouts and maintain inventory levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.stockAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No active stock alerts</p>
              <p className="text-sm">All products are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.stockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{alert.productName}</span>
                      <Badge className={`text-xs ${alert.alertType === 'low-stock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {alert.alertType === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Current stock: {alert.currentStock} units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {alert.currentStock} units
                    </div>
                    <div className="text-xs text-gray-500">
                      Threshold: {alert.threshold}
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
