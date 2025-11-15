import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyHoldings.css";

//Base backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_LINK;
const HOLDINGS_API = `${BACKEND_URL}/api/v1/dashboard/stockSummary`;

const MyHoldings = () => {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        setLoading(true);

        // Automatically include cookies for authentication
        const response = await axios.get(HOLDINGS_API, { withCredentials: true });

        if (!response.data || !Array.isArray(response.data.data)) {
          throw new Error("Invalid response format from server");
        }

        // Store the holdings data
        setHoldings(response.data.data);
      } catch (err) {
        console.error("Error fetching holdings:", err);
        setError("Failed to load holdings. Please ensure you are logged in.");
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="card holdings-card">
        <h2>My Holdings</h2>
        <p>Loading holdings...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="card holdings-card">
        <h2>My Holdings</h2>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  // Normal Render
  return (
    <div>
      <div className="card holdings-card">
        <h2 className="header-title">My Holdings</h2>
        <table>
          <thead>
            <tr>
              <th>Stock</th>
              <th>Quantity</th>
              <th>Avg. Price</th>
              <th>Current Price</th>
              <th>Value (₹)</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((item, index) => (
              <tr key={index}>
                <td>{item.shortName}</td>
                <td>{item.quantity}</td>
                <td>{Number(item.avg_price).toLocaleString()}</td>
                <td>{Number(item.current_price).toLocaleString()}</td>
                <td>{Number(item.value).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="see-more">See More →</p>
      </div>
    </div>
  );
};

export default MyHoldings;
