"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, AlertTriangle, Package } from "lucide-react";
import api from "@/lib/api";
import soundManager from "@/lib/soundUtils";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications from server and localStorage on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Load from localStorage first for immediate display
        const savedUnreadCount = localStorage.getItem('notificationUnreadCount');
        if (savedUnreadCount) {
          setUnreadCount(parseInt(savedUnreadCount));
        }

        // Fetch active alerts from server
        const response = await api.stockAlerts.getAll({
          status: 'active',
          limit: 50
        });
        const data = await response.json();

        if (data.success) {
          // Convert server alerts to notification format
          const serverNotifications = data.data.alerts.map(alert => ({
            id: alert._id || alert.id,
            type: "stock-alert",
            alertType: alert.alertType,
            productName: alert.productName,
            currentStock: alert.currentStock,
            threshold: alert.threshold,
            message: alert.message,
            priority: alert.priority,
            timestamp: new Date(alert.createdAt),
            read: false,
          }));

          setNotifications(serverNotifications);

          // Update unread count based on server data
          const activeCount = serverNotifications.length;
          setUnreadCount(activeCount);
          localStorage.setItem('notificationUnreadCount', activeCount.toString());
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Only connect in browser environment
    if (typeof window !== "undefined") {
      // Dynamic import to avoid SSR issues
      import("socket.io-client").then(({ io }) => {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const socketUrl = API_BASE_URL.replace("/api", "");

        const newSocket = io(socketUrl, {
          transports: ["websocket", "polling"],
        });

        newSocket.on("connect", () => {
          console.log("Connected to WebSocket server");
          setIsConnected(true);
        });

        newSocket.on("disconnect", () => {
          console.log("Disconnected from WebSocket server");
          setIsConnected(false);
        });

        newSocket.on("stockAlert", (data) => {
          console.log("Received stock alert:", data);
          handleStockAlert(data);
        });

        setSocket(newSocket);

        return () => {
          newSocket.close();
        };
      }).catch((error) => {
        console.error("Failed to load socket.io-client:", error);
      });
    }
  }, []);

  const handleStockAlert = (data) => {
    const { alert, type, timestamp, soundSettings } = data;

    // Add to notifications list
    const newNotification = {
      id: Date.now() + Math.random(),
      type: "stock-alert",
      alertType: alert.alertType,
      productName: alert.productName,
      currentStock: alert.currentStock,
      threshold: alert.threshold,
      message: alert.message,
      priority: alert.priority,
      timestamp: new Date(timestamp),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => {
      const newCount = prev + 1;
      localStorage.setItem('notificationUnreadCount', newCount.toString());
      return newCount;
    });

    // Play notification sound if enabled (check both server settings and local preference)
    const localSoundEnabled = localStorage.getItem('notificationSoundEnabled');
    const isLocalSoundEnabled = localSoundEnabled !== null ? JSON.parse(localSoundEnabled) : true;

    if (soundSettings && soundSettings.enableSound && isLocalSoundEnabled) {
      soundManager.setVolume(soundSettings.volume);
      soundManager.setEnabled(true);

      const soundType = alert.alertType === "out-of-stock"
        ? soundSettings.outOfStockSound
        : soundSettings.lowStockSound;

      soundManager.playSound(soundType);
    }

    // Show toast notification
    const toastMessage = `${alert.productName}: ${alert.message}`;
    const toastOptions = {
      duration: 8000,
    };

    if (alert.alertType === "out-of-stock") {
      toast.error(toastMessage, {
        ...toastOptions,
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      });
    } else if (alert.alertType === "low-stock") {
      toast.warning(toastMessage, {
        ...toastOptions,
        icon: <Package className="h-4 w-4 text-orange-500" />,
      });
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      localStorage.setItem('notificationUnreadCount', newCount.toString());
      return newCount;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
    localStorage.setItem('notificationUnreadCount', '0');
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.setItem('notificationUnreadCount', '0');
  };

  const getNotificationIcon = (alertType) => {
    switch (alertType) {
      case "out-of-stock":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "low-stock":
        return <Package className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const value = {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getNotificationIcon,
    getPriorityColor,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
