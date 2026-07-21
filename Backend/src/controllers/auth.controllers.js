import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import crypto from "crypto";
import sendEmail from '../utils/sendEmail.js';

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
            sameSite: "strict",
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
        sameSite: "strict"
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

export {
    registerUser,
    verifyEmail,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword
};