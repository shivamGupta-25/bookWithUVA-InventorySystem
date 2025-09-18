"use client";

import React, { useState } from 'react'
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Database, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const Settings = () => {
  const [busy, setBusy] = useState({ products: false, distributors: false, orders: false, logs: false });
  const [open, setOpen] = useState({ products: false, distributors: false, orders: false, logs: false });

  const run = async (key, fn, successMessage) => {
    setBusy((s) => ({ ...s, [key]: true }));
    try {
      const res = await fn();
      const data = await res.json();
      if (data.success) {
        toast.success(successMessage(data));
      } else {
        toast.error(data.error || "Operation failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Operation failed");
    } finally {
      setBusy((s) => ({ ...s, [key]: false }));
      setOpen((o) => ({ ...o, [key]: false }));
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-sm text-gray-600">Danger zone utilities for deleting data across models. Admins only.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Delete all products from the database.</p>
              <AlertDialog open={open.products} onOpenChange={(v) => setOpen((o) => ({ ...o, products: v }))}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600"><ShieldAlert className="h-5 w-5" /> Delete ALL Products?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is irreversible and will remove every product record.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy.products}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      disabled={busy.products}
                      onClick={() =>
                        run("products", () => api.products.deleteAll(), (d) => `Deleted ${d.deletedCount || d.data?.deletedCount || 0} products`)
                      }
                    >
                      {busy.products ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : "Delete All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Distributors */}
          <Card>
            <CardHeader>
              <CardTitle>Distributors</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Delete all distributors from the database.</p>
              <AlertDialog open={open.distributors} onOpenChange={(v) => setOpen((o) => ({ ...o, distributors: v }))}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600"><ShieldAlert className="h-5 w-5" /> Delete ALL Distributors?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is irreversible and will remove every distributor record.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy.distributors}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      disabled={busy.distributors}
                      onClick={() =>
                        run("distributors", () => api.distributors.deleteAll(), (d) => `Deleted ${d.deletedCount || d.data?.deletedCount || 0} distributors`)
                      }
                    >
                      {busy.distributors ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : "Delete All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Delete all orders and restore product stock.</p>
              <AlertDialog open={open.orders} onOpenChange={(v) => setOpen((o) => ({ ...o, orders: v }))}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600"><ShieldAlert className="h-5 w-5" /> Delete ALL Orders?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is irreversible and will remove every order record and restore product stock.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy.orders}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      disabled={busy.orders}
                      onClick={() =>
                        run("orders", () => api.orders.deleteAll(), (d) => `Deleted ${d.data?.deletedCount || d.deletedCount || 0} orders`)
                      }
                    >
                      {busy.orders ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : "Delete All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Delete all activity logs (audit trail).</p>
              <AlertDialog open={open.logs} onOpenChange={(v) => setOpen((o) => ({ ...o, logs: v }))}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600"><ShieldAlert className="h-5 w-5" /> Delete ALL Activity Logs?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is irreversible and will remove all audit logs. Consider exporting before deletion.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy.logs}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      disabled={busy.logs}
                      onClick={() =>
                        run("logs", () => api.activityLogs.deleteAll(0), (d) => `Deleted ${d.data?.deletedCount || d.deletedCount || 0} logs`)
                      }
                    >
                      {busy.logs ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : "Delete All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Settings
