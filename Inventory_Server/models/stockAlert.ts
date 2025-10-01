import mongoose from "mongoose";

const StockAlertSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    alertType: {
      type: String,
      enum: ["low-stock", "out-of-stock"],
      required: [true, "Alert type is required"],
    },
    currentStock: {
      type: Number,
      required: [true, "Current stock is required"],
      min: [0, "Stock cannot be negative"],
    },
    threshold: {
      type: Number,
      required: [true, "Threshold is required"],
      min: [0, "Threshold cannot be negative"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "acknowledged", "resolved"],
      default: "active",
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
StockAlertSchema.index({ product: 1, status: 1 });
StockAlertSchema.index({ alertType: 1, status: 1 });
StockAlertSchema.index({ createdAt: -1 });
StockAlertSchema.index({ priority: 1, status: 1 });

// Virtual for alert age
StockAlertSchema.virtual("age").get(function () {
  return Date.now() - this.createdAt.getTime();
});

// Static method to create alert
StockAlertSchema.statics.createAlert = async function (alertData: any) {
  // Check if there's already an active alert for this product and type
  const existingAlert = await this.findOne({
    product: alertData.product,
    alertType: alertData.alertType,
    status: "active",
  });

  if (existingAlert) {
    // Update existing alert instead of creating new one
    existingAlert.currentStock = alertData.currentStock;
    existingAlert.threshold = alertData.threshold;
    existingAlert.message = alertData.message;
    existingAlert.priority = alertData.priority;
    return await existingAlert.save();
  }

  // Create new alert
  return await this.create(alertData);
};

// Static method to resolve alerts for a product
StockAlertSchema.statics.resolveProductAlerts = async function (productId: string, newStock: number) {
  const alerts = await this.find({
    product: productId,
    status: "active",
  });

  for (const alert of alerts) {
    // Check if stock is now above threshold
    if (newStock > alert.threshold) {
      alert.status = "resolved";
      alert.resolvedAt = new Date();
      await alert.save();
    }
  }
};

// Ensure virtual fields are serialized
StockAlertSchema.set("toJSON", { virtuals: true });
StockAlertSchema.set("toObject", { virtuals: true });

export const stockAlert_model = mongoose.model("StockAlert", StockAlertSchema);
export default stockAlert_model;
