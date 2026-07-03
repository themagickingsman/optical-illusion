"use client";

import React, { useEffect, useState } from 'react';
import PhysicsScroll from './PhysicsScroll';
import { TwitterTimelineEmbed } from 'react-twitter-embed';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || '5hwYpLrCsAkukYs4poS79fObIfonvtBd');

export default function TwitterFeedUI() {
  const [key, setKey] = useState(Date.now());
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Force re-mount on navigation to ensure it loads
  useEffect(() => {
    setKey(Date.now());
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    setIsSending(true);
    const msg = inputText;
    setInputText('');
    setShowEmojiPicker(false);
    setShowGifPicker(false);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'user', text: msg })
      });
      alert('Thanks for submitting! We will review it shortly.');
    } catch (e) {
      console.error(e);
      alert('Network error while submitting.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendGif = async (gif: any) => {
    if (isSending) return;
    setIsSending(true);
    setShowGifPicker(false);
    
    // Giphy URL format serialization matching MobileChatUI
    const msg = `[GIPHY|${gif.images.fixed_width.width}|${gif.images.fixed_width.height}]${gif.images.fixed_width.url}`;
    
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'user', text: msg })
      });
      alert('Thanks for submitting! We will review it shortly.');
    } catch (e) {
      console.error(e);
      alert('Network error while submitting.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <PhysicsScroll className="twitter-feed-scroll" padding="220px 20px 120px 20px">
        <div style={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '600px', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            {/* Marketing Promotion Banner */}
            <div style={{ 
              background: 'rgba(0,0,0,0.7)', 
              border: '1px solid rgba(255,255,255,0.15)', 
              borderTop: 'none',
              borderRadius: '0 0 16px 16px', 
              padding: '24px', 
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              position: 'relative',
              overflow: 'hidden',
              fontFamily: '"Rubik", sans-serif',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #1d9bf0, #9333ea)' }} />
              <h3 style={{ color: '#fff', fontSize: '48px', fontWeight: 500, margin: '0 0 16px 0', letterSpacing: '-0.02em', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Promote Your Game for Free! 🚀</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
                Drop a post below with a link to your game or your portfolio for designers and game developers. Our team pushes the best ones straight to our official X page!
              </p>
            </div>

            <TwitterTimelineEmbed
              key={key}
              sourceType="profile"
              screenName="magickingsman"
              options={{ height: 800, theme: 'dark', chrome: 'nofooter noborders transparent' }}
              noHeader
              noFooter
              noBorders
              transparent
            />
          </div>
        </div>
      </PhysicsScroll>

      {/* Input Area */}
      <div style={{ padding: "20px", zIndex: 100, background: 'transparent', position: 'absolute', bottom: '150px', left: 0, right: 0 }}>
        
        {/* Pickers Popover */}
        <div style={{ position: 'absolute', bottom: '80px', right: '20px', zIndex: 30, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {showEmojiPicker && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.8)' }}>
              <Picker data={data} theme="dark" onEmojiSelect={(emoji: any) => setInputText(prev => prev + emoji.native)} />
            </div>
          )}
          
          {showGifPicker && (
            <div style={{ width: '300px', height: '400px', background: '#222', borderRadius: '12px', overflow: 'hidden', padding: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>GIPHY</div>
              <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                <Grid 
                  width={280} 
                  columns={2} 
                  fetchGifs={(offset: number) => gf.trending({ offset, limit: 10 })} 
                  onGifClick={(gif, e) => {
                    e.preventDefault();
                    handleSendGif(gif);
                  }} 
                />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', gap: '10px', position: 'relative', maxWidth: '600px', margin: '0 auto', alignItems: 'center' }}>
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
          </div>

          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Secure message..." 
            style={{ 
              flex: 1, 
              padding: '15px 20px', 
              borderRadius: '100px', 
              border: '1px solid rgba(255,255,255,0.2)', 
              background: 'rgba(0,0,0,0.6)', 
              color: '#fff', 
              fontSize: '16px',
              fontFamily: 'var(--font-rubik), sans-serif',
              outline: 'none',
              transition: 'border 0.2s',
              minWidth: 0
            }}
            onMouseEnter={(e) => { if (document.activeElement !== e.target) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.5)' }}
            onMouseLeave={(e) => { if (document.activeElement !== e.target) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)' }}
            onFocus={(e) => e.target.style.border = '1px solid rgba(3,255,192,0.8)'}
            onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.2)'}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isSending}
            style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: inputText.trim() && !isSending ? '#00A37A' : 'rgba(0,0,0,0.6)', 
              color: inputText.trim() && !isSending ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)', 
              border: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: inputText.trim() && !isSending ? 'pointer' : 'default',
              transition: 'all 0.2s',
              flexShrink: 0
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
