import YahooFinance from "yahoo-finance2";
import { number, z } from "zod";
import { tool } from "@langchain/core/tools";
import { getStockSummary } from "../../db/stockSummary.js"
const yahooFinance = new YahooFinance();

export const Portfolio_analysis_tool = tool(
  // Portfolio analysis tool
  async (input,context) => {

    //fetch user portfolio from db
    const userDetails = context.configurable.userDetails || {};
    const email_Id = userDetails.emailId || context.configurable.thread_id;
    const name = userDetails.name || "User";
    
    console.log("User Details:", userDetails);
    console.log("Email ID:", email_Id);
    console.log("userDetails:", userDetails);
    // if(!userDetails.aiSuggestionsEnabled)
    // {
    //   console.log("AI Insights disabled for user with email id", email_Id);
    //   return {
    //     statusCode: 400,
    //     success: false,
    //     message:
    //       "You've turned off AI Insights for your portfolio. I won't analyze your portfolio until you switch it back on.",
    //   };
    // }
    const portfolio = await getStockSummary(email_Id);
    console.log("portfolio of user with email id", email_Id, "and name", name, "is", portfolio);
    if (!portfolio || portfolio.length === 0) {
      // console.log("No portfolio found for user with email id", email_Id);
      return {
        statusCode: 400,
        success: false,
        message: "Your portfolio is empty.",
      };
    }
    

    // Extract user details once (outside the loop)
    const financialGoals = userDetails.financialGoals || "not specified";
    const investmentHorizon = userDetails.investmentHorizon || "not specified";

    const result = [];
    for (const stock of portfolio) {
      const { symbol, current_holding ,avg_price,spended_amount} = stock;
      console.log(`Fetching data for ${symbol} with quantity ${current_holding}, avg_price: ${avg_price}, spended_amount: ${spended_amount}`);
      try {
        const quote = await yahooFinance.quote(symbol);
        const end = new Date(); // current date
        const start = new Date();
        start.setFullYear(end.getFullYear() - 1); // exactly 1 year ago

        
        console.log(`Fetched annual report data for ${symbol}:`, quote);

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
        const profitLoss = (price - avg_price) * current_holding;
        const exchange = quote?.exchangeName || "NSE";
        const regularMarketPreviousClose = quote?.regularMarketPreviousClose ?? price;
        const epsTrailingTwelveMonths = quote?.epsTrailingTwelveMonths ?? null;
        const dividendRate = quote?.dividendRate ?? null;
        const bookValue = quote?.bookValue ?? null;
        const priceToBook = quote?.priceToBook ?? null;

        // Debug logging
        console.log(`${symbol} - Price: ${price}, Avg Price: ${avg_price}, Quantity: ${current_holding}, P/L: ${profitLoss}`);
        
        result.push({
          symbol,
          name,
          quantity: current_holding,
          price,
          changeValue,
          changePercent,
          currency,
          marketCap,
          pe,
          divYield,
          fiftyTwoWeekHigh,
          fiftyTwoWeekLow,
          avg_price,
          spended_amount,
          profitLoss,
          exchange,
          regularMarketPreviousClose,
          epsTrailingTwelveMonths,
          dividendRate,
          bookValue,
          priceToBook
        });
      } catch (err) {
        console.error(`Error fetching data for ${symbol}:`, err.message);
        result.push({
          symbol,
          name: "Error fetching data",
          quantity: current_holding,
          price: 0,
          changeValue: 0,
          changePercent: 0,
          currency: "INR",
          marketCap: null,
          pe: null,
          divYield: null,
          fiftyTwoWeekHigh: null,
          fiftyTwoWeekLow: null,
          avg_price,
          spended_amount,
          profitLoss : 0,
          exchange: "NSE",
          regularMarketPreviousClose: 0,
          epsTrailingTwelveMonths: null,
          dividendRate: null,
          bookValue: null,
          priceToBook: null,
          userName : name,
          investmentExperience: userDetails.investmentExperience || "not specified",
          financialGoals,
          investmentHorizon
        });
      }
    }

    let totalValue = 0;
    let totalInvested = 0;
    let totalProfitLoss = 0;
    let totalDivYield = 0;
    let weightedPE = 0;
    let weightedDivYield = 0;
    
    for(const stock of result){
      totalValue += stock.price * stock.quantity;
      totalInvested +=  (stock.avg_price * stock.quantity);
      totalProfitLoss +=  (stock.price - stock.avg_price) * stock.quantity;
      totalDivYield += stock.divYield || 0;
    }

const resultWithAllocation = result.map((stock) => {
  const stockValue = stock.price * stock.quantity;
  const allocation = totalValue > 0 ? (stockValue / totalValue) * 100 : 0;

  return {
    ...stock,
    total: stockValue,
    allocation,
  };
});

// Now compute weighted metrics cleanly
for (const stock of resultWithAllocation) {
  if (stock.pe) weightedPE += (stock.pe * stock.allocation) / 100;
  if (stock.divYield) weightedDivYield += (stock.divYield * stock.allocation) / 100;
}

    // Aggregate stats
    const gainers = resultWithAllocation.filter(s => s.changePercent  > 0);
    const losers = resultWithAllocation.filter(s => s.changePercent < 0);
    const largestAllocation = [...resultWithAllocation].sort((a, b) => b.allocation - a.allocation)[0];
    const totalGainPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    const portfolioReport = {
      user : {
        name: userDetails.name || "User",
        investmentexperience: userDetails.investmentExperience || "not specified",
        financialGoals: userDetails.financialGoals || "not specified",
        investmentHorizon: userDetails.investmentHorizon || "not specified"
      },
      summary : {
        totalStocks : resultWithAllocation.length,
        totalValue : totalValue,
        totalInvested : totalInvested,
        totalProfitLoss : totalProfitLoss,
        totalGainPercent : totalGainPercent,
        weightedPE : weightedPE,
        weightedDivYield : weightedDivYield,
        largestHolding : {
          symbol: largestAllocation?.symbol || "N/A",
          name : largestAllocation?.name || "N/A",
          allocation : Number(largestAllocation?.allocation || 0),
          value : Number((largestAllocation?.price * largestAllocation?.quantity)) || 0,
        },
        },
        holding : resultWithAllocation.map((s) => ({
          symbol: s.symbol,
          name: s.name,
          quantity: s.quantity,
          exchange: s.exchange,
          price: s.price,
          avg_price: s.avg_price,
          spended_amount: s.spended_amount,
          total: s.total,
          profitLoss: s.profitLoss,
          changePercent : s.changePercent,
          allocation : (s.allocation) || 0,
          pe: s.pe,
          divYield: s.divYield,
          fiftyTwoWeekHigh: s.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: s.fiftyTwoWeekLow,
          epsTrailingTwelveMonths: s.epsTrailingTwelveMonths,
          dividendRate: s.dividendRate,
          bookValue: s.bookValue,
          priceToBook: s.priceToBook,
          marketCap: s.marketCap,
          currency: s.currency,
        })),

        performance : {
          gainers : gainers.map((g)=>g.symbol),
          losers : losers.map((l)=>l.symbol),
          insights : [
            totalGainPercent > 0 ? `Your portfolio is overall in profit with a gain of ${totalGainPercent}%.` :
            totalGainPercent < 0 ? `Your portfolio is overall at a loss of ${totalGainPercent}%.` :
            `Your portfolio is currently breaking even.`,
            `Weighted P/E ratio of your portfolio is ${weightedPE}.`,
            `Weighted Dividend Yield of your portfolio is ${weightedDivYield}%.`,
            `Largest holding is ${largestAllocation?.symbol || "N/A"} with an allocation of ${largestAllocation ? largestAllocation.allocation : 0}%.`
          ],
      },
      metaData : {
        generateAt : new Date().toISOString(),
        generatedBy : "Portfolio_analysis_tool v1.0",
        dataSource : "Yahoo Finance"
      }
    }
    console.log("Generated portfolio report: ", portfolioReport);
    return JSON.stringify(portfolioReport);
  },
  {
    name: "portfolio_analysis",
    description:
      "Analyzes the user's stock portfolio. If no input is provided, automatically uses the portfolio from the logged-in user database. Optionally accepts manual stock tickers, quantities, and prices.",
    schema: z.object({}) 
  }
);
