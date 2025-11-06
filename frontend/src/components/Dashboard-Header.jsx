import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard-Header.css';
import growthicon from '../assets/growthicon.svg';
import historyicon from '../assets/historyicon.svg';

//Enable cookies for all axios requests (important for auth sessions)
axios.defaults.withCredentials = true;

//Backend API URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_LINK;
const STOCK_API = `${BACKEND_URL}/api/v1/dashboard/starter`;

const DashboardHeader = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleFocus = () => setIsSearchActive(true);
  const handleClose = () => setIsSearchActive(false);

  // Fetch stock data from backend (session cookie included)
  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(STOCK_API);

      if (res.data?.data && Array.isArray(res.data.data)) {
        setStocks(res.data.data.slice(0, 3)); //show top 3 stocks
        console.log(res.data.data.slice(0, 3))
      } else {
        setError('Invalid data format from server.');
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load market data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    // Optionally auto-refresh every minute:
    // const interval = setInterval(fetchStockData, 60000);
    // return () => clearInterval(interval);
  }, []);

  // Loading state
  if (loading)
    return (
      <div className="dashboard-header loading">
        <p>Loading market data...</p>
      </div>
    );

  // Error state
  if (error)
    return (
      <div className="dashboard-header error">
        <p>{error}</p>
      </div>
    );

  return (
    <>
      {isSearchActive && <div className="overlay" onClick={handleClose}></div>}

      <div className="dashboard-header">
        {/*  Dynamic stock data display */}
        <div className="d-stock-display-container">
          {stocks.length > 0 ? (
            stocks.map((stock, index) => {
              const isNegative = Number(stock.change) < 0;
              return (
                <React.Fragment key={stock.Symbol || index}>
                  <div className="d-stock-info">
                    <div className="d-stock-header">
                      <span className="d-stock-name">
                        {stock.name ? stock.name : 'N/A'}
                      </span>
                      <span className="d-stock-exchange">{stock.exchange || '-'}</span>
                    </div>
                    <div className="d-stock-details">
                      <span className="d-stock-price">
                        {stock.price !== 'N/A'
                          ? Number(stock.price).toLocaleString()
                          : 'N/A'}
                        <span
                          className={`d-change-icon pi ${
                            isNegative ? 'pi-arrow-down negative' : 'pi-arrow-up positive'
                          }`}
                        ></span>
                      </span>
                      <span
                        className={`d-stock-change ${
                          isNegative ? 'negative' : 'positive'
                        }`}
                      >
                        <span className="d-change-text">
                          {`${stock.change} (${stock.changePercent}%)`}
                        </span>
                      </span>
                    </div>
                  </div>
                  {index < stocks.length - 1 && <span className="divider">|</span>}
                </React.Fragment>
              );
            })
          ) : (
            <p className="no-stocks">No active stock data available</p>
          )}
        </div>

        {/* Search Bar */}
        <div className="searchbar">
          <i className="pi pi-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search for a Stock (e.g., RELIANCE.NS, TATA MOTORS)"
            onFocus={handleFocus}
          />
        </div>
      </div>

      {/* Search Popup */}
      {isSearchActive && (
        <div className="search-popup">
          <div className="search-popup-header">
            <i className="pi pi-search popup-search-icon"></i>
            <input
              type="text"
              className="popup-search-input"
              placeholder="Search for a Stock (e.g., RELIANCE.NS, TATA MOTORS)"
              autoFocus
            />
          </div>
          <hr />
          <div className="search-results">
            <ul>
              <li>
                <img src={historyicon} alt="History" /> Tata Investment Corporation Ltd.
              </li>
              <li>
                <img src={historyicon} alt="History" /> Five Star Senior Living Inc.
              </li>
            </ul>
            <h4>Popular Stocks</h4>
            <ul>
              <li>
                <img src={growthicon} alt="Popular" /> ITI Ltd.
              </li>
              <li>
                <img src={growthicon} alt="Popular" /> Tata Motors Ltd.
              </li>
              <li>
                <img src={growthicon} alt="Popular" /> SBI Gold Fund
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardHeader;
