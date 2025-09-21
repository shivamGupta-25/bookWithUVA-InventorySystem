"use client";

import React, { useState, useEffect } from "react";
import { Bell, AlertTriangle, Package, X, Check, Clock, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import { toast } from "sonner";
import soundManager from "@/lib/soundUtils";

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getNotificationIcon,
    getPriorityColor,
  } = useNotifications();
  
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Check if user can manage alerts (Admin or Manager only)
  const canManageAlerts = user && (user.role === 'admin' || user.role === 'manager');

  // Load sound preference from localStorage on mount
  useEffect(() => {
    const savedSoundPreference = localStorage.getItem('notificationSoundEnabled');
    if (savedSoundPreference !== null) {
      const isEnabled = JSON.parse(savedSoundPreference);
      setIsSoundEnabled(isEnabled);
      soundManager.setEnabled(isEnabled);
    }
  }, []);

  // Load alerts when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 50,
      };

      const response = await api.stockAlerts.getAll(params);
      const data = await response.json();

      if (data.success) {
        setAlerts(data.data.alerts);
      } else {
        toast.error(data.error || 'Failed to load alerts');
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      const response = await api.stockAlerts.acknowledge(alertId);
      const data = await response.json();

      if (data.success) {
        toast.success('Alert acknowledged');
        loadAlerts();
      } else {
        toast.error(data.error || 'Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      const response = await api.stockAlerts.resolve(alertId);
      const data = await response.json();

      if (data.success) {
        toast.success('Alert resolved');
        loadAlerts();
      } else {
        toast.error(data.error || 'Failed to resolve alert');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'out-of-stock':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'low-stock':
        return <Package className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'destructive';
      case 'acknowledged':
        return 'secondary';
      case 'resolved':
        return 'default';
      default:
        return 'outline';
    }
  };

  const filteredAlerts = alerts;

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all alerts as acknowledged on the server
      const acknowledgePromises = alerts
        .filter(alert => alert.status === 'active')
        .map(alert => api.stockAlerts.acknowledge(alert._id));
      
      await Promise.all(acknowledgePromises);
      
      // Reload alerts to reflect changes
      await loadAlerts();
      
      // Also update the context notifications
      markAllAsRead();
      
      toast.success('All alerts acknowledged');
    } catch (error) {
      console.error('Error acknowledging alerts:', error);
      toast.error('Failed to acknowledge alerts');
    }
  };

  const handleClearAll = async () => {
    try {
      // Resolve all alerts on the server
      const resolvePromises = alerts
        .filter(alert => ['active', 'acknowledged'].includes(alert.status))
        .map(alert => api.stockAlerts.resolve(alert._id));
      
      await Promise.all(resolvePromises);
      
      // Clear context notifications
      clearNotifications();
      
      // Close dialog
      setIsOpen(false);
      
      toast.success('All alerts resolved');
    } catch (error) {
      console.error('Error resolving alerts:', error);
      toast.error('Failed to resolve alerts');
    }
  };

  const toggleSound = () => {
    const newSoundState = !isSoundEnabled;
    setIsSoundEnabled(newSoundState);
    soundManager.setEnabled(newSoundState);
    localStorage.setItem('notificationSoundEnabled', JSON.stringify(newSoundState));
    
    toast.success(newSoundState ? 'Alert sounds enabled' : 'Alert sounds muted');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {!isLoading && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse rounded-full"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          {!isConnected && (
            <span className="absolute -bottom-1 -right-1 h-2 w-2 bg-gray-400 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-[95vw] max-w-md sm:w-96 md:w-[28rem] lg:w-[32rem] p-0" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <Card className="border-0 shadow-none">
           <CardHeader className="flex items-center justify-between px-3 py-1 sm:px-4 sm:py-1.5 pb-0">
             <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
               <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
               <span className="truncate">Stock Alerts</span>
             </CardTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Sound toggle button - available for all users */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSound}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 sm:px-2"
                title={isSoundEnabled ? "Mute alert sounds" : "Enable alert sounds"}
              >
                {isSoundEnabled ? (
                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
              
              {canManageAlerts && alerts.filter(alert => alert.status === 'active').length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 sm:px-2"
                  disabled={loading}
                  title="Acknowledge all"
                >
                  <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
              {canManageAlerts && alerts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 sm:px-2 text-red-600 hover:text-red-700"
                  disabled={loading}
                  title="Clear all"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Viewer Notice */}
            {!canManageAlerts && (
              <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">Viewer Mode:</span> You can view alerts but cannot acknowledge or resolve them.
                </p>
              </div>
            )}
            
            {/* Alerts List */}
            <ScrollArea className="h-[60vh] max-h-80 sm:h-80">
              {loading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs sm:text-sm">No alerts found</p>
                </div>
              ) : (
                <div className="p-1 sm:p-2 space-y-1 sm:space-y-2">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert._id}
                      className="p-2 sm:p-3 rounded-lg border transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getAlertIcon(alert.alertType)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {alert.productName}
                            </p>
                            <div className="flex items-center gap-1 flex-wrap">
                              <Badge
                                variant={getAlertPriorityColor(alert.priority)}
                                className="text-[10px] sm:text-xs px-1.5 py-0.5 h-4 sm:h-5"
                              >
                                {alert.priority}
                              </Badge>
                              <Badge
                                variant={getStatusColor(alert.status)}
                                className="text-[10px] sm:text-xs px-1.5 py-0.5 h-4 sm:h-5"
                              >
                                {alert.status}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-[10px] sm:text-xs text-gray-600 mb-2 overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {alert.message}
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                              <span className="truncate">Stock: {alert.currentStock}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="flex items-center gap-1 truncate">
                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                </span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                              {canManageAlerts && alert.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAcknowledge(alert._id)}
                                  className="h-6 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs min-w-[44px] sm:min-w-[50px]"
                                >
                                  <span className="hidden sm:inline">Ack</span>
                                  <span className="sm:hidden">✓</span>
                                </Button>
                              )}
                              {canManageAlerts && alert.status !== 'resolved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolve(alert._id)}
                                  className="h-6 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs min-w-[44px] sm:min-w-[60px]"
                                >
                                  <span className="hidden sm:inline">Resolve</span>
                                  <span className="sm:hidden">✕</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
