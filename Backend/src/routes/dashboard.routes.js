import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";

import {
    getDashboardSummary,
} from "../controllers/dashboard.controllers.js";

const router = express.Router();

router.get("/", verifyJWT, getDashboardSummary);

export default router;