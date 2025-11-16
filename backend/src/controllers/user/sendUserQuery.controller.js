import { addActivityHistory } from "../../mongoModels/user.model.js";
import { UserQuery } from "../../mongoModels/userQuery.model.js";
import mongoose from "mongoose";

const sendUserQuery = async (req, res) => {
    try {
        const email = req.user.email;
        const { query } = req.body;
        if (!query || query.trim().length < 1)
            return res.status(400).json({
                success: false,
                message: "query required",
            });

        if(query.length>1000){
            return res.status(422).json({
                success: false,
                message: "query should be less than 1000 characters",
            });
        }

        await UserQuery.create({ email, query });

        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: "query",
            message: "Submitted a query",
            token: req.cookies.token,
        };

        await addActivityHistory(email, newActivity);

        return res
            .status(200)
            .json({ success: true, message: "Query sent successfully" });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError)
            return res.status(400).json({
                success: false,
                message: "Email and query are required",
            });

        if (error.code === 11000)
            return res.status(409).json({
                success: false,
                message: "You have already submitted this query before.",
            });
        console.error("send user query error",error);
        return res
            .status(500)
            .json({ success: false, message: "failed to send query, please try again" });
    }
};

export { sendUserQuery };
