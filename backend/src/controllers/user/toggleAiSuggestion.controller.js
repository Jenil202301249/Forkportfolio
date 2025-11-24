import { toggleAiSuggestion } from "../../db/toggleAiSuggestion.js";
import { addActivityHistory } from "../../mongoModels/user.model.js";

const toggleAiSuggestionController = async (req, res) => {
    try {
        const email = req?.user?.email;
        if(!email) return res.status(401).json({ success: false, message: "Email expected" });
        const result = await toggleAiSuggestion(email);
        if (!result) {
            return res
                .status(503)
                .json({ success: false, message: "Database error while toggling ai suggestion" });
        }
        if (result.length == 0) {
            return res
                .status(410)
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
            .json({ success: true, message: "ai suggestion toggled,current value: " + req.user.aisuggestion });
    } catch (error) {
        console.error("toggle ai suggestion error", error);
        return res.status(500).json({ success: false, message: "Failed to toggle ai suggestion, please try again" });
    }
};

export { toggleAiSuggestionController };
