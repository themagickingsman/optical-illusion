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
  const [selectedEngineId] = useQueryState<string | null>('engine', null);

  const handleNavClick = (tab: 'home' | 'games' | 'library' | 'process' | 'hire') => {
    // We update the local query state explicitly, and clear the engine to drop out of project view
    setPreviewMode(tab);
    // Note: To completely drop the engine we could do router.push(`?tab=build&preview=${tab}`)
    // but we can just use router.push to ensure everything is atomic.
    router.push(`?tab=build&preview=${tab}`);
  };

  if (isLoading || engines.length === 0) {
    return <div style={{ minHeight: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading Cosmic Architecture...</div>;
  }

  // Find the selected engine object if one is selected
  const selectedEngine = selectedEngineId ? engines.find(e => e.id === selectedEngineId) : null;

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
        <div onClick={() => handleNavClick('home')} style={{ position: 'relative', width: '150px', height: '40px', cursor: 'pointer' }}>
          <Image src="/assets/logo/op_logo.png" alt="Logo" fill style={{ objectFit: 'contain', objectPosition: 'left center' }} priority />
        </div>
        <button onClick={() => handleNavClick('hire')} style={{ marginLeft: '7px', background: previewMode === 'hire' && !selectedEngine ? 'rgba(255,255,255,0.1)' : 'rgba(40,40,50,0.8)', border: previewMode === 'hire' && !selectedEngine ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent', color: 'white', padding: '8px 16px', borderRadius: '30px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backdropFilter: 'blur(10px)', transition: 'all 0.2s', textAlign: 'center', width: 'fit-content' }}>Hire Me</button>
      </div>

      <div id="build-nav-center" style={{ position: 'absolute', top: '35px', left: '0', right: '0', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px', pointerEvents: 'auto' }}>
          <button onClick={() => handleNavClick('home')} style={{ background: 'transparent', border: 'none', color: previewMode === 'home' && !selectedEngine ? 'white' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '20px', fontWeight: 600, transition: 'all 0.2s', padding: 0 }}>Home</button>
          <button onClick={() => handleNavClick('games')} style={{ background: 'transparent', border: 'none', color: previewMode === 'games' && !selectedEngine ? 'white' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '20px', fontWeight: 600, transition: 'all 0.2s', padding: 0, marginLeft: '50px' }}>Games</button>
          <button onClick={() => handleNavClick('process')} style={{ background: 'transparent', border: 'none', color: previewMode === 'process' && !selectedEngine ? 'white' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '20px', fontWeight: 600, transition: 'all 0.2s', padding: 0, marginLeft: '50px' }}>My Process</button>
          <button onClick={() => handleNavClick('library')} style={{ background: previewMode === 'library' && !selectedEngine ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', border: previewMode === 'library' && !selectedEngine ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)', color: '#03FFC0', padding: '8px 24px', borderRadius: '30px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', backdropFilter: 'blur(10px)', transition: 'all 0.2s', marginLeft: '50px', whiteSpace: 'nowrap' }}>Agentic Game Assets</button>
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
              <AnimatedPage>
                <HomeCMS />
              </AnimatedPage>
            )}

            {previewMode === 'games' && (
              <AnimatedPage>
                <GamesCMS />
              </AnimatedPage>
            )}

            {previewMode === 'library' && (
              <AnimatedPage>
                <LibraryCMS />
              </AnimatedPage>
            )}

            {previewMode === 'process' && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
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
