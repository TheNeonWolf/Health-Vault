import express from "express";

import {
    addCareTask,
    getResidentCareTasks,
    updateCareTask,
    toggleCareTask,
    deleteCareTask,
} from "../controllers/careTask.controllers.js";

import verifyJWT from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);


router.post("/", addCareTask);
router.get("/resident/:residentId", getResidentCareTasks);
router.put("/:taskId", updateCareTask);
router.patch("/:taskId/toggle", toggleCareTask);
router.delete("/:taskId", deleteCareTask);

export default router;