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
          <CardDescription className="text-sm text-muted-foreground bg-amber-50/50 dark:bg-amber-950/20 border-l-2 border-amber-200 dark:border-amber-800 pl-3 py-2 rounded-r-md">
            <span className="font-medium text-foreground">Stock Alerts:</span> Products that need immediate attention. Shows products with low stock or out-of-stock status based on configured thresholds to prevent stockouts and maintain inventory levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.stockAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p>No active stock alerts</p>
              <p className="text-sm">All products are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.stockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">{alert.productName}</span>
                      <Badge className={`text-xs ${alert.alertType === 'low-stock' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                        {alert.alertType === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Current stock: {alert.currentStock} units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground">
                      {alert.currentStock} units
                    </div>
                    <div className="text-xs text-muted-foreground">
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
