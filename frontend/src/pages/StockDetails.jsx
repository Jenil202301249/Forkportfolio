import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import DashboardHeader from '../components/Dashboard-Header.jsx';
import Footer from '../components/Footer.jsx';
import tataIcon from '../assets/tata-icon.png';
import { FieldValue } from "../components/FieldValue.jsx";
import { MarketNewsItem } from "../components/MarketMovers/MarketMovers.jsx";
import './StockDetails.css';
import { useNavigate } from "react-router-dom";

export const StockDetails = () => {
    const [darkMode, setDarkMode] = useState(true);
    const [buyStock, handleBuyStock] = useState("");
    const [sellStock, handleSellStock] = useState("");
    const [addedStock, handleAdd] = useState("");
    const marketNewsData = [
        { headline: 'RBI keeps repo rate unchanged, GDP forecast raised.', time: '1 hour ago' },
        { headline: 'RBI keeps repo rate unchanged, GDP forecast raised.', time: '1 hour ago' },
    ];

    return (
        <div className="main-page-for-stock">
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} pageType="dashboard"
                profileData={{ name: "Ayush Dhamecha", email: "ma**@gmail.com", }} />
            <DashboardHeader darkMode={darkMode} />
            <div className="empty"></div>
            <div className="stock-info-page">

                <div className="stock-head">
                    <img className="stock-icon" src={tataIcon} alt="Stock image" />
                    <button className="buy" val="Buy" onClick={handleBuyStock}>Buy</button>
                    <button className="sell" val="Sell" onClick={handleSellStock}>Sell</button>
                    <button className="add-watchlist" val="Add" onClick={handleAdd}>Add to watchlist</button>
                </div>

                <div className="stock-name">TATA Motors Passenger Vehicles Limited (TATAMOTORS.NS)</div>

                <div className="stock-price">
                    <div className="abs">418.30</div>
                    <div className="percentage">+4.35(+0.83%)</div>
                </div>

                <div className="stock-detail-navbar">
                    <a className="detail-button" href="#heads1">Performance</a>
                    <a className="detail-button" href="#heads2">Fundamentals</a>
                    <a className="detail-button" href="#heads3">Financials</a>
                    <a className="detail-button" href="#heads4">News</a>
                    <a className="detail-button" href="#heads5">About Company</a>
                </div>

                <div className="stock-chart">{/*to put*/}</div>

                <div id="heads1">Performance</div>
                <div className="performance">
                    <div className="day-range">Day's range</div>

                    <div className="price-range">
                        <div className="range-field">
                            <span className="low-f">Today's low:</span>
                            <span className="low-v">403.60</span>
                        </div>

                        <hr />
                        <div className="range-val">
                            <span className="high-f">Today's high:</span>
                            <span className="high-v">408.90</span>
                        </div>

                    </div>
                </div>
                <div className="more-info">
                    <div className="info-left">
                        <FieldValue className="stk-info" fieldname="Previous Close" value="405.85" />
                        <FieldValue className="stk-info" fieldname="Open" value="407.85" />
                        <FieldValue className="stk-info" fieldname="Volume" value="14,120,004" />
                    </div>
                    <div className="info-right">
                        <FieldValue className="stk-info" fieldname="Day's range" value="403.60" />
                        <FieldValue className="stk-info" fieldname="52 week range" value="408.9" />
                        <FieldValue className="stk-info" fieldname="Market Cap (intraday)" value="1.494T" />
                    </div>
                </div>

                <div id="heads2">Fundamentals</div>
                <div className="fundamentals">
                    <div className="info-left">
                        <FieldValue className="stk-info" fieldname="ROCE (TTM)" value="8.61" />
                        <FieldValue className="stk-info" fieldname="P/E Ratio (TTM)" value="32.9" />
                        <FieldValue className="stk-info" fieldname="P/B Ratio" value="3.21" />
                        <FieldValue className="stk-info" fieldname="Industry P/E" value="22.00" />
                        <FieldValue className="stk-info" fieldname="Debt to Equity" value="5.88" />

                    </div>
                    <div className="info-right">
                        <FieldValue className="stk-info" fieldname="ROE" value="11.62" />
                        <FieldValue className="stk-info" fieldname="EPS (TTM)" value="9.93" />
                        <FieldValue className="stk-info" fieldname="Dividend Yield" value="0.12" />
                        <FieldValue className="stk-info" fieldname="Book Value" value="101.67" />
                        <FieldValue className="stk-info" fieldname="Face Value" value="10" />

                    </div>
                </div>

                <div id="heads3">Financials</div>
                <div className="financials">
                    <div className="info-left">
                        <div className="info-left-upper">
                            <div className="inc-stat">Income Statement</div>

                            <FieldValue className="stk-info" fieldname="Revenue (TTM)" value="4.37 T" />
                            <FieldValue className="stk-info" fieldname="Revenue Per Share (TTM)" value="1,187.16" />
                            <FieldValue className="stk-info" fieldname="Quarterly Revenue Growth (YOY)" value="-3.40%" />
                            <FieldValue className="stk-info" fieldname="Gross Profit (TTM)" value="1.95 T" />
                            <FieldValue className="stk-info" fieldname="EBITDA" value="421.66 B" />
                            <FieldValue className="stk-info" fieldname="Net Income Available to Common (TTM)" value="212.4 B" />
                            <FieldValue className="stk-info" fieldname="Diluted EPS (TTM)" value="60.92" />
                            <FieldValue className="stk-info" fieldname="Quarterly Earnings Growth (YOY)" value="-29.50%" />

                        </div>
                        <div className="info-left-lower">
                            <div className="prof-eff-metrics">Profitability & Efficiency Metrics</div>

                            <FieldValue className="stk-info" fieldname="Profit Margin" value="4.86%" />
                            <FieldValue className="stk-info" fieldname="Operating Margin (TTM)" value="5.67%" />
                            <FieldValue className="stk-info" fieldname="Return on Assets (TTM)" value="--" />
                            <FieldValue className="stk-info" fieldname="Return on Equity (TTM)" value="--" />
                        </div>
                    </div>
                    <div className="info-right">
                        <div className="info-right-upper">
                            <div className="bal-sheet">Balance Sheet</div>

                            <FieldValue className="stk-info" fieldname="Total Cash (MRQ)" value="647.28 B" />
                            <FieldValue className="stk-info" fieldname="Total Cash Per Share (MRQ)" value="183.16" />
                            <FieldValue className="stk-info" fieldname="Total Debt (MRQ)" value="770.7 B" />
                            <FieldValue className="stk-info" fieldname="Total Debt / Equity (MRQ)" value="61.55 %" />
                            <FieldValue className="stk-info" fieldname="Current Ratio (MRQ)" value="--" />
                            <FieldValue className="stk-info" fieldname="Book Value Per Share (MRQ)" value="315.49" />
                        </div>
                        <div className="info-right-middle">
                            <div className="cash-flow-stat">Cash Flow Statement</div>

                            <FieldValue className="stk-info" fieldname="Operating Cash Flow (TTM)" value="--" />
                            <FieldValue className="stk-info" fieldname="Levered Free Cash Flow (TTM)" value="--" />
                        </div>
                        <div className="info-right-lower">
                            <div className="fisc-info">Fiscal Information</div>

                            <FieldValue className="stk-info" fieldname="Fiscal Year Ends" value="3/31/2025" />
                            <FieldValue className="stk-info" fieldname="Most Recent Quarter (MRQ)" value="6/30/2025" />
                        </div>
                    </div>
                </div>

                <div id="heads4">News</div>
                <div className="news">
                    <div className="news-head">
                        <div className="rec-news">Recent News: TATAMOTORS.NS</div>
                        <a className="see-more">See more →</a>
                    </div>

                    <div className="news-container">
                        <div className="market-data">
                            {marketNewsData.map((news, index) => (
                                <MarketNewsItem key={index} {...news} />
                            ))}
                        </div>
                        <div className="market-data">
                            {marketNewsData.map((news, index) => (
                                <MarketNewsItem key={index} {...news} />
                            ))}
                        </div>
                    </div>
                </div>

                <div id="heads5">About Company</div>
                <div className="about-company">
                    <h3>TATA Motors Passenger Vehicles Limited (TATAMOTORS.NS) </h3>
                    <div className="sub-about">
                        <div className="sub-info">
                            <span id="span1">86259</span>
                            <span id="span2">Full-time employees</span>
                        </div>
                        <div className="sub-info">
                            <span id="span1">March 31</span>
                            <span id="span2">Fiscal year ends</span>
                        </div>
                        <div className="sub-info">
                            <span id="span1">Consumer Cyclical</span>
                            <span id="span2">Sector</span>
                        </div>
                        <div className="sub-info">
                            <span id="span1">Auto manufecturers</span>
                            <span id="span2">Industry</span>
                        </div>
                    </div>
                    <span className="about-desc">Tata Motors Passenger Vehicles Limited designs,
                        develops, manufactures, and sells various automotive vehicles. The company
                        offers passenger cars; sports utility vehicles; and electric vehicles, as
                        well as related spare parts and accessories. It also manufactures engines
                        for industrial applications; and factory automation equipment, as well as
                        provides information technology,...
                    </span>
                    <a className="company-link" href="https://www.tatamotors.com/">www.tatamotors.com</a>
                </div>


            </div>

            <div className="footer-div">
                <Footer darkMode={darkMode}
                    navigationLinks={[
                        { text: "Portfolio", href: "#" },
                        { text: "AI Insigths", href: "#" },
                        { text: "Wacthlist", href: "#" },
                        { text: "Compare Stocks", href: "#" },

                    ]}
                    legalLinks={[
                        { text: "Privacy Policy", href: "#privacy" },
                        { text: "Terms Of Service", href: "#terms" },
                        { text: "Contact Us", href: "#contact" },
                    ]} />
            </div>
        </div>
    );
};