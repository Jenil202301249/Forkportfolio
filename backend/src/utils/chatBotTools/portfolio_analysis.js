import YahooFinance from "yahoo-finance2";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
const yahooFinance = new YahooFinance();
// import { getUserPortfolio } from "../db/portfolioModel.js"; // your DB function

export const Portfolio_analysis_tool = tool(
  // function
  async (context) => {
    const portfolio = [ {"symbol": "RELIANCE.NS", "quantity": 120}, {"symbol": "TCS.NS", "quantity": 45}, {"symbol": "INFY.NS", "quantity": 30} ];
    console.log("Portfolio_analysis_tool used with ", context);


    // ✅ Fetch portfolio automatically from DB (for current user)
    // const userId = context?.user?.id; // you get this from auth/session middleware
    // const portfolio = await getUserPortfolio(userId);

    // if (!portfolio || portfolio.length === 0) {
    //   throw new Error("No portfolio found for the current user.");
    // }
    // Convert JSON string into object

    let parsedPortfolio = typeof portfolio === "string" ? JSON.parse(portfolio) : portfolio;
    const stocks = Array.isArray(parsedPortfolio)
      ? parsedPortfolio
      : parsedPortfolio?.portfolio;

    if (!Array.isArray(stocks)) {
      throw new Error("Invalid portfolio format. Must be an array or { portfolio: [...] }");
    }

    console.log("Parsed Portfolio:", parsedPortfolio);

    const result = [];
    for (const stock of stocks) {
      const { symbol, quantity } = stock;
      console.log(`Fetching data for ${symbol} with quantity ${quantity}`);
      try {
        const quote = await yahooFinance.quote(symbol);
        const name = quote?.shortName || quote?.longName || "Unknown Company";
        const price = quote?.regularMarketPrice ?? 0;
        const changeValue = quote?.regularMarketChange ?? 0;
        const changePercent = quote?.regularMarketChangePercent ?? 0;
        const currency = quote?.currency || "INR";
        const marketCap = quote?.marketCap ?? null;
        const pe = quote?.trailingPE ?? null;
        const divYield = quote?.dividendYield ?? null;
        const fiftyTwoWeekHigh = quote?.fiftyTwoWeekHigh ?? null;
        const fiftyTwoWeekLow = quote?.fiftyTwoWeekLow ?? null;
        result.push({
          symbol,
          name,
          quantity,
          price,
          changeValue,
          changePercent,
          currency,
          marketCap,
          pe,
          divYield,
          fiftyTwoWeekHigh,
          fiftyTwoWeekLow,
        });
      } catch (err) {
        console.error(`Error fetching data for ${symbol}:`, err.message);
        result.push({
          symbol,
          name: "Error fetching data",
          quantity,
          price: 0,
          changeValue: 0,
          changePercent: 0,
          currency: "INR",
        });
      }
    }

    let totalValue = 0;
    for (const stock of result) {
      totalValue += stock.price * stock.quantity;
    }

    const resultWithAllocation = result.map((stock) => ({
      ...stock,
      total: stock.price * stock.quantity,
      allocationPercent:
        totalValue > 0 ? ((stock.price * stock.quantity) / totalValue) * 100 : 0,
    }));

    const gainers = resultWithAllocation.filter((s) => s.changePercent > 0);
    const losers = resultWithAllocation.filter((s) => s.changePercent < 0);
    const largestHolding = resultWithAllocation.sort(
      (a, b) => b.allocationPercent - a.allocationPercent
    )[0];

    const report = `# 📊 Portfolio Analysis Report (India)
---
## 💰 Overview  
You currently hold **${resultWithAllocation.length} stocks**  
**Total Portfolio Value:** ₹${totalValue.toFixed(2)}

---
## 🏦 Holdings Breakdown
${resultWithAllocation
  .map(
    (s) => `
### **${s.name} (${s.symbol})**
- **Quantity:** ${s.quantity}  
- **Price:** ₹${s.price.toFixed(2)}  
- **Change:** ${s.changePercent.toFixed(2)}%  
- **Market Cap:** ${s.marketCap ? `₹${(s.marketCap / 1e9).toFixed(2)}B` : "N/A"}  
- **P/E Ratio:** ${s.pe ?? "N/A"}  
- **Dividend Yield:** ${
      s.divYield ? (s.divYield * 100).toFixed(2) + "%" : "N/A"
    }  
- **52W Range:** ₹${s.fiftyTwoWeekLow} – ₹${s.fiftyTwoWeekHigh}  
- **Value:** ₹${(s.price * s.quantity).toFixed(2)}  
- **Allocation:** ${s.allocationPercent.toFixed(2)}%
`
  )
  .join("")}

---
## 📈 Performance Summary  
- **Gainers:** ${gainers.length ? gainers.map((g) => g.symbol).join(", ") : "None"}  
- **Losers:** ${losers.length ? losers.map((l) => l.symbol).join(", ") : "None"}

---
## 💡 Insights  
- **Largest Holding:** ${largestHolding?.symbol ?? 'N/A'} (${largestHolding?.allocationPercent?.toFixed(
      2
    ) ?? 'N/A'}% of portfolio)  
- **Diversification Tip:** Try to keep no more than 40% allocation in a single stock.  
- **Dividend Insight:** Consider high-yield stocks for stable returns.

---
### ⚠️ Disclaimer  
This analysis is AI-generated and for informational purposes only. Always verify data and consult a certified financial advisor.
`;
    return report;
  },
  // options
  {
    name: "portfolio_analysis",
    description:
      "Analyzes the current logged-in user's stock portfolio using live Yahoo Finance data. Provides valuation, gainers/losers, allocation, and insights.",
    schema: z.object({}) // ✅ No input needed
  }
);
