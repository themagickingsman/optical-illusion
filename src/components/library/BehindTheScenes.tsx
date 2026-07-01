import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import HireMeView from '@/components/views/HireMeView';

const FocusParagraph = ({ children, style = {}, isFocusedMode = true, scrollContainerId = 'behind-scenes-scroll-container' }: { children: React.ReactNode, style?: React.CSSProperties, isFocusedMode?: boolean, scrollContainerId?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = document.getElementById(scrollContainerId);
    if (!container) return;

    const handleScroll = () => {
      if (!containerRef.current || !bgRef.current || !contentRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const top = Math.round(rect.top); 
      
      let currentOpacity = 0;
      let textOpacity = 1;
      
      const bottomStart = Math.round(windowHeight * 0.95);
      const bottomEnd = Math.round(windowHeight * 0.75);
      
      // Background fades out FIRST
      const bgTopStart = Math.round(windowHeight * 0.45); 
      const bgTopEnd = Math.round(windowHeight * -0.05);
      
      // Text fades out much SLOWER
      const textTopStart = Math.round(windowHeight * -0.05); 
      const textTopEnd = Math.round(windowHeight * -0.3);
      
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
      const maxBgOpacity = isFocusedMode ? 0.4 : 0.2;
      const r = isFocusedMode ? 10 : 20;
      const g = isFocusedMode ? 10 : 20;
      const b = isFocusedMode ? 15 : 30;

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
  }, [isFocusedMode, scrollContainerId]);

  return (
    <div 
      ref={containerRef} 
      style={{
        ...style,
        position: 'relative',
        borderRadius: '40px',
        padding: '32px 40px',
      }}
    >
      <div 
        ref={bgRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: `rgba(10, 10, 15, 0)`,
          backdropFilter: 'blur(0px)',
          WebkitBackdropFilter: 'blur(0px)',
          borderRadius: '40px',
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

export interface BehindTheScenesProps {
  show: boolean;
  onClose: () => void;
}

export function BehindTheScenes({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [interacted, setInteracted] = useState(false);
  const [showHireForm, setShowHireForm] = useState(false);
  const [targetNode, setTargetNode] = useState<Element | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Handle mounting to the correct node (fullscreen element or body)
    const updateTarget = () => {
      setTargetNode(document.fullscreenElement || document.body);
    };
    updateTarget();
    document.addEventListener('fullscreenchange', updateTarget);
    return () => document.removeEventListener('fullscreenchange', updateTarget);
  }, []);

  useEffect(() => {
    if (!show) {
       setInteracted(false);
       setShowHireForm(false);
       if (scrollRef.current) scrollRef.current.scrollTop = 0;
       return;
    }
    
    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulatedScroll = 0;
    const speed = 0.05 * 1.618;

    const scrollLoop = (time: number) => {
      if (interacted) return;
      if (!scrollRef.current) return;

      const delta = time - lastTime;
      lastTime = time;

      animationFrameId = requestAnimationFrame(scrollLoop);

      const scrollAmount = delta * speed; 
      accumulatedScroll += scrollAmount;

      if (accumulatedScroll >= 1) {
        const pixelsToScroll = Math.floor(accumulatedScroll);
        const oldScroll = scrollRef.current.scrollTop;
        scrollRef.current.scrollTop += pixelsToScroll;
        
        if (scrollRef.current.scrollTop === oldScroll && oldScroll > 0) {
          // Reached the bottom of the scroll container
          return;
        }

        accumulatedScroll -= pixelsToScroll;
      }
    };

    const timer = setTimeout(() => {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(scrollLoop);
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [show, interacted]);

  // Dispatch an event to trigger WebGL blur in the underlying canvas
  useEffect(() => {
    const event = new CustomEvent('toggle-webgl-blur', { detail: { active: show } });
    window.dispatchEvent(event);
  }, [show]);

  if (!mounted || !targetNode) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      pointerEvents: show ? 'auto' : 'none',
      opacity: show ? 1 : 0, transition: 'opacity 0.8s ease'
    }}>
      {/* Full screen dark blue box (40% opacity) */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(0, 20, 60, 0.4)',
        zIndex: 0
      }} />

      {show && showHireForm && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ marginBottom: 50, zIndex: 10 }}>
            <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '12px 24px', borderRadius: 30, cursor: 'pointer', fontSize: 18, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Close</button>
          </div>
          <HireMeView />
        </div>
      )}

      {show && !showHireForm && (
        <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
          <div style={{ position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-rubik), sans-serif', fontSize: 20, color: '#fff', pointerEvents: 'none', zIndex: 3002 }}>
            Click anywhere to close
          </div>
          <div 
            id="behind-scenes-scroll-container"
            ref={scrollRef}
            onClick={onClose}
            onWheel={() => setInteracted(true)}
            onTouchMove={() => setInteracted(true)}
            onMouseDown={() => setInteracted(true)}
            style={{ 
              width: '100%', 
              height: '100%', 
              overflowY: 'auto', 
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10vh 20px 10vh 20px', // Stops with last item exactly centered
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              cursor: 'pointer'
            }}
          >
            <style>{`
              #behind-scenes-scroll-container::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div style={{ maxWidth: 1000, width: '100%', textAlign: 'center', fontFamily: 'var(--font-rubik), sans-serif', paddingBottom: 100, cursor: 'default' }}>
              
              <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ fontWeight: 800, fontSize: 80, margin: '0', letterSpacing: '-0.04em', lineHeight: 1.1, color: '#fff', textAlign: 'center', maxWidth: 1000 }}>
                  No, the process is absolutely not bullshit.
                </h2>
              </div>
              
              <FocusParagraph style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ fontSize: 64, fontWeight: 700, color: '#fff', textAlign: 'center', letterSpacing: '-0.03em', lineHeight: 1.2, maxWidth: 900, margin: '0' }}>
                  What we designed is 100% real, mathematically sound,<br/>and incredibly powerful.
                </h2>
              </FocusParagraph>

              <FocusParagraph style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ fontSize: 64, fontWeight: 700, color: '#03FFC0', textAlign: 'center', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0' }}>
                  Asset Key
                </h2>
                <h2 style={{ fontSize: 48, fontWeight: 700, color: '#fff', textAlign: 'center', letterSpacing: '-0.03em', lineHeight: 1.3, maxWidth: 1100, margin: '32px 0 0 0' }}>
                  When you click <strong style={{color:'#03FFC0'}}>“Copy Asset Key”</strong>, we are distilling the entire state of that procedural engine—the noise seeds, the exact colors, the octaves, the post-processing variables—into a highly compressed, base64-encoded JSON string.
                </h2>
              </FocusParagraph>

              <FocusParagraph style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ fontSize: 64, fontWeight: 700, color: '#fff', textAlign: 'center', letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: 900, margin: '0' }}>
                  You absolutely can transfer assets exactly like this.
                </h2>
                <p style={{ fontSize: 32, fontWeight: 400, color: '#03FFC0', textAlign: 'center', marginTop: 32 }}>
                  In fact, it is the smartest way to do it.
                </p>
              </FocusParagraph>

              <FocusParagraph style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ fontSize: 56, fontWeight: 700, color: '#fff', textAlign: 'center', letterSpacing: '-0.03em', lineHeight: 1.2, maxWidth: 1000, margin: '0' }}>
                  Instead of transferring a massive 500MB <span style={{ fontFamily: 'monospace', color: '#03FFC0' }}>.fbx</span> 3D model or fighting with Git branches, you are just passing the pure mathematical DNA of the asset.
                </h2>
              </FocusParagraph>

              <FocusParagraph style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ fontSize: 48, fontWeight: 700, color: '#fff', textAlign: 'center', letterSpacing: '-0.03em', lineHeight: 1.3, maxWidth: 1100, margin: '0' }}>
                  A custom Python script or an SDK in Unity/Unreal can instantly ingest that exact string, decode the JSON, plug those numbers into their local noise generation shaders, and instantly reconstruct the exact same visual result locally.
                </h2>
              </FocusParagraph>

              <FocusParagraph style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h1 style={{ fontSize: 80, fontWeight: 800, color: '#fff', textAlign: 'center', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                  It is a brilliant, zero-friction pipeline.
                </h1>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHireForm(true);
                  }}
                  style={{
                    marginTop: 100,
                    backgroundColor: '#03FFC0',
                    color: '#00143c',
                    border: 'none',
                    borderRadius: 100,
                    padding: '24px 64px',
                    fontSize: 24,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    boxShadow: '0 0 40px rgba(3, 255, 192, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 60px rgba(3, 255, 192, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(3, 255, 192, 0.4)';
                  }}
                >
                  Hire Us
                </button>
              </FocusParagraph>

            </div>
          </div>
        </div>
      )}
    </div>,
    targetNode
  );
}
