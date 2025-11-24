import React, { use, useEffect } from 'react'
import BotSidebar from '../components/BotSidebar'
import ChatWindow from '../components/ChatWindow'
import './AiInsight.css'
import Navbar from '../components/Navbar'
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { darkMode, setDarkMode ,userDetails} = useAppContext();
  const { ensureAuth } = useAppContext();
   const navigate = useNavigate();
  useEffect(() => {
           // Run an initial check: this page is an auth/home page, so pass true
        (async () => {
          try {
            await ensureAuth(navigate, false);
          } catch (e) {
            console.error("ensureAuth initial check failed:", e);
          }
        })();
  
        const intervalId = setInterval(() => {
          ensureAuth(navigate, false).catch((e) => console.error(e));
        }, 10000);
  
        return () => {
          clearInterval(intervalId);
        };
  },  [navigate, ensureAuth]);
  return (
    <div className="home">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} pageType="ai-insight"
        profileData={{
          name: userDetails?.name?.split(" ")[0] || "Guest",
          email: userDetails?.email || "N/A",
        }} />
      <BotSidebar />
      <div className="main-content">
        <ChatWindow />
      </div>
    </div>
  )
}

export default Home