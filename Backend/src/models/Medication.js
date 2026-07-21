import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
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

        name: {
            type: String,
            required: true,
            trim: true,
        },

        dosage: {
            type: String,
            required: true,
            trim: true,
        },

        instructions: {
            type: String,
            trim: true,
            default: "",
        },

        frequency: {
            type: String,
            enum: [
                "Once Daily",
                "Twice Daily",
                "Three Times Daily",
                "Four Times Daily",
                "As Needed",
                "Weekly",
                "Other",
            ],
            required: true,
        },

        times: {
            type: [String],
            default: [],
        },

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            default: null,
        },

        prescribedBy: {
            type: String,
            trim: true,
            default: "",
        },

        status: {
            type: String,
            enum: ["Active", "Paused", "Completed"],
            default: "Active",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

medicationSchema.index({
    createdBy: 1,
    resident: 1,
    status: 1,
});

export default mongoose.model("Medication", medicationSchema);