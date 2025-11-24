import React, { useState, useEffect } from "react";
import "./Home.css";
import home_background from "../assets/home-page-bg.jpg";
import dashboard_background from "../assets/desh_board.png";
import Footer from "../components/Footer.jsx";
import upArrow from "../assets/upArrow.png"
import optimize_act from "../assets/Optimize_Act.png";
import trackPerformace from "../assets/trackPerformance.png";
import addPortfolio from "../assets/addPortfolio.png";
import creatACC from "../assets/creatAcc.png";
import downArrow from "../assets/downArrow.png"
import featurelogo1 from "../assets/featuredivlogo1.png"
import featurelogo2 from "../assets/featuredivlogo2.png"
import featurelogo3 from "../assets/featuredivlogo3.png"
import featurelogo4 from "../assets/featuredivlogo4.png"
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import { useAppContext } from "../context/AppContext";

export const Home = () => {

  /*-----------------------------------State Varibles ------------------------------------------------------ */
  const [openIndex, setOpenIndex] = useState(0);
  const { darkMode, setDarkMode } = useAppContext();
  const [expandedCard, setExpandedCard] = useState(null);
  
  /*-----------------------------------Functions ------------------------------------------------------ */
  const { ensureAuth } = useAppContext();
  // Function to toggle the arrow direction and show/hide answer
  function toggleArrow(index) { 
    setOpenIndex(openIndex === index ? 0 : index)
  }

  function CardClick(cardNumber) {
    if (window.innerWidth <= 768) return; 
    setExpandedCard(cardNumber);
  }

  /*----------------------------------------useEffect----------------------------------------------------------*/
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
        }, 30000);
  
        // When user navigates back (browser back button / swipe-back), run the same
        // cleanup that the Back button does (clear session flags / reset forms).
        return () => {
          clearInterval(intervalId);
        };
      }, [navigate, ensureAuth]);

  /*----------------------------------------JSX Return Statement----------------------------------------------------------*/
  return (

      <div className="home-main">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} pageType="/" />

        <div className="main_page">

          {/* ---------------------------------------------------------Home-page-starting-page-------------------------------------------------------------------------- */}
          <div className="home-body">

            {/* Home-background Image */}
            <div className="home_img">
              <img src={home_background} alt="Home Background" />
            </div>

            {/* Home-middle Text Part */}
            <div className="middle_text_part">

              {/* Title */}
              <div className="title"  data-aos="zoom-in">
                <h1><>Go Beyond Guesswork.<br />Invest with <span style={{color : "#00C853"}}>Insight</span>.</></h1>
              </div>
              
              {/* Subtitle */}
              <div className="subtitle" data-aos="zoom-in">
                <p><>Empower your financial decisions with our platform's <br /> advanced analytics and intelligent forecasting.</></p>
              </div>

              {/* Get Started Button */}
              <Link to="/auth" onClick={() => {sessionStorage.setItem("isLogin", "true");sessionStorage.setItem("forgotpassword", "false");}}>
                <div className="get_started_btn" data-aos="zoom-in">
                  <button>Get Started</button>
                </div>
              </Link>
            </div>
          </div>
      


          {/* ---------------------------------------------------------Home-page-DashboardImage-section-------------------------------------------------------------------------- */}
        
          <div className="dash_board_template" data-aos="fade-up">
            <h1>Your entire portfolio,beautifully visualized.</h1>
            <img src={dashboard_background} alt="Dashboard Background" />
          </div>

          {/* ---------------------------------------------------------Home-page-Features-section-------------------------------------------------------------------------- */}
          
          <div className="features_div" id="feature" data-aos="fade-up">

            {/* feature section title Div */}
            <div className="features_title_div">
              <h1><>Everything You Need to Invest <br /> Smarter</></h1>
            </div>

            <div className={`features_section ${expandedCard ? 'expanded' : ''}`} >

            {/* Feature card 1 div */}
           <div className={`features_card ${expandedCard === 1 ? 'expanded' : expandedCard && expandedCard !== 1 ? 'hidden' : ''}`} onClick={() =>CardClick(1)}>
              {/* feature card 1 title div*/}
              <div className="logo-title">
                <div className="feature_img">
                  <img src={featurelogo1} alt="logo" />
                </div>
                <div className="feature_title">
                  <h2>Dynamic Portfolio Tools</h2>
                </div>
              </div>
              {/* feature card 1 text */}
              <div className="feature_para">
                <p>Your portfolio isn't static, and your tools shouldn't be either. Model potential changes, analyze your diversification, and rebalance your assets with powerful, easy-to-use tools that help you stay in control.</p>
              </div>
                {expandedCard === 1 && (
              <div className="see_less">
                      <button onClick={(e) => {e.stopPropagation(); setExpandedCard(null);}}>See less</button>
              </div>
                )}
            </div>

          {/* Feature card 2 div  */}
           <div className={`features_card ${expandedCard === 2 ? 'expanded' : expandedCard && expandedCard !== 2 ? 'hidden' : ''}`} onClick={() =>CardClick(2)}>
              {/* feature card 2 title div*/}
              <div className="logo-title">
                <div className="feature_img">
                  <img src={featurelogo2} alt="logo" />
                </div>
                <div className="feature_title">
                  <h2>Unified Dashboard</h2>
                </div>
              </div>
              {/* feature card 2 text */}
              <div className="feature_para">
                <p>Stop juggling spreadsheets and multiple apps. See your entire financial picture, across all assets, in one clean, real time view. Track your net worth and performance effortlessly.</p>
              </div>
                {expandedCard === 2 && (
                  <div className="see_less">
                      <button onClick={(e) => {e.stopPropagation(); setExpandedCard(null);}}>See less</button>
                  </div>
                )}
              </div>


              {/* Feature card 3 div  */}
            <div className={`features_card ${expandedCard === 3 ? 'expanded' : expandedCard && expandedCard !== 3 ? 'hidden' : ''}`} onClick={() =>CardClick(3)}>
              {/* Feature card 3 title*/}
              <div className="logo-title">
                <div className="feature_img">
                  <img src={featurelogo3} alt="log"/>
                </div>
                <div className="feature_title">
                  <h2>Smart Watchlist</h2>
                </div>
              </div>

                {/* Feature card 3 text */}
                <div className="feature_para">
                  <p>Keep potential investments organized and ready for analysis. Track key metrics for stocks you're interested in, all in one place, so you can act with confidence when the time is right.</p>
                </div>
                {expandedCard === 3 && (
                  <div className="see_less">
                      <button onClick={(e) => {e.stopPropagation(); setExpandedCard(null);}}>See less</button>
                  </div>
                )}
              </div>


              {/* Feature card 4 div  */}
            <div className={`features_card ${expandedCard === 4 ? 'expanded' : expandedCard && expandedCard !== 4 ? 'hidden' : ''}`} onClick={() =>CardClick(4)}>
              {/* Feature card 4 Title div */}
              <div className="logo-title">
                <div className="feature_img">
                  <img src={featurelogo4} alt="logo" />
                </div>
                <div className="feature_title">
                  <h2>Intelligent Insights</h2>
                </div>
              </div>

              {/* Feature card 4 text */}
              <div className="feature_para">
                  <p>Go beyond raw data. Our AI-powered "Intellisense" analyzes your portfolio to highlight hidden risks, uncover new opportunities, and provide actionable suggestions so you can invest with confidence, not guesswork.</p>
              </div>
                {expandedCard === 4 && (
                  <div className="see_less">
                      <button onClick={(e) => {e.stopPropagation(); setExpandedCard(null);}}>See less</button>
                  </div>
                )}
              </div>
                
            </div>
          </div>


          {/* ---------------------------------------------------------Home-page-How-it-works-section-------------------------------------------------------------------------- */}
          <div id="HowItWorks" className="powerful_features" data-aos="fade-up">

            {/* How it works title Div */}
            <div className="p_features_title_div">
              <h1><>Unlock powerful insights in four <br/> simple steps.</></h1>
            </div>

            {/* How it works section divs */}
            <div className="powerful_features_section" data-aos="fade-up">

              {/* Div 1 */}
              <div className="p_features_card_1 p_features_card">
                <div className="p_feature_img">
                  <img src={creatACC} alt="Creat account img"/>
                </div>
                <div className="p_feature_text_div">
                  <h2>1. Create Your Account</h2>
                  <p>Create your secure account to access your personalized dashboard.</p>
                </div>
              </div>

              {/* Div 2 */}
              <div className="p_features_card_2 p_features_card">
                <div className="p_feature_img">
                  <img src={addPortfolio} alt="add portfolio logo"/>
                </div>
                <div className="p_feature_text_div">
                  <h2>2. Add Portfolio</h2>
                  <p>Connect your brokerage or manually add assets to build your portfolio</p>
                </div>
              </div>

              {/* Div 3 */}
              <div className="p_features_card_3 p_features_card">
                <div className="p_feature_img">
                  <img src={trackPerformace} alt="portfolio Tracking log"/>
                </div>
                <div className="p_feature_text_div">
                  <h2>3. Track Performance</h2>
                  <p>Monitor real-time performance with clear charts and key metrics.</p>
                </div>
              </div>

              {/* Div 4 */}
              <div className="p_features_card_4 p_features_card">
                <div className="p_feature_img">
                  <img src={optimize_act} alt="optimize & act logo" />
                </div>
                <div className="p_feature_text_div">
                  <h2>4. Optimize & Act</h2>
                  <p>Use insights to optimize your portfolio and make informed trades.</p>
                </div>
              </div>
  
            </div>
          </div>


          {/* ---------------------------------------------------------Home-page-FAQs-section-------------------------------------------------------------------------- */}
          <div id="FAQs" className="FAQs_div" data-aos="fade-up" data-aos-duration="1000" data-aos-offset="100">

            {/* FAQ Section Title Div */}
            <div className="FAQ_title">
              <h1>Frequently Asked Questions</h1>
            </div>

            {/* FAQ Questions and Answers Div */}
            <div className="question_div">

              {/* Div 1 */}
              <div className="que1 que">
                {/* Question */}
                <div className="innerBoxOfQue">
                  <h2>Q : Is my financial data secure?</h2>
                  <div className="arrow_img_div" onClick={() => toggleArrow(1)}>
                    <img  src={openIndex==1 ? upArrow : downArrow} alt=" Arrow logo"/>
                  </div>
                </div>
                {/* Answer */}
                <p className="answer_text" style={{display : openIndex==1 ? "block" : "none"}}>Absolutely. We use bank-level encryption and follow industry best practices to ensure your data is always protected. We will never share your personal or financial data without your explicit consent.</p>
              </div>

              {/* Div 2 */}
              <div className="que2 que">
                {/* Question */}
                <div className="innerBoxOfQue">
                  <h2>Q : Is InsightStox a financial advisor?</h2>
                  <div className="arrow_img_div" onClick={() => toggleArrow(2)}>
                    <img  src={openIndex==2 ? upArrow : downArrow} alt=" Arrow logo"/>
                  </div>
                </div>
                {/* Answer */}
                <p className="answer_text" style={{display : openIndex==2 ? "block" : "none"}}>InsightStox offers a powerful free plan that includes a dashboard, portfolio tracking, and a limited number of AI insights per month. For unlimited insights, advanced analytics, and priority support, you can upgrade to our Pro plan. You can find detailed information on our pricing page.</p>
              </div>

              {/* Div 3 */}
              <div className="que3 que">
                {/* Question */}
                <div className="innerBoxOfQue">
                  <h2>Q : What is the pricing for InsightFolio?</h2>
                  <div className="arrow_img_div" onClick={() => toggleArrow(3)}>
                    <img  src={openIndex==3 ? upArrow : downArrow} alt=" Arrow logo"/>
                  </div>
                </div>
                {/* Answer */}
                <p className="answer_text" style={{display : openIndex==3 ? "block" : "none"}}>Our AI analyzes market data from trusted sources, including real-time price feeds, historical performance, and key financial metrics. It uses this data to identify trends and patterns, generating insights based on established investment principles to help you optimize your portfolio.</p>
              </div>

              {/* Div 4 */}
              <div className="que4 que">
                {/* Question */}
                <div className="innerBoxOfQue">
                  <h2>Q : Which brokerages can I connect?</h2>
                  <div className="arrow_img_div" onClick={() => toggleArrow(4)}>
                    <img  src={openIndex==4 ? upArrow : downArrow} alt=" Arrow logo"/>
                  </div>
                </div>
                {/* answer */}
                <p className="answer_text" style={{display : openIndex==4 ? "block" : "none"}}>We are constantly expanding our integrations. Currently, we support connections with major brokerages like Zerodha, Groww, and Upstox, with more coming soon. You can also add your holdings manually.</p>
              </div>

              {/* Div 5 */}
              <div className="que5 que">
                {/* Question */}
                <div className="innerBoxOfQue">
                  <h2>Q : How does the AI generate its suggestions?</h2>
                  <div className="arrow_img_div" onClick={() => toggleArrow(5)}>
                    <img  src={openIndex==5 ? upArrow : downArrow} alt=" Arrow logo"/>
                  </div>
                </div>
                {/* answer */}
                <p className="answer_text" style={{display : openIndex==5 ? "block" : "none"}}>The AI analyzes market data from trusted sources, including real-time price feeds, historical performance, and key financial metrics. It uses this data to identify trends and patterns, generating insights based on established investment principles to help you optimize your portfolio.</p>
              </div>  
            </div>
          </div>

          {/* ---------------------------------------------------------Home-page-Signup------------------------------------------------------------------------- */}
          <div className="signup_div" data-aos="fade-up">
            <div className="title_signup_Title">
              <h1><>Ready to Take Control of Your <br/>Investments ?</></h1>
              <p>Sign up for free and start making smarter, data-backed decisions today.</p>
            </div>
            <Link to ={`/auth`} onClick={() => {sessionStorage.setItem("isLogin", "false"); sessionStorage.setItem("forgotpassword", "false");}}>
            <div className="signup_btn">
              <button>Sign Up Now</button>
            </div>           
            </Link>
          </div>

        {/* ---------------------------------------------------------Home-page-Footer------------------------------------------------------------------------- */}
        <Footer darkMode={darkMode}  
                navigationLinks={[
                    { text: "Features", href: "#feature" },
                    { text: "FAQs", href: "#FAQs" },
                    { text: "How It Works?", href: "#HowItWorks" },
                ]}
                legalLinks={[
                    { text: "Privacy Policy", href: "#privacy" },
                    { text: "Terms Of Service", href: "#terms" },
                ]}/>
        </div>
      </div>
  );
};
