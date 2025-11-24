import { getStockSummary } from "../../db/stockSummary.js";
import { getPrice } from "../../utils/getQuotes.js";


function formatNumber(num) {
  if (!num && num !== 0) return "--";
  return Number(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const getPortfolioHoldings = async (req, res) => {
  try {
    const email = req.user?.email || req.query.email;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    let portfolio = await getStockSummary(email);
    if (!portfolio || portfolio.length === 0) {
      return res.status(404).json({ success: false, message: "No holdings found" });
    }
    portfolio = portfolio.filter(item => item.current_holding > 0);
    const results = await Promise.allSettled(
      portfolio.map(stock =>
        getPrice(stock.symbol)
      )
    );
    const holdings = results.map((res, i) => {
      const stock = portfolio[i];
      if (res.status !== "fulfilled" || !res.value) {
        return {
          symbol: stock.symbol,
          status: "Open",
          shares: stock.current_holding,
          lastPrice: "--",
          avgPrice: stock.avg_price,
          totalCost: "--",
          marketValue: "--",
          totalDivIncome: "--",
          dayGainPercent: "--",
          dayGainValue: "--",
          totalGainPercent: "--",
          totalGainValue: "--",
          realizedGain: stock.realized_gain,
        };
      }

      const p = res.value;
      const lastPrice = p.current;
      const prevClose = p.close;
      const qty = stock.current_holding;
      const avgPrice = stock.avg_price;
      const realizedGain = stock.realized_gain;
      const status = p.marketstate;
      const totalCost = avgPrice * qty;
      const marketValue = lastPrice * qty;
      const totalUnrealizedGain = marketValue - totalCost;
      const totalUnrealizedGainPercent =
        totalCost > 0 ? (totalUnrealizedGain / totalCost) * 100 : 0;

      const dayGainValue = (lastPrice - prevClose) * qty;
      const dayGainPercent =
        prevClose > 0 ? ((lastPrice - prevClose) / prevClose) * 100 : 0;

      return {
        symbol: stock.symbol,
        status: status ?? "UNKNOWN",
        shares: qty,
        lastPrice: formatNumber(lastPrice),
        avgPrice: formatNumber(avgPrice),
        totalCost: formatNumber(totalCost),
        marketValue: formatNumber(marketValue),
        totalDivIncome: "--",
        dayGainPercent: `${dayGainPercent.toFixed(2)}%`,
        dayGainValue: formatNumber(dayGainValue),
        totalGainPercent: `${totalUnrealizedGainPercent.toFixed(2)}%`,
        totalGainValue: formatNumber(totalUnrealizedGain),
        realizedGain: formatNumber(realizedGain),
      };
    });

    res.status(200).json({ success: true, count: holdings.length, data: holdings });
  } catch (error) {
    console.error("Error fetching portfolio holdings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio holdings",
    });
  }
};
