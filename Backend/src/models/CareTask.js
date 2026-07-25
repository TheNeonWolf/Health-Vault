import mongoose from "mongoose";

const careTaskSchema =
    new mongoose.Schema(
        {
            resident: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Resident",
                required: true,
                index: true,
            },

            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
                index: true,
            },

            title: {
                type: String,
                required: true,
                trim: true,
                maxlength: 120,
            },

            notes: {
                type: String,
                trim: true,
                default: "",
                maxlength: 500,
            },

            scheduledTime: {
                type: String,
                trim: true,
                default: "",
            },

            date: {
                type: Date,
                required: true,
            },

            isCompleted: {
                type: Boolean,
                default: false,
            },

            completedAt: {
                type: Date,
                default: null,
            },
        },
        {
            timestamps: true,
        }
    );

careTaskSchema.index({
    createdBy: 1,
    resident: 1,
    date: 1,
});

export default mongoose.model(
    "CareTask",
    careTaskSchema
);