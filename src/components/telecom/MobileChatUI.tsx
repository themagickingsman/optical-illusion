"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChatLogic } from "@/hooks/useChatLogic";
import PhysicsScroll from "./PhysicsScroll";

interface MobileChatUIProps {
  sessionId?: string;
  theme?: 'op' | 'dark';
  mode?: 'user' | 'admin';
  adminMessages?: any[];
  onAdminSendMessage?: (text: string) => void;
  adminTypingStatus?: boolean;
  padding?: string;
}

export default function MobileChatUI({ 
  sessionId: externalSessionId, 
  theme = 'op',
  mode = 'user',
  adminMessages = [],
  onAdminSendMessage,
  adminTypingStatus = false,
  padding
}: MobileChatUIProps) {
  const [sessionId, setSessionId] = useState(externalSessionId || "");

  useEffect(() => {
    if (mode === 'admin') return; // Admin mode does not need a cookie session
    if (!externalSessionId) {
      let sid = document.cookie.split('; ').find(row => row.startsWith('chat_session='))?.split('=')[1];
      if (!sid) {
        sid = "session_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        document.cookie = `chat_session=${sid}; path=/; max-age=31536000`;
      }
      setSessionId(sid);
    }
  }, [externalSessionId, mode]);
  
  // Only execute chat logic side-effects if in user mode
  const chatLogic = useChatLogic(mode === 'user' ? sessionId : "");
  
  // Use dynamic welcome messages array from chatLogic
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  useEffect(() => {
    const messages = chatLogic.welcomeMessages?.length > 0 
      ? chatLogic.welcomeMessages 
      : (chatLogic.welcomeMessage ? [chatLogic.welcomeMessage] : ["Welcome to the secure channel."]);
      
    setLocalMessages(prevLocal => {
      return messages.map((text: string, idx: number) => {
        // Find existing message to preserve timestamp
        const existing = prevLocal.find(m => m.id === `welcome-${idx}` && m.text === text);
        return {
          id: `welcome-${idx}`,
          sender: 'admin',
          text,
          timestamp: existing ? existing.timestamp : new Date().toISOString()
        };
      });
    });
  }, [chatLogic.welcomeMessages, chatLogic.welcomeMessage]);

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const dbMessages = mode === 'admin' ? adminMessages : chatLogic.messages;
  const isAdminTyping = mode === 'admin' ? adminTypingStatus : chatLogic.isAdminTyping;

  const allMessages = dbMessages.length === 0 ? localMessages : [...localMessages, ...dbMessages];
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [allMessages.length, isAdminTyping]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    if (mode === 'admin' && onAdminSendMessage) {
      onAdminSendMessage(inputText);
    } else {
      chatLogic.sendMessage(inputText);
    }
    setInputText("");
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    if (mode === 'user') {
      chatLogic.sendTypingStatus();
    }
  };

  const isOpTheme = theme === 'op';

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      width: "100%",
      height: "100%",
      backgroundColor: 'transparent',
      color: '#fff',
      position: 'relative',
      fontFamily: '"Rubik", sans-serif'
    }}>
      <style>{`
        @keyframes springIn {
          0% {
            opacity: 0;
            transform: scale(0.6) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes typingPulse {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
      
      {/* Background Glows Removed for Performance */}

      {/* Chat Messages */}
      <PhysicsScroll className="chat-feed-scroll" padding={padding || '20px'}>
        {allMessages.map((msg, idx) => {
          const isMe = mode === 'admin' ? msg.sender === 'admin' : msg.sender === 'user';
          
          return (
          <div key={msg.id || idx} className="chat-message-group" style={{
            alignSelf: isMe ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              transformOrigin: isMe ? 'bottom right' : 'bottom left',
              animation: 'springIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
            <div style={{ position: 'relative' }}>
              <div className="chat-bubble-bg" style={{
                position: 'absolute',
                inset: 0,
                background: isMe ? 'rgba(10, 132, 255, 0.9)' : 'rgba(147, 51, 234, 0.9)',
                borderRadius: '20px',
                borderBottomRightRadius: isMe ? '4px' : '20px',
                borderBottomLeftRadius: !isMe ? '4px' : '20px',
                zIndex: 0,
                opacity: 'var(--bg-opacity, 1)',
              }} />
              
              <div className="chat-bubble-text" style={{
                position: 'relative',
                zIndex: 1,
                padding: '15px 20px',
                fontSize: "15px",
                color: "white",
                fontWeight: 'bold',
                lineHeight: "1.4",
                whiteSpace: 'pre-wrap',
                transition: 'opacity 0.1s linear',
                opacity: 'var(--text-opacity, 1)',
              }}>
                {msg.text}
              </div>
            </div>
            <div className="chat-timestamp" style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.6)', marginTop: '6px', textAlign: isMe ? 'right' : 'left', fontWeight: 'bold', opacity: 'var(--bg-opacity, 1)' }}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            </div>
          </div>
        )})}
        
        {isAdminTyping && (
          <div className="chat-message-group" style={{ alignSelf: 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ transformOrigin: 'bottom left', animation: 'springIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative' }}>
                <div className="chat-bubble-bg" style={{ position: 'absolute', inset: 0, background: 'rgba(147, 51, 234, 0.9)', borderRadius: '20px', borderBottomLeftRadius: '4px', zIndex: 0, opacity: 'var(--bg-opacity, 1)' }} />
                <div className="chat-bubble-text" style={{ position: 'relative', zIndex: 1, padding: '15px 20px', display: 'flex', gap: '4px', alignItems: 'center', height: '51px', opacity: 'var(--text-opacity, 1)' }}>
                  <span style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', animation: 'typingPulse 1.4s infinite 0s' }} />
                  <span style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', animation: 'typingPulse 1.4s infinite 0.2s' }} />
                  <span style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', animation: 'typingPulse 1.4s infinite 0.4s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div id="physics-anchor" ref={messagesEndRef} style={{ height: '10px', flexShrink: 0 }} />
      </PhysicsScroll>

      {/* Input Area */}
      <div style={{ padding: "20px", zIndex: 20, background: 'transparent', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Secure message..." 
            style={{ 
              flex: 1, 
              padding: '15px 20px', 
              borderRadius: '100px', 
              border: '1px solid rgba(255,255,255,0.2)', 
              background: 'rgba(0,0,0,0.6)', 
              color: '#fff', 
              fontSize: '16px', 
              outline: 'none',
              transition: 'border 0.2s',
            }} 
            onMouseEnter={(e) => { if (document.activeElement !== e.target) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.5)' }}
            onMouseLeave={(e) => { if (document.activeElement !== e.target) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)' }}
            onFocus={(e) => e.target.style.border = '1px solid rgba(3,255,192,0.8)'}
            onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.2)'}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: inputText.trim() ? '#00A37A' : 'rgba(0,0,0,0.6)', 
              color: inputText.trim() ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)', 
              border: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: inputText.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s' 
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
