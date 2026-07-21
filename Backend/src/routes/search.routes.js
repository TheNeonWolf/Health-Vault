import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";

import {
    globalSearch,
} from "../controllers/search.controllers.js";

const router = express.Router();

router.get("/", verifyJWT, globalSearch);

export default router;