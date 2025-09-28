"use client";

import React, { useState, useEffect } from 'react'
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
import { Trash2, Database, ShieldAlert, Loader2, Settings, Bell, AlertTriangle, Package, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import soundManager from "@/lib/soundUtils";

const SettingsPage = () => {
  const [busy, setBusy] = useState({
    products: false,
    distributors: false,
    orders: false,
    logs: false,
    settings: false
  });
  const [open, setOpen] = useState({
    products: false,
    distributors: false,
    orders: false,
    logs: false
  });

  // Settings state
  const [settings, setSettings] = useState({
    stockAlertThresholds: {
      lowStockThreshold: 10,
      outOfStockThreshold: 0,
    },
    notificationSettings: {
      enableLowStockAlerts: true,
      enableOutOfStockAlerts: true,
      alertFrequency: "immediate",
      soundSettings: {
        enableSound: true,
        lowStockSound: "bell",
        outOfStockSound: "alarm",
        volume: 70,
      },
    },
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.settings.get();
      const data = await response.json();

      if (data.success && data.data.settings) {
        setSettings(data.data.settings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async () => {
    try {
      setBusy(prev => ({ ...prev, settings: true }));

      const response = await api.settings.update(settings);
      const data = await response.json();

      if (data.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setBusy(prev => ({ ...prev, settings: false }));
    }
  };

  const handleThresholdChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    setSettings(prev => ({
      ...prev,
      stockAlertThresholds: {
        ...prev.stockAlertThresholds,
        [field]: numValue,
      },
    }));
  };

  const handleNotificationChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [field]: value,
      },
    }));
  };

  const handleSoundSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        soundSettings: {
          ...prev.notificationSettings.soundSettings,
          [field]: value,
        },
      },
    }));
  };

  const testSound = (soundType) => {
    soundManager.testSound(soundType);
  };

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
          <Settings className="h-6 w-6 text-foreground" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">Configure system settings and manage data. Admins only.</p>

        <Tabs defaultValue="stock-alerts" className="space-y-6">
          <TabsList className="w-full flex flex-row gap-1 p-1 bg-muted rounded-lg h-auto overflow-x-auto">
            <TabsTrigger
              value="stock-alerts"
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 h-auto min-h-[36px] transition-all duration-200 hover:bg-background/50 min-w-fit"
            >
              <Bell className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:hidden">Stock</span>
              <span className="hidden sm:inline">Stock Alerts</span>
              <span className="xs:hidden">Stock</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 h-auto min-h-[36px] transition-all duration-200 hover:bg-background/50 min-w-fit"
            >
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:hidden">Alerts</span>
              <span className="hidden sm:inline">Notifications</span>
              <span className="xs:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger
              value="data-management"
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 h-auto min-h-[36px] transition-all duration-200 hover:bg-background/50 min-w-fit"
            >
              <Database className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:hidden">Data</span>
              <span className="hidden sm:inline">Data Management</span>
              <span className="xs:hidden">Data</span>
            </TabsTrigger>
          </TabsList>

          {/* Stock Alerts Tab */}
          <TabsContent value="stock-alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Stock Alert Thresholds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      min="0"
                      max="1000"
                      value={settings.stockAlertThresholds.lowStockThreshold}
                      onChange={(e) => handleThresholdChange("lowStockThreshold", e.target.value)}
                      placeholder="Enter threshold"
                    />
                    <p className="text-sm text-muted-foreground">
                      Products with stock at or below this level will trigger low stock alerts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="outOfStockThreshold">Out of Stock Threshold</Label>
                    <Input
                      id="outOfStockThreshold"
                      type="number"
                      min="0"
                      value={settings.stockAlertThresholds.outOfStockThreshold}
                      onChange={(e) => handleThresholdChange("outOfStockThreshold", e.target.value)}
                      placeholder="Enter threshold"
                    />
                    <p className="text-sm text-muted-foreground">
                      Products with stock at or below this level will trigger out of stock alerts
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={saveSettings}
                    disabled={busy.settings}
                    className="min-w-[120px]"
                  >
                    {busy.settings ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Settings Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Current Settings Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Low Stock Threshold</Label>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {settings.stockAlertThresholds.lowStockThreshold} units
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Out of Stock Threshold</Label>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {settings.stockAlertThresholds.outOfStockThreshold} units
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when products reach low stock levels
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.enableLowStockAlerts}
                      onCheckedChange={(checked) => handleNotificationChange("enableLowStockAlerts", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable Out of Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when products are out of stock
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.enableOutOfStockAlerts}
                      onCheckedChange={(checked) => handleNotificationChange("enableOutOfStockAlerts", checked)}
                    />
                  </div>

                </div>

                {/* Sound Settings */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    {settings.notificationSettings.soundSettings.enableSound ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                    Sound Settings
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Enable Notification Sounds</Label>
                        <p className="text-sm text-muted-foreground">
                          Play sounds when stock alerts are triggered
                        </p>
                      </div>
                      <Switch
                        checked={settings.notificationSettings.soundSettings.enableSound}
                        onCheckedChange={(checked) => handleSoundSettingChange("enableSound", checked)}
                      />
                    </div>

                    {settings.notificationSettings.soundSettings.enableSound && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Low Stock Sound</Label>
                            <div className="flex gap-2">
                              <Select
                                value={settings.notificationSettings.soundSettings.lowStockSound}
                                onValueChange={(value) => handleSoundSettingChange("lowStockSound", value)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select sound" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bell">Bell</SelectItem>
                                  <SelectItem value="chime">Chime</SelectItem>
                                  <SelectItem value="beep">Beep</SelectItem>
                                  <SelectItem value="notification">Notification</SelectItem>
                                  <SelectItem value="ding">Ding</SelectItem>
                                  <SelectItem value="buzz">Buzz</SelectItem>
                                  <SelectItem value="pop">Pop</SelectItem>
                                  <SelectItem value="whoosh">Whoosh</SelectItem>
                                  <SelectItem value="trill">Trill</SelectItem>
                                  <SelectItem value="siren">Siren</SelectItem>
                                  <SelectItem value="success">Success</SelectItem>
                                  <SelectItem value="error">Error</SelectItem>
                                  <SelectItem value="warning">Warning</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testSound(settings.notificationSettings.soundSettings.lowStockSound)}
                                className="px-3"
                              >
                                Test
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Out of Stock Sound</Label>
                            <div className="flex gap-2">
                              <Select
                                value={settings.notificationSettings.soundSettings.outOfStockSound}
                                onValueChange={(value) => handleSoundSettingChange("outOfStockSound", value)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select sound" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bell">Bell</SelectItem>
                                  <SelectItem value="chime">Chime</SelectItem>
                                  <SelectItem value="beep">Beep</SelectItem>
                                  <SelectItem value="notification">Notification</SelectItem>
                                  <SelectItem value="ding">Ding</SelectItem>
                                  <SelectItem value="alarm">Alarm</SelectItem>
                                  <SelectItem value="buzz">Buzz</SelectItem>
                                  <SelectItem value="pop">Pop</SelectItem>
                                  <SelectItem value="whoosh">Whoosh</SelectItem>
                                  <SelectItem value="trill">Trill</SelectItem>
                                  <SelectItem value="siren">Siren</SelectItem>
                                  <SelectItem value="success">Success</SelectItem>
                                  <SelectItem value="error">Error</SelectItem>
                                  <SelectItem value="warning">Warning</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testSound(settings.notificationSettings.soundSettings.outOfStockSound)}
                                className="px-3"
                              >
                                Test
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Volume: {settings.notificationSettings.soundSettings.volume}%</Label>
                          <div className="px-2">
                            <Slider
                              value={[settings.notificationSettings.soundSettings.volume]}
                              onValueChange={(value) => handleSoundSettingChange("volume", value[0])}
                              max={100}
                              min={0}
                              step={1}
                              className="w-full"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={saveSettings}
                    disabled={busy.settings}
                    className="min-w-[120px]"
                  >
                    {busy.settings ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data-management" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Delete all products from the database.</p>
                  <AlertDialog open={open.products} onOpenChange={(v) => setOpen((o) => ({ ...o, products: v }))}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="h-5 w-5" /> Delete ALL Products?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action is irreversible and will remove every product record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy.products}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
                  <p className="text-sm text-muted-foreground">Delete all distributors from the database.</p>
                  <AlertDialog open={open.distributors} onOpenChange={(v) => setOpen((o) => ({ ...o, distributors: v }))}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="h-5 w-5" /> Delete ALL Distributors?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action is irreversible and will remove every distributor record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy.distributors}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
                  <p className="text-sm text-muted-foreground">Delete all orders and restore product stock.</p>
                  <AlertDialog open={open.orders} onOpenChange={(v) => setOpen((o) => ({ ...o, orders: v }))}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="h-5 w-5" /> Delete ALL Orders?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action is irreversible and will remove every order record and restore product stock.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy.orders}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
                  <p className="text-sm text-muted-foreground">Delete all activity logs (audit trail).</p>
                  <AlertDialog open={open.logs} onOpenChange={(v) => setOpen((o) => ({ ...o, logs: v }))}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="h-5 w-5" /> Delete ALL Activity Logs?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action is irreversible and will remove all audit logs. Consider exporting before deletion.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy.logs}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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

              {/* Stock Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Alerts</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Delete all stock alerts (low/out-of-stock notifications).</p>
                  <AlertDialog open={open.stockalerts} onOpenChange={(v) => setOpen((o) => ({ ...o, stockalerts: v }))}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="h-5 w-5" /> Delete ALL Stock Alerts?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action is irreversible and will remove every stock alert record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy.stockalerts}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          disabled={busy.stockalerts}
                          onClick={() =>
                            run("stockalerts", () => api.stockAlerts.deleteAll(), (d) => `Deleted ${d.deletedCount || d.data?.deletedCount || 0} stock alerts`)
                          }
                        >
                          {busy.stockalerts ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : "Delete All"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}

export default SettingsPage

