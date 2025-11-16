import { getAllActivityHistory } from "../../mongoModels/user.model.js";

const getAllActivityHistoryController = async (req, res) => {
    try {
        const email = req.user.email;
        const history = await getAllActivityHistory(email);

        for (let i = 0; i < history.length; i++) {
            history[i].token = undefined;
            history[i].updatedAt = undefined;
        }

        return res.status(200).json({ success: true, history: history });
    } catch (error) {
        console.error("get all activity history error",error);
        return res.status(500).json({ success: false, message: "Failed to fetch activity history, please try again" });
    }
};

export { getAllActivityHistoryController };
