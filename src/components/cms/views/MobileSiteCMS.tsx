"use client";

import React, { useState, useEffect, useRef } from 'react';
import MobileChatUI from '@/components/telecom/MobileChatUI';
import DiscordFeedUI from '@/components/telecom/DiscordFeedUI';
import TwitterFeedUI from '@/components/telecom/TwitterFeedUI';
import LiveKitVideoEngine from '@/components/network-engine/assets/livekit_video_engine';
import IOSNotification from '@/components/telecom/IOSNotification';
import Image from 'next/image';
import packageJson from '../../../../package.json';

export default function MobileSiteCMS() {
  const [mobileTab, setMobileTab] = useState<'chat' | 'discord' | 'discord-cr' | 'x-twitter'>('chat');
  const [touchStartX, setTouchStartX] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Notification State
  const [notification, setNotification] = useState({ title: '', message: '', isVisible: false });
  const [lastSeenMsgId, setLastSeenMsgId] = useState<string | null>(null);

  // Background message poller for notifications
  useEffect(() => {
    // Only show notifications if NOT on the chat tab
    if (mobileTab === 'chat') {
      setNotification(n => ({ ...n, isVisible: false }));
      return;
    }

    const checkForMessages = async () => {
      try {
        const res = await fetch('/api/chat');
        const data = await res.json();
        if (data.session && data.session.messages) {
          const adminMsgs = data.session.messages.filter((m: any) => m.sender === 'admin');
          if (adminMsgs.length > 0) {
            const latestMsg = adminMsgs[adminMsgs.length - 1];
            setLastSeenMsgId(prev => {
              if (prev && prev !== latestMsg.id) {
                setNotification({
                  title: 'System Admin',
                  message: latestMsg.text,
                  isVisible: true
                });
              }
              return latestMsg.id;
            });
          }
        }
      } catch (e) {}
    };

    checkForMessages();
    const interval = setInterval(checkForMessages, 3000);
    return () => clearInterval(interval);
  }, [mobileTab]);

  useEffect(() => {
    const fetchChatCount = async () => {
      try {
        const res = await fetch('/api/chat?asAdmin=true', { cache: 'no-store' });
        const data = await res.json();
        if (data.profiles) setChatCount(data.profiles.length);
      } catch (e) {}
    };
    fetchChatCount();
    const timer = setInterval(fetchChatCount, 5000);
    return () => clearInterval(timer);
  }, []);

  // Scroll-based Header Fade
  useEffect(() => {
    const handleScroll = (e: any) => {
      if (!headerRef.current || !e.detail) return;
      const { deltaY, scrollTop } = e.detail;
      if (scrollTop < 50) {
        headerRef.current.style.opacity = '1';
        headerRef.current.style.pointerEvents = 'auto'; // allow clicks
      } else if (deltaY > 2) { // Scrolling down
        headerRef.current.style.opacity = '0';
        headerRef.current.style.pointerEvents = 'none'; // disable clicks when hidden
      } else if (deltaY < -2) { // Scrolling up
        headerRef.current.style.opacity = '1';
        headerRef.current.style.pointerEvents = 'auto';
      }
    };
    window.addEventListener('mobile-feed-scroll', handleScroll);
    return () => window.removeEventListener('mobile-feed-scroll', handleScroll);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setTouchStartX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const touchEndX = e.clientX;
    if (touchStartX - touchEndX > 50) {
      // Swiped Left - go to next tab
      if (mobileTab === 'chat') setMobileTab('discord');
      else if (mobileTab === 'discord') setMobileTab('discord-cr');
    }
    if (touchEndX - touchStartX > 50) {
      // Swiped Right - go to prev tab
      if (mobileTab === 'discord-cr') setMobileTab('discord');
      else if (mobileTab === 'discord') setMobileTab('chat');
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
      <div style={{ width: '375px', height: '812px', borderRadius: '40px', overflow: 'hidden', position: 'relative', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column' }}>
        
        {/* Mobile App Content */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundImage: 'url(/assets/bg/mobile_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#fff', 
          overflow: 'hidden', 
        }}>
          {/* Header */}
          <div ref={headerRef} style={{ padding: '40px 0 20px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', pointerEvents: 'auto', transition: 'opacity 0.3s ease', opacity: 1 }}>
            
            <div 
              style={{ width: '160px', height: '40px', position: 'relative', marginTop: '-15px', marginBottom: '7px' }}
            >
               <Image src="/assets/logo/op_logo.png" alt="Logo" fill style={{ objectFit: 'contain', objectPosition: 'center' }} priority />
               {chatCount > 0 && (
                 <div style={{ position: 'absolute', top: '-10px', right: '0px', background: '#FFD700', color: 'black', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', fontFamily: 'var(--font-rubik), sans-serif', pointerEvents: 'none' }}>
                   {chatCount}
                 </div>
               )}
            </div>

            {/* Tab Toggles (Social Icons) */}
            <div style={{ width: '100%', padding: '0 20px', marginTop: '0px', flexShrink: 0 }}>
              <div 
                style={{ display: 'flex', gap: '15px', justifyContent: 'center', width: '100%', margin: '0 auto' }}
              >
              <button 
                onClick={() => setMobileTab('chat')}
                style={{ flexShrink: 0, width: '50px', height: '50px', borderRadius: '50%', background: mobileTab === 'chat' ? '#fff' : 'rgba(30,30,30,0.8)', color: mobileTab === 'chat' ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', touchAction: 'none' }}
              >
                <img 
                  src="/assets/icon/op_04.png" 
                  alt="Chat" 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                />
              </button>
              
              <button 
                onClick={() => setMobileTab('discord')}
                style={{ flexShrink: 0, width: '50px', height: '50px', borderRadius: '50%', background: mobileTab === 'discord' ? '#fff' : 'rgba(30,30,30,0.8)', color: mobileTab === 'discord' ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', touchAction: 'none' }}
              >
                <svg width="26" height="26" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,.04-.06.05-.09h0c2.69-28.05-4.28-51.44-19.55-72.06ZM42.63,65.22C38.22,65.22,34.61,61.16,34.61,56.19S38.11,47.16,42.63,47.16c4.54,0,8.12,4.09,8.07,9S47.17,65.22,42.63,65.22Zm41.88,0c-4.41,0-8.02-4.06-8.02-9s3.52-9,8.02-9c4.54,0,8.12,4.09,8.07,9S89.05,65.22,84.51,65.22Z" />
                </svg>
              </button>

              <button 
                onClick={() => setMobileTab('discord-cr')}
                style={{ flexShrink: 0, width: '50px', height: '50px', borderRadius: '50%', background: mobileTab === 'discord-cr' ? '#fff' : 'rgba(30,30,30,0.8)', color: mobileTab === 'discord-cr' ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', touchAction: 'none' }}
              >
                <img 
                  src="/assets/icon/Cosmic_racers_icon.png" 
                  alt="CR" 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                />
              </button>

              <button 
                onClick={() => setMobileTab('x-twitter')}
                style={{ flexShrink: 0, width: '50px', height: '50px', borderRadius: '50%', background: mobileTab === 'x-twitter' ? '#fff' : 'rgba(30,30,30,0.8)', color: mobileTab === 'x-twitter' ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', touchAction: 'none' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              </div>
            </div>

          </div>
          
          {/* Fullscreen Scroll Container */}
          <div 
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          >
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            {mobileTab === 'chat' && <MobileChatUI theme="op" padding="220px 20px 120px 20px" />}
            {mobileTab === 'discord' && <DiscordFeedUI channelType="op" padding="220px 20px 120px 20px" />}
            {mobileTab === 'discord-cr' && <DiscordFeedUI channelType="cr" padding="220px 20px 120px 20px" />}
            {mobileTab === 'x-twitter' && <TwitterFeedUI />}
          </div>

          {/* Build Number Overlay (positioned just above the input area) */}
          <div style={{ position: 'absolute', bottom: '95px', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
              BUILD {packageJson.version}
            </div>
          </div>
          
          <LiveKitVideoEngine />
          
          <IOSNotification 
            title={notification.title}
            message={notification.message}
            isVisible={notification.isVisible}
            onClick={() => setMobileTab('chat')}
            onClose={() => setNotification(n => ({ ...n, isVisible: false }))}
          />
        </div>

      </div>
    </div>
  );
}
