import express from "express";
import multer from "multer";
import verifyJWT from "../middleware/auth.middleware.js";
import aiPdfUpload from "../middleware/aiPdfUpload.middleware.js";
import {
    testGemini,
    testPdfSummary
} from "../controllers/aiTest.controllers.js";

const router = express.Router();

router.post(
    "/test",
    verifyJWT,
    testGemini
);

router.post(
    "/test-pdf",
    verifyJWT,
    (req, res, next) => {
        aiPdfUpload.single("file")(
            req,
            res,
            (error) => {
                if (error instanceof multer.MulterError) {
                    if (
                        error.code ===
                        "LIMIT_FILE_SIZE"
                    ) {
                        return res.status(400).json({
                            message:
                                "PDF must be 10 MB or smaller",
                        });
                    }

                    return res.status(400).json({
                        message: error.message,
                    });
                }

                if (error) {
                    return res.status(400).json({
                        message: error.message,
                    });
                }

                next();
            }
        );
    },
    testPdfSummary
);

export default router;