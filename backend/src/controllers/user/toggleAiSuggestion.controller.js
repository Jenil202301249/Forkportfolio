import { toggleAiSuggestion } from "../../db/toggleAiSuggestion.js";
import { addActivityHistory } from "../../mongoModels/user.model.js";

const toggleAiSuggestionController = async (req, res) => {
    try {
        const result = toggleAiSuggestion(req.user.email);
        if (!result) {
            return res
                .status(500)
                .json({ success: false, message: "Database error" });
        }
        if (result.length == 0) {
            return res
                .status(400)
                .json({ success: false, message: "User not found" });
        }
        req.user.aisuggestion = !req.user.aisuggestion;

        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: "aisuggestion",
            message: "Toggled ai suggestion",
            token: req.cookies.token,
        };

        await addActivityHistory(req.user.email, newActivity);

        return res
            .status(200)
            .json({ success: true, message: "ai suggestion toggled" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export { toggleAiSuggestionController };
