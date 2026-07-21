import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";

import {
    addResident,
    getResidents,
    deleteResident,
    getResident,
    updateResident,
} from "../controllers/resident.controllers.js";

const router = express.Router();

router.post("/", verifyJWT, addResident);
router.get("/", verifyJWT, getResidents);
router.delete("/:id", verifyJWT, deleteResident);
router.get("/:id", verifyJWT, getResident);
router.put("/:id", verifyJWT, updateResident);

export default router;