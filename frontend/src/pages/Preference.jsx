import React, { useState, useEffect,useRef } from "react";
import axios from 'axios';
import Navbar from "../components/Navbar.jsx";
import { Sidebar } from "../components/Sidebar.jsx";
import Footer from "../components/Footer.jsx";
import "./Preference.css";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
axios.defaults.withCredentials = true;


export const Preference = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [layout, setLayout] = useState("simple");
  const [loading, setLoading] = useState(true);
  const [initialTheme, setInitialTheme] = useState(null);
  const [initialLayout, setInitialLayout] = useState(null);
  const firstRun = useRef(true);
  //  Backend fetch logic (GET)
  useEffect(() => {
    
    async function fetchPreferences() {
      try {
        const response = await axios.get(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/getPreferencesAndPersonalisation",
          {withCredentials:true}
        );
        
        const data = response.data;
        if (data.success && data.data) {
          setTheme(data.data.theme || "dark");
          setLayout(data.data.dashboardlayout || "simple");

          setInitialTheme(data.data.theme || "dark");
          setInitialLayout(data.data.dashboardlayout || "simple");
          
          //succesfully fetched
          setLoading(false);
          firstRun.current = false;
        } 
        else {
          console.warn("Could not fetch preferences");
          alert("Could not fetch your preferences.");
        }
      }
      catch (error) {
        console.error("Error fetching preferences:", error);
        alert("Failed to load preferences. Please check your connection.");

      } 
    }

    fetchPreferences();
  }, []);

 // Auto-save preferences when theme/layout changes (PATCH)
  useEffect(() => {
    if (loading || firstRun.current) return; // skip initial load

    async function savePreferences() {
        
      try { 
        
        // Theme update
        if (theme !== initialTheme) {
          const themeResponce = await axios.patch(
            import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/updateTheme",
            { theme },
            { withCredentials: true }
          );
          if (themeResponce.data.success) {
            console.log("Theme updated successfully!");
            alert("Theme updated successfully!");
            setInitialTheme(theme); // update reference
          } 
          else {
            alert("Failed to update theme.");
          }
        }

        // Layout update
        if (layout !== initialLayout) {
          const layoutResponce = await axios.patch(
            import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/updateDashboardLayout",
            { dashboardlayout: layout },
            { withCredentials: true }
          );
            if (layoutResponce.data.success) {
            console.log("Layout updated successfully!");
            alert("Layout updated successfully!");
            setInitialLayout(layout); // update reference
            } 
            else {
            alert("Failed to update layout.");
            }
        }
      } catch (error) {
        console.error("Error saving preferences:", error);
        alert("Something went wrong while saving preferences. Check your internet or try again.");

      }
    }

    savePreferences();
  }, [theme, layout]);



  return (
    <div className="PreferenceLayout">
      {/* --- Navbar --- */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        pageType="preferences"
        profileData={{ name: "Ayush Dhamecha", email: "ma**@gmail.com" }}
      />

      <div className="PreferenceBody">
        {/* --- Sidebar --- */}
        <Sidebar
          primaryData={{ name: "Ayush Dhamecha", email: "ma**@gmail.com" }}
        />

        {/* --- Main Content --- */}
        <main className="PreferenceContainer">
          <h2>Preferences & Personalisation</h2>

          <form className="preferences-form" >
            {/* Theme Section */}
            <div className="form-group">
              <label htmlFor="theme-select">Theme</label>
              <div className="select-wrapper">
              <select
                id="theme-select"
                name="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="Dark">Dark</option>
                <option value="Light">Light</option>
              </select>
              <MdOutlineKeyboardArrowDown className="select-icon" />
              </div>    
              <p className="description">Choose the app appearance.</p>
            </div>

            {/* Dashboard Layout Section */}
            <div className="form-group">
              <label htmlFor="layout-select">Dashboard Layout</label>
              <div className="select-wrapper">              
              <select
                id="layout-select"
                name="layout"
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
              >
                <option value="Simple (Essential Metrics)">Simple (Essential Metrics)</option>
                <option value="Detailed (Advanced Insights)">Detailed (Advanced Insights)</option>
              </select>
              <MdOutlineKeyboardArrowDown className="select-icon" />
              </div>
              <p className="description">
                Customize the level of information displayed in your Dashboard.
              </p>
            </div>

          </form>
        </main>
      </div>

      {/* --- Footer --- */}
      <div className="footer-div">
        <Footer
          darkMode={darkMode}
          navigationLinks={[
            { text: "Portfolio", href: "#" },
            { text: "AI Insights", href: "#" },
            { text: "Watchlist", href: "#" },
            { text: "Compare Stocks", href: "#" },
          ]}
          legalLinks={[
            { text: "Privacy Policy", href: "#privacy" },
            { text: "Terms of Service", href: "#terms" },
            { text: "Contact Us", href: "#contact" },
          ]}
        />
      </div>
    </div>
  );
};
