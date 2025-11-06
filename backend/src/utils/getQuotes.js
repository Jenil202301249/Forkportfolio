import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
export const getPrice = async (symbols) => {
    let attempt = 0;
    while (attempt < 3) {
        try {
            const result = await yahooFinance.quoteSummary(symbols, {modules: ["price"],});
            return {
                symbol: result.price.symbol ?? null,
                current: result.price.regularMarketPrice ?? 0,
                currency: result.price.currency ?? null,
                close: result.price.regularMarketPreviousClose ?? 0,
                percentageChange:result.price.regularMarketChangePercent ?? 0,
                shortname: result.price.shortName ?? null,
                longname: result.price.longName ?? null,
                change: result.regularMarketChange?? 0,
            };
        } catch (error) {
            attempt++;
            if (attempt === 3) {
                console.log("Error fetching quotes:", error);
                return null;
            }
        }
    }
};
