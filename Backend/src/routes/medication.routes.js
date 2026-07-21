import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";

import {
    addMedication,
    getResidentMedications,
    getMedication,
    updateMedication,
    deleteMedication,
} from "../controllers/medication.controllers.js";

const router = express.Router();

router.post("/", verifyJWT, addMedication);

router.get(
    "/resident/:residentId",
    verifyJWT,
    getResidentMedications
);

router.get(
    "/:medicationId",
    verifyJWT,
    getMedication
);

router.put(
    "/:medicationId",
    verifyJWT,
    updateMedication
);

router.delete(
    "/:medicationId",
    verifyJWT,
    deleteMedication
);

export default router;