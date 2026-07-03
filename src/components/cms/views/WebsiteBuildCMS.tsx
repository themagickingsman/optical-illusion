"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLibraryLogic } from '@/hooks/useLibraryLogic';


import HireMeView from '@/components/views/HireMeView';
import LibraryCMS from './LibraryCMS';
import HomeCMS from './HomeCMS';
import GamesCMS from './GamesCMS';
import ProcessCMS from './ProcessCMS';
import { useQueryState } from '@/hooks/useQueryState';
import ProjectCarouselView from './ProjectCarouselView';
import DiscordFeedUI from '@/components/telecom/DiscordFeedUI';
import MobileChatUI from '@/components/telecom/MobileChatUI';

const AnimatedPage = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 20,
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(40px)',
      transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
      ...style
    }}>
      {children}
    </div>
  );
};

const LiveClock = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <span style={{ fontSize: '21px', fontWeight: 500, opacity: 0 }}>...</span>;

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const isBlinking = time.getSeconds() % 2 === 0;

  return (
    <span style={{ fontSize: '21px', fontWeight: 500, letterSpacing: '1px', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-rubik), sans-serif', fontVariantNumeric: 'tabular-nums' }}>
      {displayHours}
      <span style={{ opacity: isBlinking ? 1 : 0.2, transition: 'opacity 0.2s', margin: '0 2px' }}>:</span>
      {minutes}
      <span style={{ opacity: isBlinking ? 1 : 0.2, transition: 'opacity 0.2s', margin: '0 2px' }}>:</span>
      {seconds}
      <span style={{ fontSize: '12px', marginLeft: '6px', opacity: 0.6 }}>{ampm}</span>
    </span>
  );
};

