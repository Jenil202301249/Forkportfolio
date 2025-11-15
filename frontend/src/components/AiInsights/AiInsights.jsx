import React from 'react'
import './AiInsights.css'

const AiInsights = () => {
  return (
    <div>
      <div className="card insights-card">
            <h2 className="ai-title">AI - Powered Insights</h2>
            <ul className="insights">
              <li> Your portfolio is heavily concentrated in the Tech sector (65%). Consider diversifying..</li>
              <li> TATA MOTORS shows strong upward momentum based on recent volume..</li>
              <li> Your holding in HDFC BANK has shown higher than average volatility over the last 7 trading sessions..</li>
              <li> The Pharmaceuticals sector is currently showing signs of undervaluation compared to its 5-year average. Stocks like SUNPHARMA could present a diversification opportunity.</li>
            </ul>
            <p className="view-all">View all Insights →</p>
          </div>

    </div>
  )
}

export default AiInsights
