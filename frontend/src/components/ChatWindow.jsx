import React,{useEffect,useRef, useState} from "react";
import "../components/ChatWindow.css";
import axios from "axios";
// Renders Markdown text (like **bold**, _italic_, code blocks) as proper HTML inside React.
import ReactMarkDown from 'react-markdown';
// A plugin for react-markdown that adds GitHub-style Markdown features (tables, task lists, strikethrough, autolinks).
import remarkGfm from 'remark-gfm';
// Convert emoji shortnames like :rocket: to Unicode emoji
import remarkEmoji from 'remark-emoji';
const ChatWindow = () => {
    const [messages,setMessages] = useState([]);
    const [input,setInput] = useState("");
    const [chatStart,setChatStart] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(()=>{
        chatEndRef.current?.scrollIntoView({behavior : "smooth"});
    },[messages])
    
    const handleSend = async ()=>{
        const text = input.trim();
        if(!text)return;
        setInput("");
        const typingMsg = { id: "typing", text: "Bot is typing... ", sender: "bot", typing: true };
        const userMsg = {id:Date.now(),text, sender:"user"};
        setMessages((prev) => [...prev, userMsg, typingMsg]);
        try{
                const res = await axios.post(import.meta.env.VITE_BACKEND_LINK + "/api/v1/ai-insight/sendMessage",{
                message : userMsg,
            });
            console.log("Response from backend:", res);
            const markdownText = res.data.reply;
            console.log("Backend markdownText:", markdownText);
            const replyText = <ReactMarkDown remarkPlugins={[remarkGfm, remarkEmoji]}>{markdownText}</ReactMarkDown>;
            setMessages((prev) => [...prev.filter((msg)=>msg.id !== "typing"), { id: Date.now(), text: replyText, sender: 'bot' }]);
        }catch(err){
            console.error("Error sending message:", err);
            setMessages((prev) => [...prev.filter((msg) => msg.id !== "typing"), { 
                text: err.message, 
                sender: 'bot',
                typing: false
                }]);
        }
    }
    const handleKeyDown = (e) => {
        if(e.key === "Enter") handleSend();
    }

  return (
    <div className="chat-window">    
    {!chatStart && (
        <div className="chat-welcome-message">
                    {/* here take name from backend */}
                    <h2>Hello, <span className="user-name">Ayush!</span></h2>
                    <h3>How can I help you Today?</h3>
        </div>
    )}
        <div className="chat-messages">
                {messages.map((msg) => (
                    <div className={`chat-bubble ${msg.sender}-bubble ${msg.typing ? "typing" : ""}`} key={msg.id}>
                        <div>{msg.text}</div>
                    </div>
                ))}
                <div ref={chatEndRef} />
        </div>

        <div className="chat-input-area">
                <input type="text" value={input} onChange={(e) => {setInput(e.target.value),setChatStart(true)}} onKeyDown={handleKeyDown} placeholder="Type a message..." className="chat-input"/>
                <button className="send-btn" onClick={handleSend}>Send</button>
        </div>
    </div>
  )
}

export default ChatWindow