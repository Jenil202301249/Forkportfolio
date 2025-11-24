import YahooFinance from "yahoo-finance2";
import { stockPriceStore } from "./stockPriceStore.js";
import { PriceStore } from "./stores/priceRates.js";
const yahooFinance = new YahooFinance();
export const getPrice = async (symbols) => {
    let attempt = 0;
    while (attempt < 3) {
        try {
            const prices = stockPriceStore.get(symbols);
            if(prices){
                const {expiresAt,...price} = prices; 
                return price;
            }
            const result = await yahooFinance.quoteSummary(symbols, {modules: ["price","assetProfile"],});
            const currencychange = PriceStore.get(result.price.currency) || 1;
            const price = {
                symbol: result.price.symbol ?? null,
                current: (result.price.regularMarketPrice/currencychange) || 0,
                currency: result.price.currency ?? null,
                close: (result.price.regularMarketPreviousClose/currencychange) || 0,
                percentageChange:result.price.regularMarketChangePercent ?? 0,
                shortname: result.price.shortName ?? null,
                longname: result.price.longName ?? null,
                change: (result.price.regularMarketChange/currencychange)|| 0,
                marketstate: result.price.marketState?? "unknown",
                marketcap: result.price.marketCap? result.price.marketCap.toFixed(2) : 0,
                sector: result.assetProfile?.sector ?? null,
            };
            stockPriceStore.add(symbols,{...price,expiresAt: Date.now()+60*1000});
            return price;
        } catch (error) {
            attempt++;
            if (attempt === 3) {
                console.log("Error fetching quotes:", error);
                return null;
            }
        }
    }
};
