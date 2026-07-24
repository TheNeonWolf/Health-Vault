import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import crypto from "crypto";
import sendEmail from '../utils/sendEmail.js';
import fs from "fs";
import Resident from "../models/Resident.js";
import Medication from "../models/Medication.js";
import MedicalRecords from "../models/MedicalRecords.js";

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser){
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");

        let user;

        const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify-email/${verificationToken}`;

        try {
            user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                verificationToken,
            });

            await sendEmail(
                normalizedEmail,
                "Verify your Health Vault account!",
                `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #222;">
                        <h2 style="color: #2563eb;">Welcome to Health Vault</h2>
            
                        <p>Thanks for signing up! Please verify your email to activate your account.</p>
            
                        <a href="${verificationLink}"
                            style="
                            display: inline-block;
                            background-color: #2563eb;
                            color: white;
                            padding: 12px 18px;
                            text-decoration: none;
                            border-radius: 8px;
                            margin-top: 10px;
                        ">
                            Verify Email
                        </a>
            
                        <p style="margin-top: 20px; font-size: 14px; color: #666;">
                            If the button does not work, copy and paste this link:
                        </p>
            
                        <p style="font-size: 12px; color: #555;">
                            ${verificationLink}
                        </p>
                    </div>
                `
            );
        } catch (error) {
            if (user?._id) {
                await User.findByIdAndDelete(user._id);
            }

            throw error;
        }

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
        };

        res.status(201).json({
            message: "User registered successfully! Please check your email to verify your account.",
            user: userResponse
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            verificationToken: token
        });

        if (!user) {
            return res.redirect(
                `${process.env.FRONTEND_URL}/login.html?verified=false`
            );
        }

        user.isVerified = true;
        user.verificationToken = undefined;

        await user.save();

        return res.redirect(
            `${process.env.FRONTEND_URL}/login.html?verified=true`
        );
    } catch (error) {
        return res.redirect(
            `${process.env.FRONTEND_URL}/login.html?verified=false`
        );
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail,
        }).select("+password");

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        if (!user.isVerified){
            return res.status(403).json({
                message: "Please verify your email before logging in"
            });
        }

        const token = generateToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const logoutUser = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    res.status(200).json({
        message: "Logged out successfully",
    });
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email?.trim()) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user){
            return res.status(404).json({
                message: "User not found"
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 60*60*1000;

        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

        await sendEmail(
            normalizedEmail,
            "Reset your Health Vault password",
            `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #222;">
                <h2 style="color: #dc2626;">Reset Your Password</h2>

                <p>You requested to reset your Health Vault password.</p>
                <p>Click the button below to choose a new password:</p>

                <a href="${resetLink}"
                   style="
                      display: inline-block;
                      background-color: #dc2626;
                      color: white;
                      padding: 12px 18px;
                      text-decoration: none;
                      border-radius: 8px;
                      margin-top: 10px;
                   ">
                    Reset Password
                </a>

                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                    This link will expire in 1 hour.
                </p>
            </div>
            `
        );

        res.status(200).json({
            message: "Password reset email has been sent"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({
                message: "Password is required and must be at least 8 characters long"
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        }).select("+resetPasswordToken +resetPasswordExpires");

        if(!user){
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({
            message: "Password has been reset successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const updateProfileName = async (req, res) => {
    try {
        const name = req.body.name?.trim();

        if (!name) {
            return res.status(400).json({
                message: "Name is required",
            });
        }

        if (name.length < 2) {
            return res.status(400).json({
                message: "Name must be at least 2 characters long",
            });
        }

        if (name.length > 100) {
            return res.status(400).json({
                message: "Name must not exceed 100 characters",
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        user.name = name;

        await user.save();

        return res.status(200).json({
            message: "Profile name updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword,
        } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message:
                    "Current password and new password are required",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message:
                    "New password must be at least 8 characters long",
            });
        }

        const user = await User.findById(
            req.user._id
        ).select("+password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const currentPasswordMatches =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!currentPasswordMatches) {
            return res.status(400).json({
                message: "Current password is incorrect",
            });
        }

        const sameAsCurrentPassword =
            await bcrypt.compare(
                newPassword,
                user.password
            );

        if (sameAsCurrentPassword) {
            return res.status(400).json({
                message:
                    "New password must be different from the current password",
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        user.password = hashedPassword;

        /*
         * Invalidate any active password-reset link.
         */
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "Password changed successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                message:
                    "Password is required to delete your account",
            });
        }

        const user = await User.findById(
            req.user._id
        ).select("+password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatches) {
            return res.status(400).json({
                message: "Incorrect password",
            });
        }

        /*
         * Read the medical records first so their uploaded
         * files can be removed from the uploads directory.
         */
        const records =
            await MedicalRecords.find({
                createdBy: user._id,
            });

        for (const record of records) {
            if (
                record.filePath &&
                fs.existsSync(record.filePath)
            ) {
                try {
                    fs.unlinkSync(record.filePath);
                } catch (fileError) {
                    console.error(
                        "Unable to delete uploaded file:",
                        record.filePath,
                        fileError
                    );
                }
            }
        }

        /*
         * Delete dependent account data.
         */
        await MedicalRecords.deleteMany({
            createdBy: user._id,
        });

        await Medication.deleteMany({
            createdBy: user._id,
        });

        await Resident.deleteMany({
            createdBy: user._id,
        });

        await User.findByIdAndDelete(
            user._id
        );

        res.clearCookie("token", {
            httpOnly: true,
            secure:
                process.env.NODE_ENV ===
                "production",
            sameSite: "lax",
        });

        return res.status(200).json({
            message: "Account deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export {
    registerUser,
    verifyEmail,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    updateProfileName,
    changePassword,
    deleteAccount
};