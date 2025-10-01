import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxLength: [200, "Title cannot exceed 200 characters"],
    },
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Distributor",
      required: [true, "Distributor is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxLength: [50, "Category cannot exceed 50 characters"],
    },
    subCategory: {
      type: String,
      required: [true, "Sub-category is required"],
      trim: true,
      maxLength: [50, "Sub-category cannot exceed 50 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    gst: {
      type: Number,
      required: [true, "GST percentage is required"],
      min: [0, "GST cannot be negative"],
      max: [100, "GST cannot exceed 100%"],
      default: 18,
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, "Description cannot exceed 500 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
ProductSchema.index({
  title: "text",
  description: "text",
});
ProductSchema.index({ distributor: 1 });
ProductSchema.index({ category: 1, subCategory: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stock: 1 });

// Virtual for stock status (will be updated dynamically based on settings)
ProductSchema.virtual("stockStatus").get(function () {
  if (this.stock === 0) return "out-of-stock";
  if (this.stock <= 10) return "low-stock"; // Default threshold, will be overridden by settings
  return "in-stock";
});

// Ensure virtual fields are serialized
ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

export const product_model = mongoose.model("Product", ProductSchema);
export default product_model;
