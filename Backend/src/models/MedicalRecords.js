import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
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
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        category: {
            type: String,
            enum: [
                "Medical Report",
                "Medication",
                "Care Plan",
                "Therapy",
                "Assessment",
                "Appointment",
                "Emergency Information",
                "Other",
            ],
            default: "Other",
        },

        recordDate: {
            type: Date,
            default: Date.now,
        },

        filePath: {
            type: String,
            required: true,
        },

        fileName: {
            type: String,
            required: true,
            trim: true,
        },

        fileType: {
            type: String,
            required: true,
        },

        aiSummary: {
            overview: {
                type: String,
                trim: true,
                default: "",
            },

            conditions: {
                type: [String],
                default: [],
            },

            medications: {
                type: [String],
                default: [],
            },

            allergies: {
                type: [String],
                default: [],
            },

            followUps: {
                type: [String],
                default: [],
            },

            importantNotes: {
                type: [String],
                default: [],
            },
        },

        summaryStatus: {
            type: String,
            enum: [
                "not_requested",
                "processing",
                "completed",
                "failed",
            ],
            default: "not_requested",
        },

        summaryError: {
            type: String,
            trim: true,
            default: "",
        },

        summarizedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

medicalRecordSchema.index({
    createdBy: 1,
    resident: 1,
    recordDate: -1,
});

export default mongoose.model(
    "MedicalRecords",
    medicalRecordSchema
);