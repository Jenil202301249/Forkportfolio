import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance()
import { getStockSummary } from "../../db/stockSummary.js";
import { PriceStore } from "../../utils/stores/priceRates.js";
function formatNumber(num) {
  if (!num && num !== 0) return "--";
  if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  return num.toFixed(2);
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

    const symbols = portfolio.filter(item => item.current_holding > 0).map(stock => stock.symbol);

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
        console.warn(`Failed to fetch ${symbol}`, res.reason?.message);
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
      const currencyChange = PriceStore.get(price.currency) || 1;
      return {
        symbol: price.symbol || symbol,
        lastPrice: (price.regularMarketPrice != null) ? formatNumber(price.regularMarketPrice / currencyChange) : "--",
        marketCap: price.marketCap ? price.marketCap.toFixed(2) : "--",
        avgVolume3M: formatNumber(summary.averageVolume3Month),
        epsEstimateNextYear: stats.forwardEps ? stats.forwardEps.toFixed(2) : "--",
        forwardPE: stats.forwardPE ? stats.forwardPE.toFixed(2) : "--",
        divPaymentDate: calendar.dividendDate ?? "--",
        exDivDate: summary.exDividendDate ?? "--",
        dividendPerShare: summary.dividendRate ?? "--",
        forwardAnnualDivRate: summary.dividendRate ? summary.dividendRate.toFixed(2) : "--",
        forwardAnnualDivYield: summary.dividendYield ? (summary.dividendYield * 100).toFixed(2) + "%" : "--",
        trailingAnnualDivRate: summary.trailingAnnualDividendRate ? summary.trailingAnnualDividendRate.toFixed(2) : "--",
        trailingAnnualDivYield: summary.trailingAnnualDividendYield ? (summary.trailingAnnualDividendYield * 100).toFixed(2) + "%" : "--",
        priceToBook: stats.priceToBook ? (stats.priceToBook / currencyChange).toFixed(2) : "--",
        currentHolding: portfolio.find(p => p.symbol === symbol).current_holding
      };
    });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Error fetching portfolio financial details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio financial details"
    });
  }
};
