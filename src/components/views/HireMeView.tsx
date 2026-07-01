"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChatLogic } from "@/hooks/useChatLogic";
import GameMosaic from "./GameMosaic";

export default function HireMeView() {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    let sid = document.cookie.split('; ').find(row => row.startsWith('chat_session='))?.split('=')[1];
    if (!sid) {
      sid = "session_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      document.cookie = `chat_session=${sid}; path=/; max-age=31536000`;
    }
    setSessionId(sid);
  }, []);
  
  // NDA State
  const [ndaLink, setNdaLink] = useState("");
  const [ndaStatus, setNdaStatus] = useState<"idle" | "submitting" | "success">("idle");

  // Chat State
  const { messages: dbMessages, sendMessage } = useChatLogic(sessionId);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const getStyle = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(40px)',
    transition: `all 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  const [localMessages, setLocalMessages] = useState<any[]>([
    { id: 't1', sender: 'admin', text: 'Welcome to Optical Illusions.', timestamp: new Date().toISOString() },
    { id: 't4', sender: 'admin', text: 'Tell us a little bit about your project and when you\'d like to start.', timestamp: new Date().toISOString() }
  ]);

  // Merge local tutorial messages with DB messages
  const allMessages = (tutorialStep < 1 && dbMessages.length === 0) ? localMessages : [...localMessages, ...dbMessages];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isThinking]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText("");

    if (tutorialStep === 0) {
      setTutorialStep(1);
    }
    
    // Send message to DB (this handles optimistic update automatically)
    sendMessage(text);
  };

  return (
    <div style={{ position: "relative", width: "1380px", height: "700px", display: "flex", gap: "20px", color: "#fff", zoom: 0.75, fontFamily: "var(--font-rubik)", fontWeight: 500, margin: "0 auto", ...getStyle(0.1) }}>
      
      {/* Left Pane: Game Mosaic Grid (Replaced NDA Form) */}
      <GameMosaic />

      {/* Right Wrapper */}
      <div style={{ flex: 1, position: "relative", display: "flex" }}>
        
        {/* Right Pane: Chat Interface */}
        <div className="glass-panel" style={{ flex: 1, width: "100%", background: "rgba(20, 60, 180, 0.2)", backdropFilter: "blur(25px)", WebkitBackdropFilter: "blur(25px)", borderRadius: "40px", border: "1px solid rgba(0, 255, 255, 0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        <div style={{ flex: 1, overflowY: "auto", padding: "40px", display: "flex", flexDirection: "column", gap: "15px" }}>
          {allMessages.map((msg, idx) => (
            <div key={msg.id || idx} style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              <div style={{
                background: msg.sender === 'user' ? '#0A84FF' : 'rgba(255,255,255,0.1)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.075)',
                padding: '20px 28px',
                borderRadius: '28px',
                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '28px',
                borderBottomLeftRadius: msg.sender === 'admin' ? '4px' : '28px',
                fontSize: '28px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>
              <div style={{ fontSize: '18px', color: '#0ff', marginTop: '8px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {isThinking && (
            <div style={{ alignSelf: 'flex-start', animation: 'fadeInUp 0.3s ease-out' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 18px', borderRadius: '20px', borderBottomLeftRadius: '4px' }}>
                <span className="dot-anim" style={{ animationDelay: '0s' }}>.</span>
                <span className="dot-anim" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="dot-anim" style={{ animationDelay: '0.4s' }}>.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: "25px 40px 50px 40px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", gap: "10px", background: "rgba(0, 0, 0, 0.15)", padding: "5px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") handleSendMessage();
              }}
              placeholder="Type your message..."
              style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: "28px", padding: "20px 28px", outline: "none" }}
            />
            <button
              onClick={handleSendMessage}
              style={{ background: "#03FFC0", color: "#000", border: "none", borderRadius: "100px", padding: "0 45px", fontSize: "28px", fontWeight: "bold", cursor: "pointer", transition: "transform 0.1s" }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
      
    {/* Floating Social Pill Buttons */}
    <div style={{ position: "absolute", bottom: "-165px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "25px", zIndex: 100 }}>
        <a href="https://discord.gg/rCXJz6Wgc" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", textDecoration: "none", backdropFilter: "blur(20px)" }}>
          <svg viewBox="0 0 127.14 96.36" width="40" height="40" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.58,67.58,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.09,53,91.08,65.69,84.69,65.69Z"/></svg>
        </a>
        <a href="https://github.com/themagickingsman" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", textDecoration: "none", backdropFilter: "blur(20px)" }}>
          <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
        <a href="https://x.com/magickingsman" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", textDecoration: "none", backdropFilter: "blur(20px)" }}>
          <svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
        </a>
    </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .dot-anim {
          display: inline-block;
          font-weight: bold;
          animation: pulseDot 1.4s infinite ease-in-out both;
        }
        .social-btn {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .social-btn:hover {
          transform: translateY(-8px) scale(1.15);
          box-shadow: 0 15px 30px rgba(3, 255, 192, 0.4);
          border-color: rgba(3, 255, 192, 0.8) !important;
          background: rgba(255, 255, 255, 0.15) !important;
          color: #03FFC0 !important;
        }
      `}} />
    </div>
  );
}
