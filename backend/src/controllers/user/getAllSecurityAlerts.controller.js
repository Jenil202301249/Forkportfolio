import { getAllSecurityAlerts } from "../../mongoModels/user.model.js";

const getAllSecurityAlertsController = async (req, res) => {
    try {
        const email = req?.user?.email;
        const alerts = await getAllSecurityAlerts(email);

        for (let i = 0; i < alerts.length; i++) {
            alerts[i].token = undefined;
            alerts[i].updatedAt = undefined;
        }

        return res.status(200).json({ success: true, alerts: alerts });
    } catch (error) {
        console.error("get all security alerts error",error);
        return res.status(500).json({ success: false, message: "Failed to fetch security alerts, please try again" });
    }
};

export { getAllSecurityAlertsController };
