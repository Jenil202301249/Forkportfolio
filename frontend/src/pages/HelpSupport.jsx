import React, { useState ,useEffect } from 'react';
import axios from 'axios';
import Navbar from "../components/Navbar.jsx";
import {Sidebar} from "../components/Sidebar.jsx";
import Footer from "../components/Footer.jsx";
// UPDATED: Importing your specific icons from their respective libraries
import {  FaRobot } from 'react-icons/fa';
import { HiOutlineBookOpen } from "react-icons/hi";
import { BsBarChartLineFill } from "react-icons/bs";
import { AiOutlineSetting } from "react-icons/ai";
import './HelpSupport.css';
axios.defaults.withCredentials = true;

// --- Data for our detailed help topics (with your icons) ---
const helpContent = {
  'getting-started': {
    icon: <HiOutlineBookOpen />,
    title: 'Getting Started with InsightStox',
    body: (
      <>
        <p>Welcome to InsightStox - your intelligent investment companion. Follow these steps to get started:</p>
        <ol>
          <li>Create your account using email or Google login.</li>
          <li>Complete your risk profile to personalize recommendations.</li>
          <li>Add your first stocks or import existing holdings into your portfolio.</li>
          <li>Use your dashboard to monitor portfolio growth and insights.</li>
          <li>Enable AI suggestions and alerts for real-time market guidance.</li>
        </ol>
        <button className="btn-primary">Explore My dashboard</button>
      </>
    )
  },
  'build-portfolio': {
    icon: <BsBarChartLineFill  />,
    title: 'How to build & Manage Portfolio',
    body: (
      <>
        <p>InsightStox allows you to manage investments efficiently. Here's how you can build your portfolio:</p>
        <ol>
          <li>Click My Portfolio → Add Stock → Enter stock name and quantity.</li>
          <li>Track your performance with live market data and visuals.</li>
          <li>Use the Compare Stocks feature to evaluate new opportunities.</li>
          <li>Review diversification charts to maintain a balanced risk profile.</li>
        </ol>
        <p><strong>Tip:</strong> Keep updating your portfolio regularly to receive accurate insights.</p>
        <button className="btn-primary">Go to Portfolio</button>
      </>
    )
  },
  'ai-suggestions': {
    icon: <FaRobot />,
    title: 'Understanding AI-Based Suggestions',
    body: (
      <>
        <p>The AI engine analyses your holdings and market trends to suggest improvements in diversification, risk balance, and growth potential.</p>
        <ul>
          <li><strong>Conservative:</strong> Focus on stable, low-risk assets.</li>
          <li><strong>Moderate:</strong> Balanced between growth and security.</li>
          <li><strong>Aggressive:</strong> Targets high-risk, high-reward opportunities.</li>
        </ul>
        <p>Each suggestion includes a confidence score and supporting data references for transparency.</p>
        <button className="btn-primary">View My AI Insights</button>
      </>
    )
  },
  'troubleshooting': {
    icon: <AiOutlineSetting />,
    title: 'Troubleshooting common issues',
    body: (
      <>
        <ul>
          <li>Data not updating? Check your internet and verify that the API status is active.</li>
          <li>AI recommendations not loading? Ensure the "Allow AI to analyse data" toggle is ON in your Data & Privacy settings.</li>
          <li>Can't log in? Use the "Forgot Password" option or contact support.</li>
          <li>Missing portfolio values? Re-sync your brokerage or manually refresh data.</li>
        </ul>
        <button className="btn-primary">Open Support</button>
      </>
    )
  }
};

function HelpTopicModal({ topic, onClose }) {
 
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  const content = helpContent[topic];
  if (!content) return null;
   return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detailed-content-card" onClick={(e) => e.stopPropagation()}>
        <h3>{content.icon} {content.title}</h3>
        {content.body}
      </div>
    </div>
  );
}



