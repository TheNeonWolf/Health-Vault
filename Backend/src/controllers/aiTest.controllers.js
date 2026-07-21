import {
    testGeminiConnection,
    summarizePdf
} from "../services/gemini.service.js";

const testGemini = async (req, res) => {
    try {
        const responseText =
            await testGeminiConnection();

        return res.status(200).json({
            message: "Gemini API connection is working",
            response: responseText,
        });
    } catch (error) {
        console.error("Gemini test error:", error);

        let statusCode = 500;
        let message = "Unable to connect to the Gemini API";

        if (
            error.message?.includes(
                "GEMINI_API_KEY is missing"
            )
        ) {
            message = "Gemini API key is not configured";
        }

        if (
            error.status === 400 ||
            error.status === 401 ||
            error.status === 403
        ) {
            statusCode = error.status;
            message =
                "The Gemini API key is invalid or does not have access";
        }

        if (error.status === 429) {
            statusCode = 429;
            message =
                "Gemini rate limit reached. Please try again later.";
        }

        return res.status(statusCode).json({
            message,
        });
    }
};

const testPdfSummary = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "A PDF file is required",
            });
        }

        const summary = await summarizePdf(
            req.file.buffer
        );

        return res.status(200).json({
            message:
                "PDF summarized successfully",
            fileName: req.file.originalname,
            summary,
            disclaimer:
                "AI-generated summary. Verify all details against the original document.",
        });
    } catch (error) {
        console.error(
            "Gemini PDF test error:",
            error
        );

        if (
            error.message ===
            "Only PDF files are allowed"
        ) {
            return res.status(400).json({
                message: error.message,
            });
        }

        if (error.status === 429) {
            return res.status(429).json({
                message:
                    "Gemini rate limit reached. Please try again later.",
            });
        }

        return res.status(500).json({
            message:
                "Unable to summarize the PDF",
        });
    }
};

export {
    testGemini,
    testPdfSummary
};