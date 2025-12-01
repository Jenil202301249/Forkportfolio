import  app  from "../../utils/agent.js";

// -------------------------------------------------sendMessage controller----------------------------------------
export const sendMessage = async (req, res) => {
    try{
        const userDetails = {
            emailId: req.user?.email,
            name: req.user?.name || "User",
            profileImage: req.user?.profileimage,
            riskProfile: req.user?.riskprofile,
            investmentExperience: req.user?.investmentexperience,
            themePreferences: req.user?.theme,
            aiSuggestionsEnabled: req.user?.aisuggestion,
            financialGoals: req.user?.financialgoals,
            investmentHorizon: req.user?.investmenthorizon,
        }
        const {message} = req.body;
        if(!message) return res.status(400).json({error : "message is required"});
        const result = await app.invoke({
            messages : [{ role: "user", content: message.text,additional_kwargs: { userDetails: userDetails ,screenWidth: message.screenWidth} }]
        },{
            configurable : {
                thread_id : userDetails.emailId,
                userDetails: userDetails, 
            }
        });
        let reply = result.messages.at(-1)?.content;
        // console.log("Agent Reply:", reply);
        return res.status(200).json({reply});
    } catch (err) {
        console.log("Agent Error:", err);
        return res.status(500).json({ error: "Internal Server Error", details: err.message });
    }

}
