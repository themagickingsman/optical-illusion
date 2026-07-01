"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const FocusParagraph = ({ children, style = {}, isFocusedMode = false }: { children: React.ReactNode, style?: React.CSSProperties, isFocusedMode?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = document.getElementById('build-scroll-container');
    if (!container) return;

    const handleScroll = () => {
      if (!containerRef.current || !bgRef.current || !contentRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const top = Math.round(rect.top); 
      
      let currentOpacity = 0;
      let textOpacity = 1;
      
      const midway = Math.round(windowHeight * 0.5);
      const bottomStart = Math.round(windowHeight * 0.95);
      const bottomEnd = Math.round(windowHeight * 0.75);
      
      // Background fades out FIRST
      const bgTopStart = 450; 
      const bgTopEnd = 280;
      
      // Text fades out much SLOWER, starting exactly after bg is gone
      const textTopStart = 280; 
      const textTopEnd = 20;   
      
      if (top > bottomStart) {
        currentOpacity = 0;
      } else if (top > bottomEnd) {
        const progress = (bottomStart - top) / (bottomStart - bottomEnd);
        currentOpacity = progress;
      } else if (top > bgTopStart) {
        currentOpacity = 1;
      } else if (top > bgTopEnd) {
        const progress = (top - bgTopEnd) / (bgTopStart - bgTopEnd);
        currentOpacity = progress;
      } else {
        currentOpacity = 0;
      }
      
      // Text strictly fades after the background is gone
      if (top > textTopStart) {
        textOpacity = 1;
      } else if (top > textTopEnd) {
        textOpacity = (top - textTopEnd) / (textTopStart - textTopEnd);
      } else {
        textOpacity = 0;
      }
      
      // Apply dynamic glass dissolve to the background
      const bgAlpha = (maxBgOpacity * currentOpacity).toFixed(3);
      bgRef.current.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${bgAlpha})`;
      
      const blurPx = (20 * currentOpacity).toFixed(1);
      bgRef.current.style.backdropFilter = `blur(${blurPx}px)`;
      bgRef.current.style.WebkitBackdropFilter = `blur(${blurPx}px)`;

      contentRef.current.style.opacity = textOpacity.toFixed(2);
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);
    
    setTimeout(handleScroll, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isFocusedMode]);

  const maxBgOpacity = isFocusedMode ? 0.85 : 0.4;
  const r = isFocusedMode ? 10 : 20;
  const g = isFocusedMode ? 25 : 60;
  const b = isFocusedMode ? 60 : 180;

  return (
    <div 
      ref={containerRef} 
      style={{
        ...style,
        position: 'relative',
        borderRadius: '24px',
        padding: '32px 40px',
      }}
    >
      <div 
        ref={bgRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: `rgba(${r}, ${g}, ${b}, 0)`,
          backdropFilter: 'blur(0px)',
          WebkitBackdropFilter: 'blur(0px)',
          borderRadius: '24px',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div ref={contentRef} style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};


export default function HomeCMS() {
  const router = useRouter();
  
  const [isFocusedMode, setIsFocusedMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const breakpointRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const hasPassedBreakpointRef = useRef(false);
  const speedRef = useRef(0.05 * 1.61803398875); // Faster by the golden ratio
  const [userInteracted, setUserInteracted] = useState(false);

  // Trigger dimmed lighting mode when this page is active
  useEffect(() => {
    (window as any).__nexusLightingMode = 'dim';
    window.dispatchEvent(new CustomEvent('nexus-lighting-mode', { detail: { mode: 'dim' } }));
    return () => {
      (window as any).__nexusLightingMode = 'default';
      window.dispatchEvent(new CustomEvent('nexus-lighting-mode', { detail: { mode: 'default' } }));
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulatedScroll = 0;

    const scrollLoop = (time: number) => {
      if (userInteracted) return;
      if (!scrollRef.current) return;

      const delta = time - lastTime;
      lastTime = time;

      // Check if we need to pause at the breakpoint
      if (!hasPassedBreakpointRef.current && !isPausedRef.current && breakpointRef.current) {
        // Use getBoundingClientRect to avoid relative parent offset issues
        const rect = breakpointRef.current.getBoundingClientRect();
        // Pause when the top of the breakpoint reaches 420px above the bottom of the screen
        if (rect.top <= window.innerHeight - 420) {
          isPausedRef.current = true;
        }
      }

      animationFrameId = requestAnimationFrame(scrollLoop);

      // If paused, just keep looping but don't scroll
      if (isPausedRef.current) {
        return;
      }

      // Apply dynamic scroll speed
      const scrollAmount = delta * speedRef.current; 
      accumulatedScroll += scrollAmount;

      // Only apply integer pixel scrolls
      if (accumulatedScroll >= 1) {
        const pixelsToScroll = Math.floor(accumulatedScroll);
        const container = document.getElementById('build-scroll-container');
        if (container) {
          container.scrollTop += pixelsToScroll;
        }
        accumulatedScroll -= pixelsToScroll;
      }
    };

    lastTime = performance.now(); // Reset time before starting
    animationFrameId = requestAnimationFrame(scrollLoop);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [userInteracted]);

  const handleInteraction = () => {
    setUserInteracted(true);
  };

  return (
    <div 
      ref={scrollRef}
      onWheel={handleInteraction}
      onTouchMove={handleInteraction}
      onMouseDown={handleInteraction}
      className="hide-scrollbar"
      style={{ 
        position: 'relative', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        fontFamily: 'var(--font-rubik), sans-serif'
      }}
    >
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
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
      `}</style>

      {/* Hero Section - 100vh to ensure title is perfectly centered initially */}
      <div style={{ 
        width: '100%', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        position: 'relative',
        flexShrink: 0,
        zIndex: 10
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', transform: 'translateY(-50px)' }}>
          <button style={{
            background: '#03FFC0',
            color: 'black',
            padding: '12px 32px',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '1px',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '20px',
            textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(3, 255, 192, 0.4)',
            transition: 'transform 0.2s',
            position: 'relative',
            top: '-25px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={() => router.push('?tab=build&preview=hire')}
          >
            Hire Us
          </button>
          <div style={{ fontSize: '24px', opacity: 0.7, color: 'white', letterSpacing: '4px', fontWeight: 500, textTransform: 'uppercase' }}>
            UI/UX + Game Design + Co-Dev
          </div>
        </div>

        <h1 style={{ fontSize: '128px', fontWeight: 500, margin: 0, letterSpacing: '-0.02em', color: 'white', lineHeight: 1 }}>OpticalIllusions</h1>
        {/* Logo Image */}
        <div style={{ marginTop: '40px', transform: 'translateY(15px)', display: 'flex', justifyContent: 'center' }}>
          <img 
            src="/assets/logo/Royal_Monogram_of_Queen_Sophie_of_the_Netherlands.svg.png" 
            alt="Royal Monogram of Queen Sophie" 
            style={{ 
              height: '79px', 
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              opacity: 0.85
            }} 
          />
        </div>

        <div style={{ marginTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateY(-40px)' }}>
          <p style={{ fontSize: '32px', opacity: 0.8, margin: 0, color: 'white', transform: 'translateY(15px)' }}>
            Unreal, Unity, Apple, Android, Xbox, PlayStation, Switch
          </p>
          <div style={{ display: "flex", gap: "25px", marginTop: "65px" }}>
            <a href="https://discord.gg/rCXJz6Wgc" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", textDecoration: "none", backdropFilter: "blur(20px)" }}>
              <svg viewBox="0 0 127.14 96.36" width="30" height="30" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.58,67.58,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.09,53,91.08,65.69,84.69,65.69Z"/></svg>
            </a>
            <a href="https://github.com/themagickingsman" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", textDecoration: "none", backdropFilter: "blur(20px)" }}>
              <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="https://x.com/magickingsman" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", textDecoration: "none", backdropFilter: "blur(20px)" }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Text Content */}
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        textAlign: 'left',
        padding: '0 40px 60px 40px',
        marginTop: '-40px',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '80px', transform: 'translateY(-25px)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '72px', margin: '0 0 16px 0', letterSpacing: '-0.03em', lineHeight: 1, color: '#fff' }}>Co-Development</h2>
          <p style={{ fontWeight: 500, fontSize: '24px', margin: 0, color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '-0.01em' }}>Generative UI + MCP = Autonomous Game Integration</p>
        </div>
        
        <FocusParagraph isFocusedMode={isFocusedMode} style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '30px', fontWeight: 500, color: '#fff', margin: 0, lineHeight: 1.5, letterSpacing: '-0.015em' }}>We architect front-end UI/UX for seamless Unity and Unreal integration via AI and secure MCP protocols.</p>
        </FocusParagraph>
        <FocusParagraph isFocusedMode={isFocusedMode} style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '30px', fontWeight: 500, color: '#fff', margin: 0, lineHeight: 1.5, letterSpacing: '-0.015em' }}>Connected via MCP to any AI dev tool, our designs compile 1:1 in your native engine environment.</p>
        </FocusParagraph>
        <FocusParagraph isFocusedMode={isFocusedMode} style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '30px', fontWeight: 500, color: '#fff', margin: 0, lineHeight: 1.5, letterSpacing: '-0.015em' }}>
            We build high-density WebGL features and deploy them directly into Unreal or Unity via an automated, air-gapped JSON pipeline. Zero vendor lock-in. Zero VPN friction.
          </p>
        </FocusParagraph>

        {/* Breakpoint Anchor & Continue Button */}
        <div ref={breakpointRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '60px', marginTop: '20px' }}>
          <button 
            onClick={() => {
              setUserInteracted(false);
              isPausedRef.current = false;
              hasPassedBreakpointRef.current = true;
              // Keep post-continue speed exactly what it was originally
              speedRef.current = 0.05 / 1.61803398875;
              setIsFocusedMode(true);
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent this click from killing the auto-scroll
            style={{
              background: '#03FFC0',
              color: 'black',
              padding: '12px 32px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '16px',
              letterSpacing: '1px',
              border: '2px solid #03FFC0',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 4px 20px rgba(3, 255, 192, 0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#03FFC0';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(3, 255, 192, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#03FFC0';
              e.currentTarget.style.color = 'black';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(3, 255, 192, 0.4)';
            }}
          >
            Continue
          </button>
        </div>

        <FocusParagraph isFocusedMode={isFocusedMode} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '40px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
            How Our Pipeline Works
          </h3>
          <p style={{ fontSize: '28px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.6 }}>
            Our Universal Component Protocol (UGCS) decouples creative logic from engine-specific C++. How features move from sandbox to game:
          </p>
        </FocusParagraph>
        
        <FocusParagraph isFocusedMode={isFocusedMode} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '40px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>1. The R&D Forge <span style={{ opacity: 0.5, fontWeight: 400 }}>(WebGL & React)</span></h3>
          <p style={{ fontSize: '28px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.6 }}>We prototype complex UI/UX systems right here on this platform, in a standalone WebGL environment. You review it running in real-time.</p>
        </FocusParagraph>
        
        <FocusParagraph isFocusedMode={isFocusedMode} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '40px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>2. The Universal Manifest <span style={{ opacity: 0.5, fontWeight: 400 }}>(JSON)</span></h3>
          <p style={{ fontSize: '28px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.6 }}>Upon approval, our framework compiles the feature into a strict <strong style={{ color: '#fff', fontWeight: 600 }}>Asset Key<sup style={{ position: 'relative', top: '-0.5em', transform: 'translateY(-5px)', display: 'inline-block', fontSize: '0.4em', marginLeft: '4px', color: '#03FFC0' }}>●</sup></strong> payload containing topology, animation curves, and state-binding logic.</p>
        </FocusParagraph>
        
        <FocusParagraph isFocusedMode={isFocusedMode} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '40px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>3. The Air-Gapped Handoff <span style={{ opacity: 0.5, fontWeight: 400 }}>(MCP)</span></h3>
          <p style={{ fontSize: '28px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.6 }}>No VPN required. We use MCP as a secure courier, dropping the JSON payload at a DMZ endpoint. Your internal client ingests the data—neutralizing Arbitrary Code Execution (ACE) risks.</p>
        </FocusParagraph>
        
        <FocusParagraph isFocusedMode={isFocusedMode} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '40px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>4. Native Engine Assembly <span style={{ opacity: 0.5, fontWeight: 400 }}>(Python)</span></h3>
          <p style={{ fontSize: '28px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.6 }}>Our custom Python scripts read the JSON payload to automatically spawn native UMG widgets, attach materials, and bind logic directly in your editor.</p>
        </FocusParagraph>
        
        <FocusParagraph isFocusedMode={isFocusedMode} style={{ marginBottom: '60px' }}>
          <p style={{ fontSize: '32px', fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.015em' }}>We build the pipeline. Your team owns the output.</p>
        </FocusParagraph>

        <p style={{ fontStyle: 'italic', marginTop: '100px', fontSize: '28px', opacity: 0.6, textAlign: 'center', letterSpacing: '0.02em' }}>"May our bond resonate the sacred geometry that binds us all"<br/><span style={{ display: 'inline-block', marginTop: '10px', fontStyle: 'normal', fontWeight: 500 }}>OpticalIllusions</span></p>
      </div>

    </div>
  );
}