export default function WebsiteBuildCMS() {
  const router = useRouter();
  const { engines, isLoading } = useLibraryLogic();
  
  // Isolated internal state for the Public Website
  const [previewMode, setPreviewMode] = useQueryState<'home' | 'games' | 'library' | 'process' | 'hire'>('preview', 'home');
  const [selectedEngineId, setSelectedEngineId] = useQueryState<string | null>('engine', null);

  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [mobileTab, setMobileTab] = useState<'chat' | 'discord' | 'discord-cr'>('chat');
  const [touchStartX, setTouchStartX] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

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
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchChatCount = async () => {
      try {
        const res = await fetch('/api/chat', { cache: 'no-store' });
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
      if (!headerRef.current) return;
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

  const handleNavClick = (tab: 'home' | 'games' | 'library' | 'process' | 'hire') => {
    // To cleanly navigate and simultaneously clear any open project engines, 
    // we use a single atomic router.push with an absolute path (/) to prevent conflict with spoofed URLs.
    router.push(`/?tab=build&preview=${tab}`, { scroll: false });
    
    // Visually update the URL bar to the clean path for SEO/Sharing
    // (We do this after a micro-delay to let Next.js finish its query string routing)
    setTimeout(() => {
      const cleanPath = tab === 'home' ? '/about' : `/${tab}`;
      window.history.replaceState(null, '', cleanPath);
    }, 50);
  };

  const [uiHidden, setUiHidden] = useState(false);

  // Reset scroll position when switching tabs
  useEffect(() => {
    const container = document.getElementById('build-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [previewMode]);

  if (isLoading || engines.length === 0 || isMobile === null) {
    return <div style={{ minHeight: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-rubik)', fontSize: '23pt' }}>Loading Optical Illusions</div>;
  }

  // Find the selected engine object if one is selected
  const selectedEngine = selectedEngineId ? engines.find((e: any) => e.id === selectedEngineId) : null;

  if (isMobile) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100dvh', 
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: 'url(/assets/bg/mobile_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff', 
        overflow: 'hidden'
      }}>
        <style>{`
          #nexus-fps-badge, #nexus-fullscreen-btn {
            transition: opacity 0.5s ease-in-out !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
        {/* Header - Overlaid as Absolute */}
        <div ref={headerRef} style={{ padding: '40px 0 20px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', pointerEvents: 'auto', transition: 'opacity 0.3s ease', opacity: 1 }}>
          
          <div 
            style={{ width: '160px', height: '40px', position: 'relative', cursor: 'pointer', marginTop: '-15px', marginBottom: '7px' }}
            onClick={() => handleNavClick('home')}
          >
             <Image src="/assets/logo/op_logo.png" alt="Logo" fill style={{ objectFit: 'contain', objectPosition: 'center' }} priority />
             {chatCount > 0 && (
               <div style={{ position: 'absolute', top: '-10px', right: '0px', background: '#FFD700', color: 'black', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', fontFamily: 'var(--font-rubik), sans-serif', pointerEvents: 'none' }}>
                 {chatCount}
               </div>
             )}
          </div>

          {/* Scrollable Tab Toggles (Social Icons) */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: '15px', width: '100%', padding: '0 20px', marginTop: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexShrink: 0, justifyContent: 'center' }}>
            <button 
              onClick={() => setMobileTab('chat')}
              style={{ flexShrink: 0, width: '50px', height: '50px', borderRadius: '50%', background: mobileTab === 'chat' ? '#fff' : 'rgba(30,30,30,0.8)', color: mobileTab === 'chat' ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <img 
                src="/assets/icon/op_04.png" 
                alt="Chat" 
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            </button>
            
            <button 
              onClick={() => setMobileTab('discord')}
              style={{ flexShrink: 0, width: '50px', height: '50px', borderRadius: '50%', background: mobileTab === 'discord' ? '#fff' : 'rgba(30,30,30,0.8)', color: mobileTab === 'discord' ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <svg width="26" height="26" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,.04-.06.05-.09h0c2.69-28.05-4.28-51.44-19.55-72.06ZM42.63,65.22C38.22,65.22,34.61,61.16,34.61,56.19S38.11,47.16,42.63,47.16c4.54,0,8.12,4.09,8.07,9S47.17,65.22,42.63,65.22Zm41.88,0c-4.41,0-8.02-4.06-8.02-9s3.52-9,8.02-9c4.54,0,8.12,4.09,8.07,9S89.05,65.22,84.51,65.22Z" />
              </svg>
            </button>

            <button 
              onClick={() => setMobileTab('discord-cr')}
              style={{ flexShrink: 0, width: '50px', height: '50px', borderRadius: '50%', background: mobileTab === 'discord-cr' ? '#fff' : 'rgba(30,30,30,0.8)', color: mobileTab === 'discord-cr' ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <img 
                src="/assets/icon/Cosmic_racers_icon.png" 
                alt="CR" 
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            </button>
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
        </div>

        {/* Build Number Overlay (positioned just above the input area) */}
        <div style={{ position: 'absolute', bottom: '95px', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
            BUILD 0.1.1
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <style>{`
        #nexus-fps-badge, #nexus-fullscreen-btn {
          transition: opacity 0.5s ease-in-out !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>
      
      {/* Zen Mode Overlay to restore UI */}
      {uiHidden && (
        <div 
          style={{ position: 'absolute', inset: 0, zIndex: 9999, cursor: 'pointer' }}
          onPointerDown={() => setUiHidden(false)}
        />
      )}

      {/* Main UI Wrapper (Fades out when uiHidden is true) */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        opacity: uiHidden ? 0 : 1, 
        pointerEvents: uiHidden ? 'none' : 'auto', 
        transition: 'opacity 0.8s ease-in-out' 
      }}>

        {/* If an engine is selected, render the SPA Project Sub-Page View underneath the top header */}
        {selectedEngine && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
            <ProjectCarouselView 
              app={selectedEngine} 
              onBack={() => setSelectedEngineId(null)} 
            />
          </div>
        )}

        {/* Read-Only Top Header (Simulating Public View) - Persists! */}
        <div id="build-nav-left" style={{ position: 'absolute', top: '30px', left: '40px', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '35px', pointerEvents: 'auto' }}>
          <div 
            onPointerDown={(e) => { 
              if (e.button === 0) { 
                e.preventDefault(); 
                setUiHidden(true); 
              } 
            }} 
            style={{ position: 'relative', width: '150px', height: '40px', cursor: 'pointer' }}
            title="Zen Mode (Hide UI)"
          >
            <Image src="/assets/logo/op_logo.png" alt="Logo" fill style={{ objectFit: 'contain', objectPosition: 'left center' }} priority />
            {chatCount > 0 && (
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#FFD700', color: 'black', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-rubik), sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                {chatCount}
              </div>
            )}
          </div>
          <button 
            onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); e.currentTarget.style.transform = 'scale(0.95)'; handleNavClick('hire'); } }}
            style={{ 
              marginLeft: '7px', 
              background: previewMode === 'hire' && !selectedEngine ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)', 
              border: previewMode === 'hire' && !selectedEngine ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '30px', 
              cursor: 'pointer', 
              fontSize: '13px', 
              fontWeight: 'bold', 
              transition: 'all 0.2s', 
              textAlign: 'center', 
              width: 'fit-content',
              display: 'inline-block' 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = previewMode === 'hire' && !selectedEngine ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)'; }}
            onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          >
            Hire Us
          </button>
          <button
            onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); e.currentTarget.style.transform = 'scale(0.9)'; window.dispatchEvent(new Event('nexus-randomize')); } }}
            onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Randomize Background"
            style={{ 
              marginTop: '-5px',
              marginLeft: '7px', 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)', 
              color: 'white', 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              cursor: 'pointer', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease', 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'rotate(180deg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>

        <div id="build-nav-center" style={{ position: 'absolute', top: '35px', left: '0', right: '0', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0px', pointerEvents: 'auto' }}>
            <button onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); handleNavClick('home'); } }} style={{ background: 'transparent', border: 'none', color: previewMode === 'home' && !selectedEngine ? 'white' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '20px', fontWeight: 600, transition: 'all 0.2s', padding: 0 }}>About Us</button>
            <button onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); handleNavClick('games'); } }} style={{ background: 'transparent', border: 'none', color: previewMode === 'games' && !selectedEngine ? 'white' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '20px', fontWeight: 600, transition: 'all 0.2s', padding: 0, marginLeft: '50px' }}>Games</button>
            <button onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); handleNavClick('process'); } }} style={{ background: 'transparent', border: 'none', color: previewMode === 'process' && !selectedEngine ? 'white' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '20px', fontWeight: 600, transition: 'all 0.2s', padding: 0, marginLeft: '50px' }}>Our Process</button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); handleNavClick('library'); } }} style={{ background: previewMode === 'library' && !selectedEngine ? 'rgba(30,30,30,0.9)' : 'rgba(20,20,20,0.8)', border: previewMode === 'library' && !selectedEngine ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)', color: '#03FFC0', padding: '8px 24px', borderRadius: '30px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.2s', marginLeft: '50px', whiteSpace: 'nowrap' }}>Agentic Game Assets</button>
            </div>
          </div>
        </div>

        <div id="build-nav-right" style={{ position: 'absolute', top: '30px', right: '40px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', zIndex: 100, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', gap: '20px', color: 'white' }}>
            <LiveClock />
          </div>
          <img src="/assets/sponsors/ps_xbox.png" alt="Sponsor" style={{ transform: 'scale(0.5)', transformOrigin: 'right top', position: 'relative', right: '-20px', top: '25px' }} />
        </div>

        {/* Main Grid View - Only shown if no engine is selected */}
        {!selectedEngine && (
          <div id="build-scroll-container" style={{ position: 'absolute', inset: 0, zIndex: 10, padding: '110px 60px 60px', overflowY: 'auto', overflowX: 'hidden', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            <div style={{ maxWidth: '1075px', margin: '0 auto' }}>
              
              {previewMode === 'home' && (
                <AnimatedPage style={{ paddingTop: '100px' }}>
                  <HomeCMS />
                </AnimatedPage>
              )}

              {previewMode === 'games' && (
                <AnimatedPage style={{ paddingTop: '100px' }}>
                  <GamesCMS />
                </AnimatedPage>
              )}

              {previewMode === 'library' && (
                <AnimatedPage style={{ paddingTop: '100px' }}>
                  <LibraryCMS />
                </AnimatedPage>
              )}

              {previewMode === 'process' && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 20, paddingTop: '100px' }}>
                  <ProcessCMS onTryItNow={() => handleNavClick('games')} />
                </div>
              )}

              {previewMode === 'hire' && (
                <AnimatedPage style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <HireMeView />
                </AnimatedPage>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
