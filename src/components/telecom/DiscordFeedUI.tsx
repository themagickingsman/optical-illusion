"use client";

import React, { useState, useEffect, useRef } from "react";
import PhysicsScroll from "./PhysicsScroll";

interface DiscordMessage {
  id: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  attachments: { url: string; proxy_url: string; width: number; height: number; content_type: string }[];
}

interface DiscordFeedUIProps {
  channelType: 'op' | 'cr';
}

export default function DiscordFeedUI({ channelType }: DiscordFeedUIProps) {
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/discord/messages?channel=${channelType}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setMessages(data);
        setErrorMsg(null);
      } else {
        setErrorMsg(data.error || 'Unknown error occurred while fetching Discord messages.');
      }
    } catch (e) {
      console.error("Failed to load discord messages", e);
      setErrorMsg(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [channelType]);

  useEffect(() => {
    // If you want Cosmic Racers to scroll down but not OP, we can add logic here later.
    // For now, let it start naturally at the top.
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;
    
    setIsSending(true);
    const messageToSend = inputValue;
    setInputValue(''); // Optimistically clear input
    
    try {
      await fetch('/api/discord/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelType, content: messageToSend })
      });
      // Fetch fresh messages immediately after sending
      await fetchMessages();
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Failed to send message to Discord", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      width: "100%",
      height: "100%",
      backgroundColor: 'transparent',
      color: '#fff',
      position: 'relative',
      fontFamily: "var(--font-rubik), sans-serif"
    }}>
      <style>{`
        @keyframes springIn {
          0% { opacity: 0; transform: scale(0.6) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      
      <PhysicsScroll className="discord-feed-scroll">
        {loading && <div style={{ textAlign: 'center', marginTop: '40px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>Connecting to Discord...</div>}
        
        {errorMsg && (
          <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: '15px', color: 'white', display: 'flex', flexDirection: 'column', gap: '10px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#ff4444' }}>API Error</div>
            <div style={{ fontSize: '13px', opacity: 0.8, color: '#ffaaaa' }}>
              {errorMsg}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '10px' }}>
              Check your Vercel logs or network tab for more details.
            </div>
          </div>
        )}

        {!loading && !errorMsg && messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(50,255,50,0.2)', borderRadius: '15px', color: 'white', display: 'flex', flexDirection: 'column', gap: '10px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#44ff44' }}>Channel Connected!</div>
            <div style={{ fontSize: '13px', opacity: 0.8 }}>
              This Discord channel is currently empty.
              <br/><br/>
              Type a message below or in the Discord app to get started!
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className="discord-message-group" style={{
            alignSelf: 'flex-start',
            maxWidth: '90%',
            transformOrigin: 'bottom left',
            animation: 'springIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            gap: '10px'
          }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0, opacity: 'var(--text-opacity, 1)' }}>
              <img src={msg.author.avatar} alt={msg.author.username} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
            </div>

            {/* Message Content */}
            <div style={{ position: 'relative', flex: '0 1 auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div className="chat-bubble-bg" style={{
                position: 'absolute',
                inset: 0,
                background: idx === 0 ? 'rgba(88, 101, 242, 0.5)' : 'rgba(88, 101, 242, 0.9)', // 50% for top post
                borderRadius: '20px',
                borderTopLeftRadius: '4px', // Standard Discord speech bubble look
                backdropFilter: 'blur(10px)',
                zIndex: 0,
                opacity: 'var(--bg-opacity, 1)',
              }} />
              
              <div className="chat-bubble-text" style={{
                position: 'relative',
                zIndex: 1,
                padding: '15px 20px',
                opacity: 'var(--text-opacity, 1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: "15px", color: "white", fontWeight: 'bold' }}>{msg.author.username}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(0, 0, 0, 0.6)' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {msg.content && (
                  <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", lineHeight: "1.4", whiteSpace: 'pre-wrap', fontWeight: '500', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                      if (part.match(/(https?:\/\/[^\s]+)/)) {
                        const shortLink = part.length > 35 ? part.substring(0, 32) + '...' : part;
                        return (
                          <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: '#03FFC0', textDecoration: 'underline', wordBreak: 'break-all' }}>
                            {shortLink}
                          </a>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                )}

                {msg.attachments.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {msg.attachments.map((att, i) => (
                      att.content_type?.startsWith('image/') && (
                        <img key={i} src={att.url} alt="Attachment" style={{ maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div id="physics-anchor" ref={messagesEndRef} style={{ height: '10px', flexShrink: 0 }} />
      </PhysicsScroll>

      {/* Input Area (Replaces Footer) */}
      <div style={{ padding: "20px", zIndex: 20, background: 'transparent', position: 'sticky', bottom: 0 }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Chat in Discord..." 
            disabled={isSending}
            style={{ 
              flex: 1, 
              padding: '15px 20px', 
              borderRadius: '100px', 
              border: '1px solid rgba(255,255,255,0.2)', 
              background: 'rgba(0,0,0,0.6)', 
              color: '#fff', 
              fontSize: '16px', 
              backdropFilter: 'blur(10px)',
              outline: 'none',
              transition: 'border 0.2s',
              opacity: isSending ? 0.5 : 1
            }} 
            onMouseEnter={(e) => { if (document.activeElement !== e.target) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.5)' }}
            onMouseLeave={(e) => { if (document.activeElement !== e.target) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)' }}
            onFocus={(e) => e.target.style.border = '1px solid rgba(88,101,242,0.8)'}
            onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.2)'}
          />
          <button 
            type="submit" 
            disabled={isSending || !inputValue.trim()}
            style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: inputValue.trim() && !isSending ? '#4752C4' : 'rgba(255,255,255,0.1)', 
              color: inputValue.trim() && !isSending ? 'rgba(0,0,0,0.6)' : '#fff', 
              border: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: inputValue.trim() && !isSending ? 'pointer' : 'default',
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
