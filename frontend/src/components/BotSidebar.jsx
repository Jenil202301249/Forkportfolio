import React, { useState, useRef, useEffect, use } from "react";
import "../components/BotSidebar.css";
import close_icon from "../assets/closeIcon.png";
import open_icon from "../assets/openIcon.png";
import profileicon from "../assets/profileicon.svg";
import { useAppContext } from "../context/AppContext";

const BotSidebar = () => {
  const botSidebarRef = useRef(null);
  const {userDetails} = useAppContext();
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);
  
  // Debug: Log userDetails whenever it changes
  useEffect(() => {
    console.log("BotSidebar - userDetails:", userDetails);
    console.log("BotSidebar - profileImage:", userDetails?.profileImage);
  }, [userDetails]);
  
  return (
    <div className={`bot-sidebar ${isOpen ? "open" : "close"}`}>
      {/* close icon */}
      <img
        src={isOpen ? close_icon : open_icon}
        alt="toggle sidebar icon"
        className="bot-toggle-sidebar-btn"
        // height={50}
        onClick={toggleSidebar}
      />

      {isOpen && (
        <>
        <div className="chatbot-feature">
          <h2>What You Can Ask</h2>
          <p>Discover how InsightStox AI helps you understand markets, stocks, and trends.</p>


          <div className="chatbot-feature-list">
            <div className="chatbot-f1 chatbot-f">
              <h4>Portfolio Analyzer</h4>
              <p>Get insights into your portfolio’s value, gains, and performance.</p>
            </div>
            <div className="chatbot-f2 chatbot-f">
              <h4>Portfolio Risk Analyzer</h4>
              <p>Evaluate the risk level of your portfolio based on volatility, concentration, beta, and diversification.</p>
            </div>
            <div className="chatbot-f4 chatbot-f">
              <h4>Market News & Sentiment</h4>
              <p>Track market mood with AI-powered news and sentiment analysis.</p>
            </div>
          </div>
        </div>
          <div className="profileContainer">
            {/* {console.log("Rendering profile image:", userDetails.profileImage)} */}
            <img src={userDetails?.profileImage || profileicon} alt="profile icon" height={50} className="profile-avatar"/>
            <h3>{userDetails?.name?.split(" ")[0] || 'Guest'}</h3>
          </div>
        </>
      )}
    </div>
  );
};

export default BotSidebar;
