function mapStockData(rawStock) {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };
  rawStock = rawStock.price;
  return {
    // Basic Info
    symbol: rawStock.symbol ?? 'N/A',
    name: rawStock.shortName ?? 'N/A',
    longName: rawStock.longName ?? 'N/A',
    exchange: rawStock.exchange ?? 'N/A',
    quoteType: rawStock.quoteType ?? 'N/A',
    currency: rawStock.currency ?? 'N/A',

    // Market Data
    price: rawStock.regularMarketPrice?.toFixed(2) ?? 'N/A',
    change: rawStock.regularMarketChange?.toFixed(2) ?? 'N/A',
    changePercent: rawStock.regularMarketChangePercent?.toFixed(2) ?? 'N/A',
    dayHigh: rawStock.regularMarketDayHigh?.toFixed(2) ?? 'N/A',
    dayLow: rawStock.regularMarketDayLow?.toFixed(2) ?? 'N/A',
    previousClose: rawStock.regularMarketPreviousClose?.toFixed(2) ?? 'N/A',
    open: rawStock.regularMarketOpen?.toFixed(2) ?? 'N/A',
    
    // Volume & Market Cap
    volume: rawStock.regularMarketVolume?.toLocaleString('en-IN') ?? 'N/A',
    marketCap: rawStock.marketCap?.toLocaleString('en-IN') ?? 'N/A',
    sharesOutstanding: rawStock.sharesOutstanding?.toLocaleString('en-IN') ?? 'N/A',

    // 52-Week Range
    fiftyTwoWeekHigh: rawStock.fiftyTwoWeekHigh?.toFixed(2) ?? 'N/A',
    fiftyTwoWeekLow: rawStock.fiftyTwoWeekLow?.toFixed(2) ?? 'N/A',
    fiftyTwoWeekRange: `${rawStock.fiftyTwoWeekRange?.low?.toFixed(2) ?? '?'} - ${rawStock.fiftyTwoWeekRange?.high?.toFixed(2) ?? '?'}`,
    
    // Averages
    fiftyDayAverage: rawStock.fiftyDayAverage?.toFixed(2) ?? 'N/A',
    twoHundredDayAverage: rawStock.twoHundredDayAverage?.toFixed(2) ?? 'N/A',
    
    // Timestamps
    marketTime: formatTimestamp(rawStock.regularMarketTime),
    earningsTimestamp: formatTimestamp(rawStock.earningsTimestamp),

    // Financial Ratios
    trailingPE: rawStock.trailingPE?.toFixed(2) ?? 'N/A',
    forwardPE: rawStock.forwardPE?.toFixed(2) ?? 'N/A',
    epsTrailingTwelveMonths: rawStock.epsTrailingTwelveMonths?.toFixed(2) ?? 'N/A',
    priceToBook: rawStock.priceToBook?.toFixed(2) ?? 'N/A',
    bookValue: rawStock.bookValue?.toFixed(2) ?? 'N/A',
    
    // Dividends
    dividendYield: rawStock.dividendYield?.toFixed(2) ?? 'N/A',
    dividendRate: rawStock.dividendRate?.toFixed(2) ?? 'N/A',
    
    // Other
    averageAnalystRating: rawStock.averageAnalystRating ?? 'N/A',
    marketState: rawStock.marketState ?? 'N/A',
  };
}
export { mapStockData };
export const starterStocks = ["^NSEBANK","^NSEI","^BSESN"];