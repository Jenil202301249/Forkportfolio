import YahooFinance from "yahoo-finance2";
import { number, z } from "zod";
import { tool } from "@langchain/core/tools";
import { getStockSummary } from "../../db/stockSummary.js"
const yahooFinance = new YahooFinance();
const today = new Date();
const oneYearAgo = new Date();
oneYearAgo.setFullYear(today.getFullYear() - 1);

const formatDate = (d) =>
  d.toISOString().split("T")[0];


export const risk_analysis_tool = tool(
    async (input,context) => {
    const stockDetails = [];
    let totalValue = 0;

    const userDetails = context.configurable.userDetails || {};
    const email_Id = userDetails.emailId || context.configurable.thread_id;

    const portfolio = await getStockSummary(email_Id);
    console.log("portfolio of user with email id", email_Id, portfolio);
    if (!portfolio || portfolio.length === 0) {
      console.log("No portfolio found for user with email id", email_Id);
      throw new Error("No portfolio found for the current user.");
    }

    const userName = userDetails.name || "User";
    const investmentExperience = userDetails.investmentExperience || "not specified";
    const financialGoals = userDetails.financialGoals || "not specified";
    const investmentHorizon = userDetails.investmentHorizon || "not specified";
    const riskProfile = userDetails.riskProfile || "not specified";

    console.log(`${userName} has an investment experience of ${investmentExperience}, financial goals of ${financialGoals}, an investment horizon of ${investmentHorizon}, and a risk profile of ${riskProfile}.`);
    // -------------------------- STEP 1: Fetch stock data ------------------------------//
    for (const stock of portfolio) {
          const quote = await yahooFinance.quote(stock.symbol);
          const summary = await yahooFinance.quoteSummary(stock.symbol, {
            modules: ["summaryDetail", "summaryProfile", "defaultKeyStatistics"]
          });
          const history = await yahooFinance.chart(stock.symbol, {
            period1: formatDate(oneYearAgo),
            period2: formatDate(today)
          });
    
        const price = quote.regularMarketPrice;
        const beta = summary?.defaultKeyStatistics?.beta ?? 1;
        const sector = summary?.summaryProfile?.sector || "Unknown";
        const closes = (history?.quotes || []).map((q) => q.close).filter((x) => x);
    
        // Daily returns
        const returns = [];
        for (let i = 1; i < closes.length; i++) {
            returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
        }
        console.log(`Fetched returns data for ${stock.symbol}`, returns);
    
        // Volatility (annualized)
    
        const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance =returns.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance) * Math.sqrt(252);
    
        const marketValue = price * stock.current_holding;
        totalValue += marketValue;
    
        stockDetails.push({
            symbol: stock.symbol,
            quantity: stock.current_holding,
            price,
            sector,
            beta,
            volatility,
            marketValue
        });
      }
    // ------------------------------ STEP 2: Concentration Risk---------------------------------//

    const concentration = stockDetails.map((s) => ({
      symbol: s.symbol,
      weight: (s.marketValue / totalValue) * 100
    }));

    const maxWeight = Math.max(...concentration.map((c) => c.weight));
    const concentrationRisk = maxWeight;

    // ---------------------- STEP 3: Diversification Score ----------------------------------//

    const uniqueSectors = new Set(stockDetails.map((s) => s.sector)).size;
    const diversificationQuality = Math.min(100, uniqueSectors * 20);
    const diversificationRisk = 100 - diversificationQuality;


     // ---------------------------- STEP 4: Volatility Score --------------------------------//
    const avgVolatility =stockDetails.reduce((a, b) => a + b.volatility, 0) /stockDetails.length;
    const volatilityScore = Math.min(100, avgVolatility * 100);

    // ---------------------------- STEP 5: Beta Score --------------------------------//
    const avgBeta = stockDetails.reduce((a, b) => a + b.beta, 0) /stockDetails.length;
    const betaScore = Math.min(100, avgBeta * 20);

    // ---------------------------- STEP 6: Final Risk Score --------------------------------//
    const finalRiskScore =0.4 * volatilityScore +0.3 * concentrationRisk +0.2 * betaScore +0.1 * diversificationRisk;

    const RiskConclusion = finalRiskScore < 30 ? "Low Risk" : finalRiskScore < 70 ? "Moderate Risk" : "High Risk";
    return {
      portfolio_value: totalValue,
      stocks: stockDetails,
      concentration,
      riskProfile,
      investmentHorizon,
      investmentExperience,
      financialGoals,
      scores: {
        volatilityScore,
        concentrationRisk,
        betaScore,
        diversificationRisk
      },
      final_risk_score: finalRiskScore,
      risk_conclusion: RiskConclusion
    };
    },{
        name : "risk_analysis",
        description : `
        Analyzes portfolio risk using Yahoo Finance only. Computes volatility, beta, sector exposure, concentration, diversification, & final risk score.
        `,
        schema: z.object({}) 

    }
);
