import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
        file.mimetype !== "application/pdf" ||
        extension !== ".pdf"
    ) {
        return callback(
            new Error("Only PDF files are allowed")
        );
    }

    callback(null, true);
};

const aiPdfUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter,
});

export default aiPdfUpload;