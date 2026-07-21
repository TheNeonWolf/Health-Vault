import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        verificationToken: {
            type: String,
            select: false
        },

        resetPasswordToken: {
            type: String,
            select: false
        },

        resetPasswordExpires: {
            type: Date,
            select: false
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("User", userSchema);