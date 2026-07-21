import mongoose from "mongoose";

const residentSchema = new mongoose.Schema(
    {
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

        age: {
            type: Number,
            min: 0,
            max: 130,
        },

        roomNumber: {
            type: String,
            trim: true,
            default: "",
        },

        emergencyContactName: {
            type: String,
            trim: true,
            default: "",
        },

        emergencyContactPhone: {
            type: String,
            trim: true,
            default: "",
        },

        supportNeeds: {
            type: String,
            trim: true,
            default: "",
        },

        allergies: {
            type: String,
            trim: true,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        bloodType: {
            type: String,
            enum: [
                "A+",
                "A-",
                "B+",
                "B-",
                "AB+",
                "AB-",
                "O+",
                "O-",
                "Unknown",
            ],
            default: "Unknown",
        },

        primaryCondition: {
            type: String,
            trim: true,
            default: "",
        },

        mobilityNeeds: {
            type: String,
            trim: true,
            default: "",
        },

        communicationNeeds: {
            type: String,
            trim: true,
            default: "",
        },

        preferredHospital: {
            type: String,
            trim: true,
            default: "",
        },

        emergencyNotes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Resident", residentSchema);