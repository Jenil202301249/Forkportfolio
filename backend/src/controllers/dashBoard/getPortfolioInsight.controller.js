import {Portfolio_analysis_tool} from "../../utils/chatBotTools/portfolio_analysis.js";

/*----------------------------------------portfolio analysis invoke function--------------------------- */

export const getPortfolioInsight = async (req,res) => {
    try{
        console.log("getPortfolioInsight called for user:", req.user?.email);
        const context = {
            configurable: {
                thread_id: req.user?.email,
                userDetails: {
                    emailId: req.user?.email,
                    name: req.user?.name || "User",
                    financialGoals: req.user?.financialGoals || "not specified",
                    investmentHorizon: req.user?.investmentHorizon || "not specified",
                    investmentExperience: req.user?.investmentExperience || "not specified"
                }
            }
        };
        
        const result = await Portfolio_analysis_tool.invoke({}, context);
        // console.log("Portfolio Insight Result:", result);
        return res.status(200).json({reply: result});
    }
    catch(err){
        console.error("Error in portfolioAnalysisInvoke:", err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
}