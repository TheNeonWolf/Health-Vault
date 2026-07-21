import MedicalRecords from "../models/MedicalRecords.js";
import Resident from "../models/Resident.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const allowedCategories = [
    "Medical Report",
    "Medication",
    "Care Plan",
    "Therapy",
    "Assessment",
    "Appointment",
    "Emergency Information",
    "Other",
];

const removeUploadedFile = (file) => {
    if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
    }
};

const addMedicalRecord = async (req, res) => {
    try {
        const {
            resident,
            title,
            category,
            description,
            recordDate,
        } = req.body;

        if (!resident || !title?.trim()) {
            removeUploadedFile(req.file);

            return res.status(400).json({
                message: "Resident and title are required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Medical document is required",
            });
        }

        const residentExists = await Resident.findOne({
            _id: resident,
            createdBy: req.user._id,
        });

        if (!residentExists) {
            removeUploadedFile(req.file);

            return res.status(404).json({
                message: "Resident not found",
            });
        }

        const selectedCategory = category || "Other";

        if (!allowedCategories.includes(selectedCategory)) {
            removeUploadedFile(req.file);

            return res.status(400).json({
                message: "Invalid medical record category",
            });
        }

        const record = await MedicalRecords.create({
            resident,
            createdBy: req.user._id,
            title: title.trim(),
            category: selectedCategory,
            description: description?.trim() || "",
            recordDate: recordDate || new Date(),
            filePath: req.file.path,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
        });

        return res.status(201).json({
            message: "Medical record added successfully!",
            record,
        });
    } catch (error) {
        removeUploadedFile(req.file);

        return res.status(500).json({
            message: error.message,
        });
    }
};

const getMedicalRecords = async (req, res) => {
    try {
        const resident = await Resident.findOne({
            _id: req.params.residentId,
            createdBy: req.user._id,
        });

        if (!resident) {
            return res.status(404).json({
                message: "Resident not found",
            });
        }

        const records = await MedicalRecords.find({
            resident: req.params.residentId,
            createdBy: req.user._id,
        }).sort({ recordDate: -1 });

        const recordsWithUrls = records.map((record) => ({
            ...record.toObject(),
            fileUrl: `${process.env.BACKEND_URL}/api/records/${record._id}/file`
        }));

        return res.status(200).json(recordsWithUrls);
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const deleteMedicalRecord = async (req, res) => {
    try {
        const record = await MedicalRecords.findOneAndDelete({
            _id: req.params.recordId,
            createdBy: req.user._id
        });

        if(!record) {
            return res.status(404).json({
                message: "Medical record not found"
            });
        }

        if (record.filePath && fs.existsSync(record.filePath)) {
            fs.unlinkSync(record.filePath);
        }

        return res.status(200).json({
            message: "Medical record deleted successfully!"
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

const previewMedicalRecordFile = async (req, res) => {
    try {
        const { recordId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(recordId)) {
            return res.status(400).json({
                message: "Invalid medical record ID",
            });
        }

        const record = await MedicalRecords.findOne({
            _id: recordId,
            createdBy: req.user._id,
        });

        if (!record) {
            return res.status(404).json({
                message: "Medical record not found",
            });
        }

        if (!record.filePath) {
            return res.status(404).json({
                message: "No file is attached to this record",
            });
        }

        const uploadsDirectory = path.resolve("uploads");
        const absoluteFilePath = path.resolve(record.filePath);

        /*
         * Prevent a stored or manipulated path from accessing files
         * outside the uploads directory.
         */
        if (
            absoluteFilePath !== uploadsDirectory &&
            !absoluteFilePath.startsWith(
                `${uploadsDirectory}${path.sep}`
            )
        ) {
            return res.status(403).json({
                message: "File access denied",
            });
        }

        if (!fs.existsSync(absoluteFilePath)) {
            return res.status(404).json({
                message: "Uploaded file could not be found",
            });
        }

        const fileName =
            record.fileName ||
            path.basename(absoluteFilePath);

        const fileType =
            record.fileType ||
            "application/octet-stream";

        res.setHeader("Content-Type", fileType);

        /*
         * "inline" tells the browser to display supported files
         * instead of immediately downloading them.
         */
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${fileName.replace(/"/g, "")}"`
        );

        return res.sendFile(absoluteFilePath);
    } catch (error) {
        console.error("Preview record file error:", error);

        return res.status(500).json({
            message: "Unable to preview medical record file",
        });
    }
};

export {
    addMedicalRecord,
    getMedicalRecords,
    deleteMedicalRecord,
    previewMedicalRecordFile
};