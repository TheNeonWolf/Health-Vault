import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
    summarizeMedicalRecord,
} from "../controllers/recordSummary.controllers.js";

import {
    addMedicalRecord,
    getMedicalRecords,
    deleteMedicalRecord,
    previewMedicalRecordFile
} from "../controllers/record.controllers.js";

const router = express.Router();

router.post("/", verifyJWT, upload.single("document"), addMedicalRecord);
router.get("/resident/:residentId", verifyJWT, getMedicalRecords);
router.delete("/:recordId", verifyJWT, deleteMedicalRecord);
router.get("/:recordId/file", verifyJWT, previewMedicalRecordFile);
router.post(
    "/:recordId/summarize",
    verifyJWT,
    summarizeMedicalRecord
);

export default router;