import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import './Dashboard.css';
import 'primeicons/primeicons.css';
import DashboardHeader from '../components/Dashboard-Header.jsx';
import MarketMovers from '../components/MarketMovers/MarketMovers'
import WelcomeInvestor from '../components/WelcomeInvestor/WelcomeInvestor'
import PortfolioChart from '../components/PortfolioChart/PortfolioChart'
import SectorAllocation from '../components/SectorAllocation/SectorAllocation'
import AiInsights from '../components/AiInsights/AiInsights'
import MyHoldings from '../components/MyHoldings/MyHoldings'
import Navbar from '../components/Navbar.jsx';
import { useAppContext } from "../context/AppContext";
export const Dashboard = () => {
  const { darkMode, setDarkMode } = useAppContext();

  return (
    <>
    <div className="dashboard-container">
       
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} pageType="dashboard" 
      profileData={{name: "Ayush Dhamecha",email: "ma**@gmail.com",}}/>

      <DashboardHeader darkMode={darkMode}  />
      
      <div className="section-wrapper">
        <WelcomeInvestor />
        <PortfolioChart/>
        <div className="sectorai">
        <SectorAllocation/>
        <AiInsights/>
        </div>
        <MyHoldings/>
        <MarketMovers />
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
        ]}/>
      </div>
      
    </div>
    </>
  );
};
