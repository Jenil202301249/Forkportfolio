import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
import { getStockSummary } from "../../db/stockSummary.js";
import { PriceStore } from "../../utils/stores/priceRates.js";
import { stockPriceStore } from "../../utils/stockPriceStore.js";

export const getSummaryTable = async (req,res) => {
  try {
    const { email } = req.user;
    const userHoldings = await getStockSummary(email);
    if(!userHoldings) return res.status(500).json({success: false,message: "Failed to fetch stock Summary"});
    if (userHoldings.length === 0) return res.status(200).json({success: false,summary: []});
    const results = await Promise.allSettled(
      userHoldings.map((holding) =>
        yahooFinance.quoteSummary(holding.symbol, {
          modules: ["price", "summaryDetail", "defaultKeyStatistics"],
        })
      )
    );

    const tableData = results
      .map((res, i) => {
        if (res.status !== "fulfilled") return null;
        const currencychange = PriceStore.get(res.value.price.currency)||1;
        const price = res.value.price;
        const lastPrice = price.regularMarketPrice/currencychange ?? 0;
        const previousClose = price.regularMarketPreviousClose/currencychange ?? 0;
        const change = price.regularMarketChange/currencychange ?? 0;
        const changePercent = price.regularMarketChangePercent ?? 0;
        const currency = price.currency ?? "INR";
        const longname = price.longName ?? null;
        const shortname= price.shortName ?? null;
        const marketTime = new Date(price.regularMarketTime).toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        stockPriceStore.add(price.symbol,{
            symbol: price.symbol,
            current: lastPrice,
            currency: currency,
            close: previousClose,
            percentageChange: changePercent,
            shortname: shortname,
            longname: longname,
            change: change,
            expiresAt: Date.now() + 60*1000
        });
        const shares = userHoldings[i].current_holding ?? 0;
        const summary = res.value.summaryDetail;
        const dayLow = summary?.dayLow ?? "-";
        const dayHigh = summary?.dayHigh ?? "-";
        const yearLow = summary?.fiftyTwoWeekLow ?? "-";
        const yearHigh = summary?.fiftyTwoWeekHigh ?? "-";
        const avgVolume = summary?.averageVolume3Month ?? "-";
        const volume = price.regularMarketVolume ?? "-";
        const marketCap = price.marketCap ? formatNumber(price.marketCap) : "-";

        return {
          symbol: price.symbol,
          shortname: shortname,
          longname: longname,
          lastPrice: lastPrice,
          changePercent: changePercent,
          change: change,
          currency: currency,
          marketTime: marketTime,
          volume: formatNumber(volume),
          shares: shares,
          avgVolume: formatNumber(avgVolume),
          dayRange: `₹${dayLow} → ₹${dayHigh}`,
          yearRange: `₹${yearLow} → ₹${yearHigh}`,
          marketCap: marketCap,
        };
      })
      .filter(Boolean);

    return res.status(200).json({success: true,summary: tableData});
  } catch (error) {
    console.log("Error generating holdings table:", error);
    return res.status(500).json({success:false,meaasge: error.meaasge})
  }
};

function formatNumber(value) {
  if (!value || isNaN(value)) return "-";
  const abs = Math.abs(Number(value));
  if (abs >= 1e12) return (value / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (value / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (value / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (value / 1e3).toFixed(2) + "K";
  return value.toFixed(2);
}
