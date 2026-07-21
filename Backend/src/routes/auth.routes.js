import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import {
    registerUser,
    loginUser,
    logoutUser,
    verifyEmail,
    forgotPassword,
    resetPassword
} from "../controllers/auth.controllers.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", verifyJWT, (req, res) => {
    res.status(200).json(req.user);
});

export default router;