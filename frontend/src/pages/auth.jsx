import React, { useEffect, useState } from "react";
import "./auth.css";
import bg_img from "../assets/dark-mode-login-bg.png";
import {Link} from "react-router-dom";
import LoginForm from "../components/LoginForm.jsx";
import SignupForm from "../components/SignupForm.jsx";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

export const Auth = () => {
  /*-----------------------------------------------state-Variables----------------------------------------------- */
  const [isLogin, setIsLogin] = useState(() => {
    return sessionStorage.getItem("isLogin") === "false" ? false : true;
  });
  /*-----------------------------------------------functions----------------------------------------------- */
  // Function to reset form states
  const resetFormStates = () => {
    sessionStorage.removeItem("isLogin");
    sessionStorage.removeItem("forgotpassword");
  };
  // Function to toggle between login and signup forms
  const toggleForm = () => {
    setIsLogin(prev => {
      const newVal = !prev;
      sessionStorage.setItem("isLogin", newVal);
      return newVal;
    });
  };
  const { ensureAuth } = useAppContext();
  const navigate = useNavigate();
  
  useEffect(() => {
      // Run an initial check: this page is an auth/home page, so pass true
      (async () => {
        try {
          await ensureAuth(navigate, true);
        } catch (e) {
          console.error("ensureAuth initial check failed:", e);
        }
      })();

      // Poll token validity every 30 seconds and react the same way
      const intervalId = setInterval(() => {
        // fire-and-forget, ensureAuth handles navigation
        ensureAuth(navigate, true).catch((e) => console.error(e));
      }, 5000);

      // When user navigates back (browser back button / swipe-back), run the same
      // cleanup that the Back button does (clear session flags / reset forms).
      const handlePop = () => {
        sessionStorage.removeItem("isLogin");
        sessionStorage.removeItem("forgotpassword");
        resetFormStates();
      };
      window.addEventListener('popstate', handlePop);
      return () => {
        clearInterval(intervalId);
        window.removeEventListener('popstate', handlePop);
      };
    }, [navigate, ensureAuth]);
  /*-----------------------------------------------JSX-Return-Statement----------------------------------------------- */
  return (
      <div className="auth_main_div px-0 py-0">
        {/* Back to Home Button */}
       <Link to ="/">
            <button className="backToHome"  
            onClick={() => {sessionStorage.removeItem("isLogin");sessionStorage.removeItem("forgotpassword");resetFormStates();}}> 
            <i className="pi pi-arrow-left"></i> Back</button>
         </Link>

         {/* Left Inner Division */}
        <div className="left_inner_div">
          <div className="back_img_div">
            <img src={bg_img} alt="Background img" />
          </div>
          <div className="tagline-div text-black">
            <h2>Analyze Smarter,<br />Invest Better.</h2>
          </div>
        </div>

        {/* Right Inner Division */}
        <div className="right_inner_div">
          <div className="auth_form_wrapper">
            <div className="auth_form">
              {isLogin ? (<LoginForm toggleForm={toggleForm} resetFormStates={resetFormStates} />) : (<SignupForm toggleForm={toggleForm} resetFormStates={resetFormStates} />)}
            </div>
        </div>
      </div>
    </div>
  );
};
