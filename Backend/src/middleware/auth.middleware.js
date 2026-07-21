import jwt from "jsonwebtoken";
import User from "../models/User.js";

const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if(!token){
            return res.status(401).json({
                message: "Unauthorized",
            }); 
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password -verificationToken -resetPasswordToken -resetPasswordExpires");
        
        if(!user){
            return res.status(401).json({
                message: "User not found"
            });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}

export default verifyJWT;