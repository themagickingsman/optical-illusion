"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChatLogic } from "@/hooks/useChatLogic";
import PhysicsScroll from "./PhysicsScroll";
import { useVideoStore } from '@/store/useVideoStore';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import Image from 'next/image';

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || '5hwYpLrCsAkukYs4poS79fObIfonvtBd');

// --- UGCS ASSET KEY RESOLUTION MAP (V1 Local Dictionary) ---
const PHRASE_TO_ASSET_KEY: Record<string, string> = {
  'godiswithme': 'engine_core_admin',
  '/sudo op-admin': 'engine_core_admin',
};

const ASSET_KEY_ACTIONS: Record<string, any> = {
  'engine_core_admin': {
    type: 'EXECUTE_COMMAND',
    action: () => { window.location.href = '/cms?tab=mobile-admin'; }
  },
};
// -------------------------------------------------------------

interface MobileChatUIProps {
  sessionId?: string;
  theme?: 'op' | 'dark';
  mode?: 'user' | 'admin';
  adminMessages?: any[];
  onAdminSendMessage?: (text: string) => void;
  adminTypingStatus?: boolean;
  padding?: string;
  onAdminDeleteMessage?: (messageId: string) => void;
}

export default function MobileChatUI({ 
  sessionId: externalSessionId, 
  theme = 'op',
  mode = 'user',
  adminMessages = [],
  onAdminSendMessage,
  adminTypingStatus = false,
  padding,
  onAdminDeleteMessage
}: MobileChatUIProps) {
  const [sessionId, setSessionId] = useState(externalSessionId || "");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

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
  const chatLogic = useChatLogic(mode === 'user' ? sessionId : "", false);
  
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const [pickerWidth, setPickerWidth] = useState(300);

  useEffect(() => {
    if (pickerContainerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setPickerWidth(Math.max(280, entry.contentRect.width - 40));
        }
      });
      observer.observe(pickerContainerRef.current);
      return () => observer.disconnect();
    }
  }, [showGifPicker, showEmojiPicker]);

  useEffect(() => {
    if (lightboxImage) {
      document.body.classList.add('media-active');
    } else {
      document.body.classList.remove('media-active');
    }
  }, [lightboxImage]);

  const dbMessages = mode === 'admin' ? adminMessages : chatLogic.messages;
  const isAdminTyping = mode === 'admin' ? adminTypingStatus : chatLogic.isAdminTyping;

  // Cap the messages shown in the view to 25 max
  const allMessages = (dbMessages.length === 0 ? localMessages : [...localMessages, ...dbMessages]).slice(-25);

  // Scroll to bottom when messages array changes length
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [allMessages.length, isAdminTyping]);

  // Use ResizeObserver to catch dynamically loading images and ensure we stay at the bottom
  useEffect(() => {
    if (!messagesEndRef.current) return;
    const parent = messagesEndRef.current.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    // Secret backdoor to the CMS using UGCS Asset Key Resolution
    if (mode === 'user') {
      const matchedKey = PHRASE_TO_ASSET_KEY[text.toLowerCase()];
      if (matchedKey) {
        const payload = ASSET_KEY_ACTIONS[matchedKey];
        if (payload && payload.type === 'EXECUTE_COMMAND') {
          payload.action();
          return; // Intercepted, do not send to DB
        }
      }
    }

    if (mode === 'admin' && onAdminSendMessage) {
      // For Admin, trigger the passed function
      onAdminSendMessage(text);
    } else {
      chatLogic.sendMessage(text);
    }
    
    setInputText("");
    setShowEmojiPicker(false);
    setShowGifPicker(false);
  };

  const handleSendGif = (gif: any) => {
    // Serialize the payload to include dimensions for Solution 2 (Aspect Ratio Placeholder)
    const payload = `[GIPHY|${gif.images.original.width}|${gif.images.original.height}]${gif.images.original.url}`;
    
    if (mode === 'user') {
      chatLogic.sendMessage(payload);
    } else if (onAdminSendMessage) {
      onAdminSendMessage(payload);
    }
    setShowGifPicker(false);
  };

  const renderMessageText = (text: string) => {
    // Check if it's our new serialized GIPHY format with dimensions
    const giphyMatch = text.match(/^\[GIPHY\|(\d+)\|(\d+)\](.*)$/);
    if (giphyMatch) {
      const width = parseInt(giphyMatch[1]);
      const height = parseInt(giphyMatch[2]);
      const url = giphyMatch[3];
      const aspect = width / height;
      const displayWidth = 200;
      const displayHeight = 200 / aspect;
      return (
        <div style={{ marginTop: '5px', marginBottom: '5px', borderRadius: '15px', overflow: 'hidden', display: 'inline-block', position: 'relative', width: `${displayWidth}px`, height: `${displayHeight}px`, cursor: 'pointer' }} onClick={() => setLightboxImage(url)}>
          <Image src={url} alt="GIPHY" fill style={{ objectFit: 'cover' }} unoptimized />
        </div>
      );
    }

    // Fallback for older raw Giphy URLs (backwards compatibility)
    if (text.match(/^https?:\/\/(media\d*|i)\.giphy\.com\/media\//i)) {
      return (
        <div style={{ marginTop: '5px', marginBottom: '5px', borderRadius: '15px', overflow: 'hidden', display: 'inline-block', position: 'relative', width: '200px', height: '200px', cursor: 'pointer' }} onClick={() => setLightboxImage(text)}>
          <img src={text} alt="GIF" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      );
    }

    // Video Call System Message
    const videoMatch = text.match(/^\[VIDEO_CALL\|([^\]]+)\]$/);
    if (videoMatch) {
      const roomId = videoMatch[1];
      return (
        <div style={{ padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>📹 Video Call Started</div>
          <button 
            onClick={() => useVideoStore.getState().joinRoom(roomId)}
            style={{
              padding: '12px 20px',
              borderRadius: '25px',
              border: 'none',
              background: '#00A37A',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 163, 122, 0.4)'
            }}
          >
            Join Call
          </button>
        </div>
      );
    }

    return text;
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
      fontFamily: '"Rubik", sans-serif',
      minWidth: 0
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
      <PhysicsScroll className="chat-feed-scroll" padding={padding ? padding.replace('120px', '20px').replace('100px', '20px') : '20px'} onRefresh={chatLogic.refreshChats}>
        {allMessages.map((msg, idx) => {
          const isMe = mode === 'admin' ? msg.sender === 'admin' : (msg.sender === 'user' && msg.profileId === chatLogic.effectiveSessionId);
          
          // Check if message is ONLY emojis
          const checkIsOnlyEmojis = (str: string) => {
            if (str.startsWith('[GIPHY|') || str.startsWith('http')) return false;
            const stripped = str.replace(/[\s\n]/g, '');
            if (!stripped) return false;
            // Match extended pictographics, emoji presentation, zero-width joiners, and variant selectors
            return /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\uFE0F|\u200D)+$/u.test(stripped);
          };
          const isEmojiOnly = checkIsOnlyEmojis(msg.text);
          const isGiphy = msg.text.startsWith('[GIPHY|') || msg.text.match(/^https?:\/\/(media\d*|i)\.giphy\.com\/media\//i);
          
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
              flexDirection: 'column',
              willChange: 'transform, opacity'
            }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {mode === 'admin' && selectedMessageId === msg.id && (
                <div style={{ display: 'flex', gap: '5px', order: isMe ? -1 : 1, flexShrink: 0, animation: 'springIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const payload = `${msg.text}\n\n— via optical-illusions.com`;
                        const res = await fetch('/api/twitter/post', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: payload })
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          alert('Successfully posted to X!');
                        } else {
                          alert('Failed to post: ' + (data.error || 'Unknown error'));
                        }
                        setSelectedMessageId(null);
                      } catch (err) {
                        alert('Network error while posting to X');
                        setSelectedMessageId(null);
                      }
                    }}
                    style={{
                      width: '32px',
                      height: '24px',
                      borderRadius: '12px',
                      background: 'rgba(29, 155, 240, 0.2)',
                      color: '#1d9bf0',
                      border: '1px solid rgba(29, 155, 240, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: 0,
                      fontWeight: 'bold'
                    }}
                    title="Post to X"
                  >
                    𝕏
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onAdminDeleteMessage) onAdminDeleteMessage(msg.id);
                      setSelectedMessageId(null); // Deselect after delete
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(255,59,48,0.2)',
                      color: '#FF3B30',
                      border: '1px solid rgba(255,59,48,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: 0,
                    }}
                    title="Delete message"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div 
                style={{ position: 'relative', flex: 1, cursor: mode === 'admin' ? 'pointer' : 'default' }}
                onClick={() => {
                  if (mode === 'admin') {
                    setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id);
                  }
                }}
              >
                {!isEmojiOnly && !isGiphy && (
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
                )}
                
                <div className="chat-bubble-text" style={{
                  position: 'relative',
                  zIndex: 1,
                  padding: (isEmojiOnly || isGiphy) ? '0px' : '15px 20px',
                  fontSize: isEmojiOnly ? "45px" : "17px",
                  color: "white",
                  fontWeight: 800,
                  fontFamily: 'var(--font-rubik), sans-serif',
                  lineHeight: "1.4",
                  whiteSpace: 'pre-wrap',
                  opacity: 'var(--text-opacity, 1)',
                  willChange: 'opacity',
                  filter: isEmojiOnly ? 'drop-shadow(0px 4px 6px rgba(0,0,0,0.4))' : 'none',
                }}>
                  {renderMessageText(msg.text)}
                </div>
              </div>
            </div>
            {!isMe && msg.sender !== 'admin' && (
              <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.6)', marginTop: '4px', textAlign: 'left', fontWeight: 'bold' }}>
                {msg.sender}
              </div>
            )}
            <div className="chat-timestamp" style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.6)', marginTop: '2px', textAlign: isMe ? 'right' : 'left', fontWeight: 'bold', opacity: 'var(--bg-opacity, 1)' }}>
              {`${new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(msg.timestamp))} ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(msg.timestamp)).toLowerCase().replace(' ', '')}`}
            </div>
            </div>
          </div>
        )})}
        
        {isAdminTyping && (
          <div className="chat-message-group" style={{ alignSelf: 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ transformOrigin: 'bottom left', animation: 'springIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', display: 'flex', flexDirection: 'column', willChange: 'transform, opacity' }}>
              <div style={{ position: 'relative' }}>
                <div className="chat-bubble-bg" style={{ position: 'absolute', inset: 0, background: 'rgba(147, 51, 234, 0.9)', borderRadius: '20px', borderBottomLeftRadius: '4px', zIndex: 0, opacity: 'var(--bg-opacity, 1)' }} />
                <div className="chat-bubble-text" style={{ position: 'relative', zIndex: 1, padding: '15px 20px', display: 'flex', gap: '4px', alignItems: 'center', height: '51px', opacity: 'var(--text-opacity, 1)', willChange: 'opacity' }}>
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
      <div style={{ padding: "10px 20px 20px 20px", zIndex: 20, background: 'transparent', position: 'relative', flexShrink: 0 }}>
        
        {/* Pickers Popover */}
        <div ref={pickerContainerRef} style={{ position: 'absolute', bottom: '80px', left: '10px', right: '10px', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          {showEmojiPicker && (
            <div style={{ width: '100%', maxWidth: '600px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', backgroundColor: '#151617' }}>
              <Picker data={data} theme="dark" onEmojiSelect={(emoji: any) => setInputText(prev => prev + emoji.native)} style={{ width: '100%' }} />
            </div>
          )}
          
          {showGifPicker && (
            <div style={{ width: '100%', maxWidth: '600px', height: '400px', background: '#222', borderRadius: '12px', overflow: 'hidden', padding: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ flexShrink: 0 }}>GIPHY</span>
                <input 
                  type="text" 
                  value={gifSearchQuery}
                  onChange={(e) => setGifSearchQuery(e.target.value)}
                  placeholder="Search GIFs..."
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: 'none', background: '#111', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                <Grid 
                  key={gifSearchQuery}
                  width={pickerWidth > 0 ? pickerWidth : 280} 
                  columns={2} 
                  fetchGifs={(offset: number) => gifSearchQuery ? gf.search(gifSearchQuery, { offset, limit: 10 }) : gf.trending({ offset, limit: 10 })} 
                  onGifClick={(gif, e) => {
                    e.preventDefault();
                    handleSendGif(gif);
                  }} 
                />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          {/* Pickers Toggle */}
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button 
              type="button"
              onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', background: showGifPicker ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
              }}
            >
              GIF
            </button>
            <button 
              type="button"
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', background: showEmojiPicker ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: '#fff', border: 'none', cursor: 'pointer', fontSize: '20px'
              }}
            >
              😊
            </button>
            {mode === 'admin' && (
              <button 
                type="button"
                onClick={() => {
                  const roomId = `room_${Date.now()}`;
                  if (onAdminSendMessage) onAdminSendMessage(`[VIDEO_CALL|${roomId}]`);
                }}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: 'transparent',
                  color: '#03FFC0', border: 'none', cursor: 'pointer', fontSize: '20px'
                }}
                title="Start Video Call"
              >
                📹
              </button>
            )}
          </div>

          <input 
            type="text" 
            value={inputText}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Add Post here" 
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
              minWidth: 0, // Ensure flex child shrinks properly
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
      {/* Lightbox Overlay */}
      {lightboxImage && (
        <div 
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', cursor: 'pointer'
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', maxHeight: '80vh', maxWidth: '90vw' }}>
             <Image src={lightboxImage} alt="Expanded Media" fill style={{ objectFit: 'contain' }} unoptimized />
          </div>
          <button 
            onClick={() => setLightboxImage(null)}
            style={{ position: 'absolute', top: '40px', right: '30px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer', zIndex: 10000 }}
          >
            ×
          </button>
        </div>
      )}

    </div>
  );
}
