import React,{useEffect,useState} from 'react'
import './AiInsights.css'
import axios from 'axios';


const AiInsights = () => {
   const [formattedInsights, setFormattedInsights] = useState([]);

   /*-------------------------------------------------Function to format portfolio data into insights---------------------- */
   const formatPortfolioData = (jsonString) => {
     try {
       const data = JSON.parse(jsonString);
       const insights = [];
       
       insights.push(`• Dear , ${data.user.name} currently You have : ${data.summary.totalStocks} stocks in your portfolio.`);
       insights.push(`• Current Portfolio Value: ₹${Math.round(data.summary.totalValue).toLocaleString()}`);
       insights.push(`• Total Amount Invested: ₹${Math.round(data.summary.totalInvested).toLocaleString()}`);
       insights.push("");

       const profitLoss = data.summary.totalProfitLoss;
        const gainPercent = Number(data.summary.totalGainPercent).toFixed(2);
       if (profitLoss > 0) {
         insights.push(`• Overall Profit: ₹${Math.round(profitLoss).toLocaleString()} (${gainPercent}%)`);
       } else if (profitLoss < 0) {
         insights.push(`• Overall Loss: ₹${Math.round(Math.abs(profitLoss)).toLocaleString()} (${gainPercent}%)`);
       } else{
          insights.push(`• No Overall Profit or Loss: Your portfolio is currently neutral.`);
       }
        insights.push("");
       
       // Top Holding
       const topHolding = data.summary.largestHolding;
       insights.push(`• Largest Holding: ${topHolding.symbol} (${Math.round(topHolding.allocation)}% allocation)`);
        insights.push(`• Largest Holding Value: ₹${Math.round(topHolding.value).toLocaleString()}`);
        insights.push("");

       
      insights.push(`• Weighted Portfolio P/E: ${data.summary.weightedPE}`);
      insights.push(`• Weighted Dividend Yield: ${data.summary.weightedDivYield}%`);
      insights.push("");
       
      const gainers = data.performance.gainers;
    const losers = data.performance.losers;

    if (gainers.length > 0) {
      insights.push(`• Top Gainers: ${gainers.slice(0, 3).join(", ")}`);
    }
    if (losers.length > 0) {
      insights.push(`• Top Losers: ${losers.slice(0, 3).join(", ")}`);
    }
    insights.push("");

     if (data.summary.weightedPE < 12) {
      insights.push(`• Valuation Insight: Portfolio seems undervalued based on weighted P/E.`);
    } else if (data.summary.weightedPE > 25) {
      insights.push(`• Valuation Warning: Portfolio appears overvalued; review high P/E holdings.`);
    } else {
      insights.push(`• Fair Valuation: Portfolio P/E is within a normal range.`);
    }
    insights.push("");

      //  console.log("Formatted Insights:", insights);
       return insights;
     } catch (error) {
       console.error("Error parsing portfolio data:", error);
       return ["Unable to parse portfolio insights"];
     }
   };

/*-------------------------------------------------Handler to fetch portfolio analysis insights---------------------- */

const handlePortfolioAnalysis = async () => {
        try{
          const res = await axios.get(import.meta.env.VITE_BACKEND_LINK + "/api/v1/dashBoard/getPortfolioInsight",{withCredentials: true});
          console.log("AiInsights component mounted",res.data.reply);
          const formatted = formatPortfolioData(res.data.reply);
          setFormattedInsights(formatted);
        }
        catch(err){
          console.error("Error fetching portfolio insights:", err);
          setFormattedInsights(["Error fetching portfolio insights"]);
        }
    }
    


/*-------------------------------------------------useEffect to call portfolio analysis on component mount---------------------- */
  useEffect(() => {
    handlePortfolioAnalysis();
  },[]);
  
  return (
    <div>
      <div className="card insights-card">
            <h2 className="ai-title">AI - Powered Insights</h2>
            <div className="insights">
              {formattedInsights.length > 0 ? (
                formattedInsights.map((val, index) => (
                  <p key={index} className="insight-item">{val}</p>
                ))
              ) : (
                <p>Loading portfolio insights...</p>
              )}
            </div>
            <p className="view-all">View all Insights →</p>
          </div>

    </div>
  )
}

export default AiInsights
