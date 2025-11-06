import { addActivityHistory } from "../../mongoModels/user.model.js";
import { UserSuggestion } from "../../mongoModels/userSuggestion.model.js";
import mongoose from "mongoose";

const sendUserSuggestion = async (req, res) => {
    try {
        const email = req.user.email;
        const { suggestion } = req.body;
        if (!suggestion || suggestion.trim().length < 1)
            return res.status(400).json({
                success: false,
                message: "suggestion required",
            });

        await UserSuggestion.create({ email, suggestion });

        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: "suggestion",
            message: "Submitted a suggestion",
            token: req.cookies.token,
        };

        await addActivityHistory(email, newActivity);

        return res
            .status(200)
            .json({ success: true, message: "suggestion sent successfully" });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError)
            return res.status(400).json({
                success: false,
                message: "Email and suggestion are required",
            });

        if (error.code === 11000)
            return res.status(409).json({
                success: false,
                message: "You have already submitted this suggestion before.",
            });
        console.log(error);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
};

export { sendUserSuggestion };
