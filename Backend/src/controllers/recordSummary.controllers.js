import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import MedicalRecords from "../models/MedicalRecords.js";
import {
    summarizePdf,
} from "../services/gemini.service.js";

const summarizeMedicalRecord = async (req, res) => {
    let record = null;

    try {
        const { recordId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(recordId)) {
            return res.status(400).json({
                message: "Invalid medical record ID",
            });
        }

        record = await MedicalRecords.findOne({
            _id: recordId,
            createdBy: req.user._id,
        });

        if (!record) {
            return res.status(404).json({
                message: "Medical record not found",
            });
        }

        if (record.fileType !== "application/pdf") {
            return res.status(400).json({
                message:
                    "AI summaries are currently available for PDF files only",
            });
        }

        if (!record.filePath) {
            return res.status(404).json({
                message:
                    "No file is attached to this medical record",
            });
        }

        if (record.summaryStatus === "processing") {
            return res.status(409).json({
                message:
                    "This medical record is already being summarized",
            });
        }

        const uploadsDirectory = path.resolve("uploads");
        const absoluteFilePath = path.resolve(
            record.filePath
        );

        const fileIsInsideUploads =
            absoluteFilePath.startsWith(
                `${uploadsDirectory}${path.sep}`
            );

        if (!fileIsInsideUploads) {
            return res.status(403).json({
                message: "File access denied",
            });
        }

        if (!fs.existsSync(absoluteFilePath)) {
            return res.status(404).json({
                message:
                    "The uploaded PDF could not be found",
            });
        }

        record.summaryStatus = "processing";
        record.summaryError = null;
        await record.save();

        await record.save();

        const pdfBuffer =
            await fs.promises.readFile(
                absoluteFilePath
            );

        const aiSummary =
            await summarizePdf(pdfBuffer);

        record.aiSummary = aiSummary;
        record.summaryStatus = "completed";
        record.summaryError = "";
        record.summarizedAt = new Date();

        await record.save();

        return res.status(200).json({
            message:
                "Medical record summarized successfully",

            recordId: record._id,
            summaryStatus: record.summaryStatus,
            aiSummary: record.aiSummary,
            summarizedAt: record.summarizedAt,

            disclaimer:
                "AI-generated summary. Verify all details against the original document.",
        });
    } catch (error) {
        console.error(
            "Medical record summary error:",
            error
        );

        if (record) {
            try {
                record.summaryStatus = "failed";
                record.summaryError =
                    "The document could not be summarized";

                await record.save();
            } catch (saveError) {
                console.error(
                    "Could not save summary failure status:",
                    saveError
                );
            }
        }

        if (error.status === 429) {
            return res.status(429).json({
                message:
                    "Gemini rate limit reached. Please try again later.",
            });
        }

        return res.status(500).json({
            message:
                "The document could not be summarized. Please try again.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

export {
    summarizeMedicalRecord,
};