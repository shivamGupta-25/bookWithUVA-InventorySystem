import mongoose from "mongoose";

// Define the interface for the Settings document
interface ISettings extends mongoose.Document {
  stockAlertThresholds: {
    lowStockThreshold: number;
    outOfStockThreshold: number;
  };
  notificationSettings: {
    enableLowStockAlerts: boolean;
    enableOutOfStockAlerts: boolean;
    alertFrequency: "immediate" | "hourly" | "daily";
    soundSettings: {
      enableSound: boolean;
      lowStockSound: string;
      outOfStockSound: string;
      volume: number;
    };
  };
  systemSettings: {
    lastUpdatedBy: mongoose.Types.ObjectId;
    version: number;
  };
}

// Define the interface for the Settings model with static methods
interface ISettingsModel extends mongoose.Model<ISettings> {
  getSettings(): Promise<ISettings>;
  updateSettings(updateData: any, userId: string): Promise<ISettings>;
}

const SettingsSchema = new mongoose.Schema<ISettings>(
  {
    // Stock alert thresholds
    stockAlertThresholds: {
      lowStockThreshold: {
        type: Number,
        default: 10,
        min: [0, "Low stock threshold cannot be negative"],
        max: [1000, "Low stock threshold cannot exceed 1000"],
      },
      outOfStockThreshold: {
        type: Number,
        default: 0,
        min: [0, "Out of stock threshold cannot be negative"],
      },
    },

    // Notification preferences
    notificationSettings: {
      enableLowStockAlerts: {
        type: Boolean,
        default: true,
      },
      enableOutOfStockAlerts: {
        type: Boolean,
        default: true,
      },
      alertFrequency: {
        type: String,
        enum: ["immediate", "hourly", "daily"],
        default: "immediate",
      },
      soundSettings: {
        enableSound: {
          type: Boolean,
          default: true,
        },
        lowStockSound: {
          type: String,
          enum: ["bell", "chime", "beep", "notification", "ding", "buzz", "pop", "whoosh", "trill", "siren", "success", "error", "warning"],
          default: "bell",
        },
        outOfStockSound: {
          type: String,
          enum: ["bell", "chime", "beep", "notification", "ding", "alarm", "buzz", "pop", "whoosh", "trill", "siren", "success", "error", "warning"],
          default: "alarm",
        },
        volume: {
          type: Number,
          min: [0, "Volume cannot be negative"],
          max: [100, "Volume cannot exceed 100"],
          default: 70,
        },
      },
    },

    // System settings
    systemSettings: {
      lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      version: {
        type: Number,
        default: 1,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SettingsSchema.index({}, { unique: true });

export const settings_model = mongoose.model<ISettings, ISettingsModel>("Settings", SettingsSchema);

// Static method to get or create settings
settings_model.getSettings = async function (): Promise<ISettings> {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings with a system user
    const User = mongoose.model("User");
    const systemUser = await User.findOne({ role: "admin" });

    settings = await this.create({
      systemSettings: {
        lastUpdatedBy: systemUser?._id || new mongoose.Types.ObjectId(),
      },
    });
  }
  return settings;
};

// Static method to update settings
settings_model.updateSettings = async function (updateData: any, userId: string): Promise<ISettings> {
  const settings = await this.getSettings();

  // Update the settings
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      settings.set(key, updateData[key]);
    }
  });

  // Update metadata
  settings.systemSettings.lastUpdatedBy = new mongoose.Types.ObjectId(userId);
  settings.systemSettings.version += 1;

  return await settings.save();
};
export default settings_model;