// Component for the main view with functional forms
function MainHelpView({ onTopicSelect }) {
  const [contactMessage, setContactMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

// Backend contact form handler  

const handleContactSubmit = async (event) => {
    event.preventDefault();
    if (!contactMessage.trim()) return alert('Please enter a message.');
    
    try {
      // Backend code (NOT ACTIVE):
      const response = await axios.post(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/sendUserQuery", 
      {query:contactMessage},
      {withCredentials:true}
    );
     
     const data = response.data;
      if (!data.success||!data) {
          console.warn('Failed to submit ticket.');
          alert('Something went wrong. Try again later.');
          return;
        }
      alert('Support ticket submitted successfully!');
      setContactMessage('');

    } catch (error) {
      console.error('Contact form error:', error);
      alert('Could not submit ticket. Please try again later.');
    }

};
  
//Backend feedback form handler
const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    if (!feedbackMessage.trim()) return alert('Please enter a feedback.');
    
    try {
      const response = await axios.post(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/sendUserSuggestion", 
        {
          suggestion:feedbackMessage
        },
        {
          withCredentials:true
        });
    
      const data = response.data;
      if (!data.success||!data) {
          console.warn('Failed to send feedback.');
          alert('Something went wrong. Try again later.');
          return;      
        }

      // Backend call was successful
      alert('Thank you for your feedback!');
      setFeedbackMessage('');

    } catch (error) {
      console.error('Feedback form error:', error);
      alert('Could not send feedback. Please try again later.');
    }

};


  return (
    <>
      <section className="quick-help-section">
        <h2>Help & Support</h2>
        <h3>Quick Help</h3>
        <p>Access frequently asked questions, tutorials, and beginner guides to help you make the most of InsightStox.</p>
        <div className="quick-help-grid">
          <button onClick={() => onTopicSelect('getting-started')} className="quick-help-btn"><HiOutlineBookOpen className='quick-help-icon'/> Getting Started Guide</button>
          <button onClick={() => onTopicSelect('build-portfolio')} className="quick-help-btn"><BsBarChartLineFill className='quick-help-icon'/> How to Build Portfolio</button>
          <button onClick={() => onTopicSelect('ai-suggestions')} className="quick-help-btn"><FaRobot className='quick-help-icon'/> Understanding AI Suggestions</button>
          <button onClick={() => onTopicSelect('troubleshooting')} className="quick-help-btn"><AiOutlineSetting className='quick-help-icon'/> Troubleshooting common issues</button>
        </div>
      </section>

      {/* FAQ, Contact, and Feedback sections remain here as before... */}
      <section className="help-section">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-item">
          <p className="faq-question">Q: How does the AI generate portfolio suggestions?</p>
          <p className="faq-answer">A: It analyses your holdings, diversification, and risk profile to generate tailored insights.</p>
          <p className="faq-question">Q: Can I delete my account and data permanently?</p>
          <p className="faq-answer">A: Yes, from the Data & Privacy section. Your data will be removed within 30 days of request.</p>
          <p className="faq-question">Q: Why am I not receiving alerts?</p>
          <p className="faq-answer">A: Check your Preferences section to ensure alerts are enabled and your email is verified.</p>
        </div>
      </section>
<section className="help-section">
        <h3>Contact Support</h3>
        <form className="support-form" onSubmit={handleContactSubmit}>
        <p>Need further assistance? Send us your query and our team will get back to you within 24 hours.</p>
          <label htmlFor="message-input" >Your Message</label>
          <textarea
            id="message-input"
            placeholder="Describe your issue or question here..."
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
          ></textarea>
          <button type="submit" className="btn-primary">Submit Ticket</button>
            <p className="support-contact-info">Support Email: support@insightstox.com | Helpline:+91-98765-43210</p>
        </form>
      </section>
      
      <section className="help-section">
        <h3>Feedback</h3>
        <form className="support-form" onSubmit={handleFeedbackSubmit}>
        <p>Help us improve InsightStox by sharing your ideas or features suggestions.</p>
          <label htmlFor="feedback-input" className="visually-hidden">Suggest a feature or report an issue...</label>
          <textarea
            id="feedback-input"
            placeholder="Suggest a feature or report on issue..."
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
          ></textarea>
          <button type="submit" className="btn-primary">Send feedback</button>
        </form>
      </section>
    </>
  );
}


// --- The Parent Help & Support Component ---

export const HelpSupport = () => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [darkMode, setDarkMode] = useState(true); 
  return (
    <div className="HelpSupportLayout">
       <Navbar darkMode={darkMode} setDarkMode={setDarkMode} pageType="help-support"
                profileData={{ name: "Ayush Dhamecha", email: "ma**@gmail.com" }} />
      
      <div className="HelpSupportBody">
       
        <Sidebar primaryData={{ name: "Ayush Dhamecha", email: "ma**@gmail.com" }}/>
       
        <main className="HelpSupportContainer">
          <MainHelpView onTopicSelect={setSelectedTopic} />
          {selectedTopic && (
            <HelpTopicModal topic={selectedTopic} onClose={() => setSelectedTopic(null)} />
          )}
        </main>
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
}



