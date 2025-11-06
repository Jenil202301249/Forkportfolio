import { getActivityHistoryByToken, getSecurityAlertsByToken } from "../../mongoModels/user.model.js";

const getActivityAndSessionByToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "token is required.",
            });
        }

        const activityHistory = await getActivityHistoryByToken(token);
        const securityAlerts = await getSecurityAlertsByToken(token);

        return res
            .status(200)
            .json({ success: true, activityHistory, securityAlerts });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export { getActivityAndSessionByToken };