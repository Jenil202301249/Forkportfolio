import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import { starterStocks } from "../../utils/requiredMap.js";
import { stockPriceStore } from '../../utils/stockPriceStore.js';

export const starter = async(req,res)=>{
    try{
        let starter = stockPriceStore.get("starter");
        if(starter){
            return res.status(200).json({success:true,data:starter});
        }
        let result = [];
        for(const symbol of starterStocks){
            result.push(await yahooFinance.quoteSummary(symbol, { modules: ["price"] }))
        }
        result = result.map(stock=>{
            return {
                Symbol: stock.price.symbol,
                name: stock.price.longName,
                exchange: stock.price.exchange,
                currency: stock.price.currency,
                price: stock.price.regularMarketPrice?.toFixed(2) ?? 'N/A',
                change: stock.price.regularMarketChange?.toFixed(2) ?? 'N/A',
                changePercent: stock.price.regularMarketChangePercent?.toFixed(2) ?? 'N/A',
            }
        });
        stockPriceStore.add("starter",result);
        return res.status(200).json({success:true,data:result});
    }catch(error){
        console.log('Starter stocks fetch error:',error);
        return res.status(500).json({success:false,message:"Internal server error"})
    }
}