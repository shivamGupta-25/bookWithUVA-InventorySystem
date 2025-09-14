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
            validate: {
                validator: function(v) {
                    if (!v) return true; // Allow empty phone numbers
                    // Remove all non-digit characters
                    const digits = v.replace(/\D/g, '');
                    // Check if it's exactly 10 digits and doesn't start with 0
                    return digits.length === 10 && !digits.startsWith('0');
                },
                message: "Phone number must be exactly 10 digits and cannot start with 0"
            }
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            maxLength: [100, "Email cannot exceed 100 characters"],
            validate: {
                validator: function(v) {
                    if (!v) return true; // Allow empty emails
                    // More comprehensive email validation
                    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                    return emailRegex.test(v);
                },
                message: "Please enter a valid email address"
            }
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

DistributorSchema.index({ name: "text", gstinNumber: "text", email: "text" });

export const distributor_model = mongoose.model("Distributor", DistributorSchema);
export default distributor_model;


