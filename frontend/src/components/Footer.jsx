import React from "react";
import github_logo from "../assets/github_logo.png";
import "./Footer.css";
import logofooter from "../assets/logofooter-navbar.svg";
import logotext from "../assets/logotext.svg";
const Footer = ({ darkMode ,navigationLinks=[],legalLinks=[] }) => {
  return (
    <div className="footer_div" >
      <div className="footer_text_part">
        <div className="footer_upper_text_part">
          <div className="footer_first_column column_div">
            <div className="footer_web">
              
                <img src={logofooter} alt="Website logo" />
            </div>
            <div className="textcolumn">
              <div className="logotext">
                <img src={logotext} alt="InsightStox text logo" />
              </div>
              <div className="tagline_text">
                <p><>Analyze Smarter,<br/>Invest Better</></p>
              </div>
             
              <div className="github_logo">
                <img src={github_logo} alt="Github logo" />
              </div>
          </div>
          </div>

          <div className="footer_second_column column_div">
            <div className="navigation_text">
              <h2>NAVIGATION</h2>
            </div>
            {navigationLinks.map((link) => (
              <div className={`${link.className || "nav_link"}`}>
                <a key={link.text} href={link.href}>{link.text}</a>
              </div>
            ))}
          </div>

          <div className="footer_third_column column_div">
            <div className="legal_text">
              <h2>LEGAL</h2>
            </div>
             {legalLinks.map((link) => (
              <div className={`${link.className || "nav_link"}`}>
                <a key={link.text} href={link.href}>{link.text}</a>
              </div>
            ))}
          </div>
        </div>
        <div className="footer_below_text_part">
          <div className="rights_text">
            <p><>© 2025 InsightStox. All Rights Reserved. This platform is for demonstration purposes only. All financial data and <br/>AI-powered suggestions are for informational purposes and should not be considered financial advice.</></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
