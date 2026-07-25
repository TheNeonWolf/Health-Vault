import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/auth.routes.js";
import residentRoutes from "./src/routes/resident.routes.js";
import recordRoutes from "./src/routes/record.routes.js";
import medicationRoutes from "./src/routes/medication.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import searchRoutes from "./src/routes/search.routes.js";
import careTaskRoutes from "./src/routes/careTask.routes.js";

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({
        message:
            "HealthVault Backend Running 🚀",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/records", recordRoutes);
app.use(
    "/api/medications",
    medicationRoutes
);
app.use(
    "/api/dashboard",
    dashboardRoutes
);
app.use("/api/search", searchRoutes);
app.use(
    "/api/care-tasks",
    careTaskRoutes
);

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
    });
});

const PORT =
    process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(
                `Server running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Failed to start server:",
            error
        );

        process.exit(1);
    }
};

startServer();