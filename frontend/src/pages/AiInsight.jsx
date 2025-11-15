import React from 'react'
import BotSidebar from '../components/BotSidebar'
import ChatWindow from '../components/ChatWindow'
import './AiInsight.css'
import Navbar from '../components/Navbar'
import { useAppContext } from "../context/AppContext";
const Home = () => {
  const { darkMode, setDarkMode ,userDetails} = useAppContext();
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