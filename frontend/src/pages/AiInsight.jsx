import React, { use, useEffect } from 'react'
import BotSidebar from '../components/BotSidebar'
import ChatWindow from '../components/ChatWindow'
import './AiInsight.css'
import Navbar from '../components/Navbar'
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import Swal from "sweetalert2";



const aiallowed = async()=>{
  const ai = await axios.get(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/getDataAndPrivacy", { withCredentials: true });
  const user = ai.data?.data;
  console.log(user);
  if(user && !user.aisuggestion){
    return false;
  }
  return true;
}
const Home = () => {
  const { darkMode, setDarkMode ,userDetails} = useAppContext();
  const { ensureAuth } = useAppContext();
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const allowed = await aiallowed();
      if(!allowed){
        Swal.fire({
          toast: true,
          position: "top",
          icon: "error",
          title: `Please enable AI insights in settings to access this page.`,
          iconColor: "#ff5c33ff",
          background: "#1a1a1a",
          showConfirmButton: false,
          timer: 3000,
          customClass: {
            popup: "small-toast"
          }
        });
        navigate("/dashboard");
        return;
    }
  })();
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