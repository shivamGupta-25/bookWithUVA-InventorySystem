import { Request, Response } from "express";
import { settings_model } from "../models/settings.js";
import { stockAlert_model } from "../models/stockAlert.js";
import { activityLog_model, ActivityType } from "../models/activityLog.js";

// GET /api/settings - Get current settings
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await settings_model.getSettings();

    res.status(200).json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch settings",
    });
  }
};

// PUT /api/settings - Update settings
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    const updateData = req.body;

    // Validate the update data
    if (updateData.stockAlertThresholds) {
      const { lowStockThreshold, outOfStockThreshold } = updateData.stockAlertThresholds;

      if (lowStockThreshold !== undefined) {
        if (lowStockThreshold < 0 || lowStockThreshold > 1000) {
          res.status(400).json({
            success: false,
            error: "Low stock threshold must be between 0 and 1000",
          });
          return;
        }
      }

      if (outOfStockThreshold !== undefined) {
        if (outOfStockThreshold < 0) {
          res.status(400).json({
            success: false,
            error: "Out of stock threshold cannot be negative",
          });
          return;
        }
      }
    }

    // Validate sound settings
    if (updateData.notificationSettings?.soundSettings) {
      const { enableSound, lowStockSound, outOfStockSound, volume } = updateData.notificationSettings.soundSettings;

      if (volume !== undefined) {
        if (volume < 0 || volume > 100) {
          res.status(400).json({
            success: false,
            error: "Volume must be between 0 and 100",
          });
          return;
        }
      }

      const validSounds = ["bell", "chime", "beep", "notification", "ding", "alarm", "buzz", "pop", "whoosh", "trill", "siren", "success", "error", "warning"];

      if (lowStockSound !== undefined && !validSounds.includes(lowStockSound)) {
        res.status(400).json({
          success: false,
          error: "Invalid low stock sound selection",
        });
        return;
      }

      if (outOfStockSound !== undefined && !validSounds.includes(outOfStockSound)) {
        res.status(400).json({
          success: false,
          error: "Invalid out of stock sound selection",
        });
        return;
      }
    }

    // Update settings
    const updatedSettings = await settings_model.updateSettings(updateData, currentUser._id);

    // Log activity
    await (activityLog_model as any).logActivity({
      user: currentUser._id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      activityType: ActivityType.UPDATE,
      description: "Updated system settings",
      userAgent: req.get("User-Agent") || "unknown",
    });

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: { settings: updatedSettings },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update settings",
    });
  }
};

// GET /api/settings/alerts - Get stock alerts
export const getStockAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, alertType, limit = 50, page = 1 } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (alertType) query.alertType = alertType;

    const skip = (Number(page) - 1) * Number(limit);

    const [alerts, totalCount] = await Promise.all([
      stockAlert_model
        .find(query)
        .populate("product", "title distributor")
        .populate("acknowledgedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      stockAlert_model.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        alerts,
        pagination: {
          total: totalCount,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching stock alerts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stock alerts",
    });
  }
};

// PUT /api/settings/alerts/:id/acknowledge - Acknowledge an alert
export const acknowledgeAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    const alert = await stockAlert_model.findById(id);
    if (!alert) {
      res.status(404).json({
        success: false,
        error: "Alert not found",
      });
      return;
    }

    if (alert.status !== "active") {
      res.status(400).json({
        success: false,
        error: "Alert is not active",
      });
      return;
    }

    alert.status = "acknowledged";
    alert.acknowledgedBy = currentUser._id;
    alert.acknowledgedAt = new Date();

    await alert.save();

    // Log activity
    await (activityLog_model as any).logActivity({
      user: currentUser._id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      activityType: ActivityType.UPDATE,
      description: `Acknowledged stock alert for product: ${alert.productName}`,
      userAgent: req.get("User-Agent") || "unknown",
    });

    res.status(200).json({
      success: true,
      message: "Alert acknowledged successfully",
      data: { alert },
    });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    res.status(500).json({
      success: false,
      error: "Failed to acknowledge alert",
    });
  }
};

// PUT /api/settings/alerts/:id/resolve - Resolve an alert
export const resolveAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    const alert = await stockAlert_model.findById(id);
    if (!alert) {
      res.status(404).json({
        success: false,
        error: "Alert not found",
      });
      return;
    }

    if (alert.status === "resolved") {
      res.status(400).json({
        success: false,
        error: "Alert is already resolved",
      });
      return;
    }

    alert.status = "resolved";
    alert.resolvedAt = new Date();

    await alert.save();

    // Log activity
    await (activityLog_model as any).logActivity({
      user: currentUser._id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      activityType: ActivityType.UPDATE,
      description: `Resolved stock alert for product: ${alert.productName}`,
      userAgent: req.get("User-Agent") || "unknown",
    });

    res.status(200).json({
      success: true,
      message: "Alert resolved successfully",
      data: { alert },
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resolve alert",
    });
  }
};

// GET /api/settings/alerts/stats - Get alert statistics
export const getAlertStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalAlerts,
      activeAlerts,
      acknowledgedAlerts,
      resolvedAlerts,
      lowStockAlerts,
      outOfStockAlerts,
    ] = await Promise.all([
      stockAlert_model.countDocuments(),
      stockAlert_model.countDocuments({ status: "active" }),
      stockAlert_model.countDocuments({ status: "acknowledged" }),
      stockAlert_model.countDocuments({ status: "resolved" }),
      stockAlert_model.countDocuments({ alertType: "low-stock", status: "active" }),
      stockAlert_model.countDocuments({ alertType: "out-of-stock", status: "active" }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalAlerts,
        active: activeAlerts,
        acknowledged: acknowledgedAlerts,
        resolved: resolvedAlerts,
        lowStock: lowStockAlerts,
        outOfStock: outOfStockAlerts,
      },
    });
  } catch (error) {
    console.error("Error fetching alert stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch alert statistics",
    });
  }
};

// DELETE /api/settings/alerts - Delete all stock alerts
export const deleteAllStockAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { confirmDeleteAll } = req.body || {};

    if (!confirmDeleteAll) {
      res.status(400).json({
        success: false,
        error: "Confirmation required to delete all stock alerts",
      });
      return;
    }

    const result = await stockAlert_model.deleteMany({});

    // Log activity
    const currentUser = (req as any).user;
    if (currentUser) {
      await (activityLog_model as any).logActivity({
        user: currentUser._id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        activityType: ActivityType.DELETE,
        description: `Deleted ${result.deletedCount || 0} stock alerts`,
        resource: "StockAlerts",
        userAgent: req.get("User-Agent") || "unknown",
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount || 0} stock alerts`,
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    console.error("Error deleting all stock alerts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete all stock alerts",
    });
  }
};
