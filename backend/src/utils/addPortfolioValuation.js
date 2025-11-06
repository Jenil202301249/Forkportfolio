import { stockPriceStore } from './stockPriceStore.js';
import { getPrice } from './getQuotes.js';
import { UserPortfolioValuationdaily, UserPortfolioValuationHourly } from '../mongoModels/userPortfolioValuation.model.js';
import { sql } from '../db/dbConnection.js';

export const calculatePortfolioValuation = async (email,datas) => {
    try {
        let totalValuation = 0;
        for (const data of datas) {
            if (!stockPriceStore.get(data.symbol)) {
                const priceData = await getPrice(data.symbol);  
                if (priceData && priceData.current) {
                    stockPriceStore.add(data.symbol, {...priceData,expiresAt: Date.now() + 60 * 1000});
                } else {
                    console.log(`Failed to fetch price for symbol: ${data.symbol}`);
                    continue;
                }
            }
            const priceData = stockPriceStore.get(data.symbol);
            if (!priceData) {
                console.log(`No price data available for symbol: ${data.symbol}`);
                continue;
            }
            totalValuation += data.quantity * priceData.current;
        }
        const today = new Date().setHours(0, 0, 0, 0);
        const hour = new Date()
        hour.setMinutes(0,0,0);
        await UserPortfolioValuationdaily.updateOne(
        { email, date: today },
        { $set: { portfolioValuation: totalValuation.toFixed(2) } },
        { upsert: true,new: true }
        );
        await UserPortfolioValuationHourly.updateOne(
        { email, timestamp: hour },
        { $set: { portfolioValuation: totalValuation.toFixed(2) } },
        { upsert: true,new: true }
        );
        return true;
    }catch(error){
        console.log("calculate error: ",error);
        return false;
    }
}

export const updateAllUsers = async () => {
    console.log("updating users.")
    try{
        const data = await sql`SELECT * FROM "stock_summary"`
        if(!data){
            console.log("Unable to fetch data");
            return false;
        }
        if(data.length===0){
            return true;
        }
        const userHoldings = {};
        for (const row of data) {
        if (!userHoldings[row.email]) userHoldings[row.email] = [];
        userHoldings[row.email].push({ symbol: row.symbol, quantity: Number(row.current_holding)});
        }
        await Promise.all(
        Object.entries(userHoldings).map(([email, holdings]) =>
            calculatePortfolioValuation(email, holdings)
        )
        );
    }catch(error){
        console.log("error in adding stock data",error);
        return false;
    }
}