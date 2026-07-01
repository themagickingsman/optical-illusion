"use client";

import React, { useState, useEffect } from 'react';
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

  const handleNavClick = (tab: 'home' | 'games' | 'library' | 'process' | 'hire') => {
    // To cleanly navigate and simultaneously clear any open project engines, 
    // we use a single atomic router.push. Calling setPreviewMode simultaneously 
    // causes Next.js router race conditions.
    router.push(`?tab=build&preview=${tab}`, { scroll: false });
    
    // Visually update the URL bar to the clean path for SEO/Sharing
    // (We do this after a micro-delay to let Next.js finish its query string routing)
    setTimeout(() => {
      const cleanPath = tab === 'home' ? '/about' : `/${tab}`;
      window.history.replaceState(null, '', cleanPath);
    }, 50);
  };

  // Reset scroll position when switching tabs
  useEffect(() => {
    const container = document.getElementById('build-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [previewMode]);

  if (isLoading || engines.length === 0) {
    return <div style={{ minHeight: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading Cosmic Architecture...</div>;
  }

  // Find the selected engine object if one is selected
  const selectedEngine = selectedEngineId ? engines.find((e: any) => e.id === selectedEngineId) : null;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      
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
        <div onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); handleNavClick('home'); } }} style={{ position: 'relative', width: '150px', height: '40px', cursor: 'pointer' }}>
          <Image src="/assets/logo/op_logo.png" alt="Logo" fill style={{ objectFit: 'contain', objectPosition: 'left center' }} priority />
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
            fontWeight: 600, 
            backdropFilter: 'blur(10px)', 
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
            backdropFilter: 'blur(10px)', 
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
          <button onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); handleNavClick('library'); } }} style={{ background: previewMode === 'library' && !selectedEngine ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', border: previewMode === 'library' && !selectedEngine ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)', color: '#03FFC0', padding: '8px 24px', borderRadius: '30px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', backdropFilter: 'blur(10px)', transition: 'all 0.2s', marginLeft: '50px', whiteSpace: 'nowrap' }}>Agentic Game Assets</button>
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
  );
}
