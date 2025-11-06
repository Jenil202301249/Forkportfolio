import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import { mapStockData } from './requiredMap.js';
console.log(YahooFinance);
export const getData  = async (searchitem) => {
    const searchOptions = {
        enableFuzzyQuery: true,
        quotesCount: 10,
        newsCount: 5
    }
    try {
        const result = await yahooFinance.search(searchitem,searchOptions);
        //console.log(result)
        const [quotes, news] = await Promise.all([
            // Fetch detailed quote info
            Promise.all(
                result.quotes
                    .filter(item => item.symbol)
                    .map(item => 
                        yahooFinance.quoteSummary(item.symbol, { modules: ["price","summaryProfile","financialData"] })
                    )
            ),
            // Map news at the same time
            Promise.resolve(
                result.news.map((news) => ({
                    title: news.title,
                    link: news.link,
                    publisher: news.publisher,
                    providerPublishTime: news.providerPublishTime,
                    type: news.type,
                }))
            )
        ]);
        //console.log(quotes);
        const mappedQuotes = quotes.map(mapStockData);
        //console.log(mappedQuotes);
        return {quotes:mappedQuotes, news};
    } catch (error) {
        //console.log('Error fetching symbol data:', error);
        return null;
    }
};