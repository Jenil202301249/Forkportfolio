import { getStockSummary } from "../../db/stockSummary.js";
import { getPrice } from "../../utils/getQuotes.js";
import { UserPortfolioValuationdaily } from "../../mongoModels/userPortfolioValuation.model.js";
const safeDivision = (numerator, denominator) => {
    if (!denominator || denominator === 0) {
        return "0.00";
    }
    return ((numerator / denominator) * 100).toFixed(2);
};

export const calculatePortfolio = async (req, res) => {
    const { email } = req.user;
    try {
        const stockSummary = await getStockSummary(email);
        
        if (!stockSummary) {
            return res.status(503).json({ success: false, message: "Database Error in getting stock summary." });
        }
        if( stockSummary.length === 0 ){
            return res.status(200).json({
                success: true,
                totalValuation: 0, 
                overallProfitLoss: 0,
                todayProfitLoss: 0, 
                todayProfitLosspercentage: 0,
                overallProfitLosspercentage: 0,
                totalInvestment: 0,
            });
        }
        let totalValuation = 0;
        let overallPL = 0;
        let todayPL = 0;
        let totalspending = 0;
        let totalInvestment = 0;
        for (const row of stockSummary) {
            let {symbol, current_holding, spended_amount,avg_price } = row;
            spended_amount = Number(spended_amount);
            current_holding = Number(current_holding);
            avg_price = Number(avg_price);
            let data = await getPrice(symbol);
            
            if(!data){
                return res.status(504).json({success:true,message: "Failed to get stock data"});
            }
            if (data.current === undefined || data.close === undefined) continue;
            const currentValue = current_holding * data.current;
            const yesterdayValue = current_holding * data.close;
            const overallProfit = currentValue - spended_amount;
            const todayProfit = currentValue - yesterdayValue;
            const currentInvested = current_holding * avg_price;
            
            
            totalspending += spended_amount;
            totalValuation += currentValue;
            overallPL += overallProfit;
            todayPL += todayProfit;
            totalInvestment += currentInvested;
        }
        const today = new Date().setHours(0, 0, 0, 0);
        
        await UserPortfolioValuationdaily.updateOne(
            { email, date: today },
            { $set: { portfolioValuation: totalValuation.toFixed(2) } },
            { upsert: true }
        );
        
        
        
        const todayPLPercentage = safeDivision(todayPL, totalValuation);
        const overallPLPercentage = safeDivision(overallPL, totalspending);

        return res.status(200).json({
            success: true,
            totalValuation: totalValuation.toFixed(2), 
            overallProfitLoss: overallPL.toFixed(2),
            todayProfitLoss: todayPL.toFixed(2), 
            todayProfitLosspercentage: todayPLPercentage,
            overallProfitLosspercentage: overallPLPercentage,
            totalInvestment: totalInvestment.toFixed(2),
        });

    } catch (error) {
        console.error('Portfolio calculation error:', error);
        return res.status(500).json({ success: false, message: "An error occurred while calculating the portfolio." });
    }
};
