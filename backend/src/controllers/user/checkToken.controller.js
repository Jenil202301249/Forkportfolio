import { searchUserByEmail } from "../../db/findUser.js";
import jwt from "jsonwebtoken";
import { getActiveSessionByToken } from "../../db/getActiveSession.js";
const checkToken = async (req, res) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res
                .status(401)
                .json({ success: false, message: "token is not present" });
        }
        const activeSession = await getActiveSessionByToken(token);
        if (!activeSession) {
            return res
                .status(503)
                .json({
                    success: false,
                    message: "Database error while verifying token",
                });
        }
        if (activeSession.length == 0) {
            return res
                .clearCookie("token", {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
                })
                .status(401)
                .json({ success: false, message: "unauthorized request" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await searchUserByEmail(decoded.email);
        if (!user) {
            return res
                .status(503)
                .json({
                    success: false,
                    message: "Database error while verifying token",
                });
        }
        if (user.length == 0) {
            return res
                .clearCookie("token", {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
                })
                .status(410)
                .json({ success: false, message: "invalid token" });
        }
        
        return res.status(200).json({success: true,message:"already logged in"})
    } catch (error) {
        console.error('Check token error:', error);
        return res.status(500).json({ success: false, message: "failed to check token, please try again" });
    }
};

export { checkToken };
