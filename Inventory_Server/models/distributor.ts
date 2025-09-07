import mongoose from "mongoose";

const DistributorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Distributor name is required"],
            trim: true,
            maxLength: [150, "Name cannot exceed 150 characters"],
        },
        phoneNumber: {
            type: String,
            trim: true,
            maxLength: [20, "Phone number cannot exceed 20 characters"],
        },
        address: {
            type: String,
            trim: true,
            maxLength: [500, "Address cannot exceed 500 characters"],
        },
        gstinNumber: {
            type: String,
            trim: true,
            maxLength: [30, "GSTIN cannot exceed 30 characters"],
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

DistributorSchema.index({ name: "text", gstinNumber: "text" });

export const distributor_model = mongoose.model("Distributor", DistributorSchema);
export default distributor_model;


