import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
export const getHistoricData = async (symbol, period1, period2, interval) => {
  try {
    const queryOptions = { period1, period2, interval };
    const result = await yahooFinance.historical(symbol, queryOptions);
    return result.map((data) => ({
      date: data.date,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
    }));
  } catch (error) {
    console.log("Error fetching historic data:", error);
    return null;
  }
};