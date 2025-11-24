import { deleteActiveSessionByToken } from "../../db/deleteActiveSession.js";
import { getAllActiveSessionOfUser } from "../../db/getActiveSession.js";
import {
    getRecentActivityHistory,
    getRecentSecurityAlerts,
} from "../../mongoModels/user.model.js";
import jwt from "jsonwebtoken";
const activityAndSessionHistory = async (req, res) => {
    try {
        const email = req.user.email;
        if(!email) return res.status(401).json({success:false,message:"expected mail"});
        const activeSessions = await getAllActiveSessionOfUser(email);
        if (!activeSessions) {
            return res
                .status(503)
                .json({
                    success: false,
                    message:
                        "Database error while getting active session count",
                });
        }
        
        for (let i = 0; i < activeSessions.length; i++) {
            try {
                jwt.verify(activeSessions[i].token, process.env.JWT_SECRET);
            } catch (error) {
                await deleteActiveSessionByToken(activeSessions[i].token);
                activeSessions.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < activeSessions.length; i++) {
            if (activeSessions[i].token === req.cookies.token) {
                const session = activeSessions.splice(i, 1)[0];
                activeSessions.unshift(session);
                break;
            }
        }

        const securityAlerts = await getRecentSecurityAlerts(email);

        for (let i = 0; i < securityAlerts.length; i++) {
            securityAlerts[i].token = undefined;
            securityAlerts[i].updatedAt = undefined;
        }

        const activityHistory = await getRecentActivityHistory(email);

        for (let i = 0; i < activityHistory.length; i++) {
            activityHistory[i].token = undefined;
            activityHistory[i].updatedAt = undefined;
        }

        return res
            .status(200)
            .json({
                success: true,
                activeSessions,
                securityAlerts,
                activityHistory,
            });
    } catch (error) {
        console.error("activityAndSessionHistory controller",error);
        return res.status(500).json({ success: false, message: "failed to get activity and session history. Please try again" });
    }
};

export { activityAndSessionHistory };
