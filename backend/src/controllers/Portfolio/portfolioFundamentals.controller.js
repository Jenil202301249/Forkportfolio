import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance()
import { getStockSummary } from "../../db/stockSummary.js";

function formatNumber(num) {
  if (!num && num !== 0) return "--";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  return num.toFixed ? num.toFixed(2) : num;
}

export const getPortfolioFundamentals = async (req, res) => {
  try {
    const {email} = req.user;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const portfolio = await getStockSummary(email); 
    if (!portfolio || portfolio.length === 0) {
      return res.status(404).json({ success: false, message: "No holdings found" });
    }

    const symbols = portfolio.map(stock => stock.symbol);

    const results = await Promise.allSettled(
      symbols.map(symbol =>
        yahooFinance.quoteSummary(symbol, {
          modules: ["price", "summaryDetail", "defaultKeyStatistics", "calendarEvents"]
        })
      )
    );

    const data = results.map((res, i) => {
      const symbol = symbols[i];
      if (res.status !== "fulfilled") {
        console.warn(`⚠️ Failed to fetch ${symbol}`, res.reason?.message);
        return {
          symbol,
          error: "Data not available"
        };
      }

      const result = res.value;
      const price = result.price || {};
      const summary = result.summaryDetail || {};
      const stats = result.defaultKeyStatistics || {};
      const calendar = result.calendarEvents || {};

      return {
        symbol: price.symbol || symbol,
        lastPrice: formatNumber(price.regularMarketPrice),
        marketCap: formatNumber(price.marketCap),
        avgVolume3M: formatNumber(summary.averageVolume3Month),
        epsEstimateNextYear: stats.forwardEps ?? "--",
        forwardPE: stats.forwardPE ?? "--",
        divPaymentDate: calendar.dividendDate ?? "--",
        exDivDate: summary.exDividendDate ?? "--",
        dividendPerShare: summary.dividendRate ?? "--",
        forwardAnnualDivRate: summary.dividendRate ?? "--",
        forwardAnnualDivYield: summary.dividendYield ? (summary.dividendYield * 100).toFixed(2) + "%" : "--",
        trailingAnnualDivRate: summary.trailingAnnualDividendRate ?? "--",
        trailingAnnualDivYield: summary.trailingAnnualDividendYield ? (summary.trailingAnnualDividendYield * 100).toFixed(2) + "%" : "--",
        priceToBook: stats.priceToBook ?? "--",
        currentHolding: portfolio.find(p => p.symbol === symbol)?.current_holding ?? 0
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Error fetching portfolio financial details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio financial details"
    });
  }
};
