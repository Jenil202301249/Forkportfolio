import { getStockSummary } from "../../db/stockSummary.js";
import { getPrice } from "../../utils/getQuotes.js";
import { stockPriceStore } from "../../utils/stockPriceStore.js";
import { UserPortfolioValuationdaily,UserPortfolioValuationHourly } from "../../mongoModels/userPortfolioValuation.model.js";
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
        
        if (!stockSummary || stockSummary.length === 0) {
            return res.status(404).json({ success: false, message: "No stock summary found for the user." });
        }
        
        const priceData = stockPriceStore; 
        let totalValuation = 0;
        let overallPL = 0;
        let todayPL = 0;
        let totalspending = 0;
        
        for (const row of stockSummary) {
            let {symbol, current_holding, spended_amount, yestarday_holding } = row;
            spended_amount = Number(spended_amount)
            let data = priceData.get(symbol); 
            
            if(!data){
                const q = await getPrice(symbol);
                
                if (!q) {
                    return res.status(500).json({ success: false, message: "Failed to fetch stock prices." });
                }
                
                console.log(q);
                
                const newPriceData = {...q,expiresAt: Date.now() + 60 * 1000};
                priceData.add(symbol, newPriceData);
                data = newPriceData; 
            }
            if (!data || data.current === undefined || data.close === undefined) continue;
            const currentValue = current_holding * data.current;
            const yesterdayValue = yestarday_holding * data.close;
            const overallProfit = currentValue - spended_amount;
            const todayProfit = currentValue - yesterdayValue;
            
            
            totalspending += spended_amount;
            totalValuation += currentValue;
            overallPL += overallProfit;
            todayPL += todayProfit;
        }
        const today = new Date().setHours(0, 0, 0, 0);
        const hour = new Date()
        hour.setMinutes(0,0,0);
        await UserPortfolioValuationdaily.updateOne(
            { email, date: today },
            { $set: { portfolioValuation: totalValuation.toFixed(2) } },
            { upsert: true }
        );
        await UserPortfolioValuationHourly.updateOne(
            { email, timestamp: hour },
            { $set: { portfolioValuation: totalValuation.toFixed(2) } },
            { upsert: true }
        );
        
        console.log({totalValuation, overallPL, todayPL, totalspending});
        
        const todayPLPercentage = safeDivision(todayPL, totalValuation);
        const overallPLPercentage = safeDivision(overallPL, totalspending);

        return res.status(200).json({
            success: true,
            totalValuation: totalValuation.toFixed(2), 
            overallProfitLoss: overallPL.toFixed(2),
            todayProfitLoss: todayPL.toFixed(2), 
            todayProfitLosspercentage: todayPLPercentage,
            overallProfitLosspercentage: overallPLPercentage
        });

    } catch (error) {
        console.log('Portfolio calculation error:', error);
        return res.status(500).json({ success: false, message: "An error occurred while calculating the portfolio." });
    }
};
