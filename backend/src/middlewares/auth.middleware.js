import { searchUserByEmail } from "../db/findUser.js";
import jwt from "jsonwebtoken";
import { getActiveSessionByToken } from "../db/getActiveSession.js";
import { updateActiveTime } from "../db/updateActiveTime.js";

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized request" });
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

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await searchUserByEmail(decodedToken.email);

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

        await updateActiveTime(token);

        req.user = {
            id: user[0].id,
            name: user[0].name,
            email: user[0].email,
            registrationmethod: user[0].registrationmethod,
            profileimage: user[0].profileimage,
            investmentexperience: user[0].investmentexperience,
            riskprofile: user[0].riskprofile,
            theme: user[0].theme,
            aisuggestion: user[0].aisuggestion,
            financialgoals: user[0].financialgoals,
            investmenthorizon: user[0].investmenthorizon,
            dashboardlayout: user[0].dashboardlayout,
        };

        req.activeSession = {
            browserType: activeSession[0].browser_type,
            osType: activeSession[0].os_type,
        };

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({ success: false, message: "Token expired" });
        }
        console.error("auth middleware error:",error);
        return res.status(401).json({ success: false, message: "error verifying token" });
    }
};

export { verifyToken };
