"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLibraryLogic } from '@/hooks/useLibraryLogic';
import { useGamepadNavigation } from '@/hooks/useGamepadNavigation';
import { useQueryState } from '@/hooks/useQueryState';
import { useRouter } from 'next/navigation';
import LiveScreensaver from '@/components/library/LiveScreensaver';
import CosmicFlameAsset from '@/components/library/CosmicFlameAsset';
import EngineFlameComponent from '@/components/library/EngineFlameComponent';
import TerrainGenerator from '@/components/library/TerrainGenerator';
import { BehindTheScenes } from '@/components/library/BehindTheScenes';

const InfoPanel = ({ index, title, description, isHovered }: { index: number, title: string, description: string, isHovered: boolean }) => (
  <div style={{
    position: 'absolute',
    bottom: '-240px', // Doubled slack offset for 0.5 scale container
    left: 0,
    width: '100%',
    height: 'auto', 
    background: 'linear-gradient(180deg, rgba(200, 200, 200, 0.45) 0%, rgba(180, 180, 180, 0.65) 100%)', // Tinted 10-15% darker to help white text pop
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    borderTop: '2px solid rgba(0, 0, 0, 0.1)', // Thicker border for scale
    display: 'flex',
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: index === 0 ? '55px 65px 280px 65px' : '40px 50px 280px 50px', // More compact padding
    transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.5s cubic-bezier(0.1, 1.4, 0.2, 1)', 
    zIndex: 2,
    pointerEvents: 'none',
    boxShadow: '0 -30px 80px rgba(0,0,0,0.1)', // Smoother shadow
  }}>
    <div style={{ flex: 1, paddingRight: index === 0 ? '40px' : '30px' }}>
      <h3 style={{ 
        fontSize: index === 0 ? '72px' : '52px', 
        fontWeight: 700, // Bolder to make the gradient pop
        margin: 0, // Compact margin
        lineHeight: 1.05, // Tight line height for wrapped text
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        letterSpacing: '-0.03em', // Ultra tight tracking
        color: '#FFF', // Solid white text
      }}>
        {title}
      </h3>
    </div>
    
    <div style={{ flexShrink: 0 }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(255, 255, 255, 0.95)', 
        color: '#000', 
        padding: index === 0 ? '24px 48px' : '18px 36px', // Tighter horizontally to make it "shorter"
        borderRadius: '9999px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        fontSize: index === 0 ? '40px' : '32px', // Scaled up!
        fontWeight: 600,
        boxShadow: '0 8px 28px rgba(0,0,0,0.1)'
      }}>
        <svg width={index === 0 ? 32 : 24} height={index === 0 ? 32 : 24} viewBox="0 0 24 24" fill="black">
          <path d="M5 3l14 9-14 9V3z"/>
        </svg>
        Play
      </div>
    </div>
  </div>
);

export default function GamesCMS() {
  const router = useRouter();
  const { engines, isLoading } = useLibraryLogic();
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [selectedEngineId, setSelectedEngineId] = useQueryState<string | null>('engine', null);
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [showCosmicFlame, setShowCosmicFlame] = useState(false);
  const [showTerrainGenerator, setShowTerrainGenerator] = useState(false);
  const [isExitingTerrainGenerator, setIsExitingTerrainGenerator] = useState(false);
  const [isScreensaverLoaded, setIsScreensaverLoaded] = useState(false);
  const [isScreensaverStarted, setIsScreensaverStarted] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showBTS, setShowBTS] = useState(false);
  const idleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const getEntranceStyle = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(40px)',
    transition: `all 1.0s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  React.useEffect(() => {
    if (showScreensaver || showCosmicFlame || showTerrainGenerator) {
      const t = setTimeout(() => setIsButtonVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setIsButtonVisible(false);
    }
  }, [showScreensaver, showCosmicFlame, showTerrainGenerator]);

  React.useEffect(() => {
    const onStart = () => setIsScreensaverStarted(true);
    window.addEventListener('arn_screensaver_started', onStart);
    return () => window.removeEventListener('arn_screensaver_started', onStart);
  }, []);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Global ESC to exit any preview
  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowScreensaver(false);
        setIsExitingTerrainGenerator(true); // Trigger fade out for TerrainGenerator
        setShowCosmicFlame(false);
        setShowBTS(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  // Reset loaded state when screensaver is closed
  React.useEffect(() => {
    if (!showScreensaver) {
      setIsScreensaverLoaded(false);
    }
  }, [showScreensaver]);

  // Broadcast preview state to global components (like GlobalBackground) to unmount heavy assets
  // We only unmount the metaballs for the full-screen opaque screensaver.
  // The Cosmic Flame has a transparent background and NEEDS the metaballs behind it.
  React.useEffect(() => {
    // For screensaver, we wait until the splash image is fully loaded before unmounting metaballs!
    // If TerrainGenerator is exiting, we consider the preview OVER so the metaballs can remount behind the fading UI!
    const isPreviewing = (showScreensaver && isScreensaverLoaded) || (showTerrainGenerator && !isExitingTerrainGenerator);
    window.dispatchEvent(new CustomEvent('preview-state-change', { detail: { isPreviewing } }));
    return () => {
      window.dispatchEvent(new CustomEvent('preview-state-change', { detail: { isPreviewing: false } }));
    };
  }, [showScreensaver, isScreensaverLoaded, showTerrainGenerator, isExitingTerrainGenerator]);

  React.useEffect(() => {
    if (!showScreensaver && !showCosmicFlame && !showTerrainGenerator) {
      setHasInteracted(false);
      setIsScreensaverStarted(false);
      setIsIdle(false);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      return;
    }

    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 5000);
    };

    resetIdleTimer();
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);

    const onKeyDown = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' ', 'W', 'A', 'S', 'D'];
      if (keys.includes(e.key)) {
        setHasInteracted(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    
    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('keydown', onKeyDown);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [showScreensaver, showCosmicFlame, showTerrainGenerator]);


  const activeCardRef = React.useRef<HTMLDivElement>(null);

  // Fade out the main nav header when a component is being reviewed
  React.useEffect(() => {
    const ids = ['build-nav-left', 'build-nav-center', 'build-nav-right'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        if (showScreensaver || showCosmicFlame) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.transform = 'translateY(-20px)';
        } else {
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
          el.style.transform = 'translateY(0)';
        }
      }
    });

    // Cleanup on unmount just in case we navigate away while viewing
    return () => {
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
          el.style.transform = 'translateY(0)';
        }
      });
    };
  }, [showScreensaver, showCosmicFlame, showTerrainGenerator]);

  const handleSelect = (index: number) => {
    if (index === 0) {
      // For the first box, toggle the live screensaver background
      setShowScreensaver(prev => !prev);
      setShowTerrainGenerator(false);
      setShowCosmicFlame(false);
      return;
    }
    
    if (index === 1) {
      // For the second box, toggle the Terrain Generator
      setShowTerrainGenerator(prev => !prev);
      setShowScreensaver(false);
      setShowCosmicFlame(false);
      return;
    }
    
    if (index === 2) {
      // For the third box, show the native CosmicFlameAsset
      setShowCosmicFlame(prev => !prev);
      setShowScreensaver(false);
      setShowTerrainGenerator(false);
      return;
    }

    if (engines[index]) {
      const selected = engines[index];
      setSelectedEngineId(selected.id);
      setTimeout(() => {
        window.history.replaceState(null, '', `/games/${selected.id}`);
      }, 50);
    }
  };

  const { activeIndex, setMouseActiveIndex } = useGamepadNavigation({
    totalItems: Math.min(engines.length, 3),
    columns: 3,
    onSelect: handleSelect,
  });

  const getCardStyle = (index: number): React.CSSProperties => {
    const isActive = activeIndex === index;
    return {
      position: 'relative',
      borderRadius: '26px',
      overflow: 'hidden',
      cursor: 'pointer',
      transform: isActive ? 'scale(1.04)' : 'scale(1)',
      outline: 'none',
      // Added a strong blue tint (rgba(0, 100, 255)) and increased the blur radius (+10px)
      boxShadow: isActive ? '0 60px 50px -20px rgba(0, 100, 255, 0.25)' : '0 14px 22px rgba(0, 120, 255, 0.15)',
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1)',
      height: '100%',
      width: '100%',
    };
  };

  if (isLoading || engines.length === 0) {
    return <div className="text-white text-center mt-32">Loading Games...</div>;
  }

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-start pt-0 pb-16" style={{ position: 'relative' }}>
      
      {/* Top Text Container */}
      <div style={{ 
        marginTop: '60px',
        marginBottom: '60px', 
        textAlign: 'center', 
        zIndex: 60, 
        fontFamily: 'var(--font-rubik), sans-serif',
        transform: (showScreensaver || showCosmicFlame) ? 'translateY(-50px)' : 'translateY(0)',
        opacity: showScreensaver ? 0 : 1,
        pointerEvents: showScreensaver ? 'none' : 'auto',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <h1 style={{ fontSize: '54px', fontWeight: 600, margin: '0 0 12px 0', color: 'white', letterSpacing: '-0.03em', lineHeight: '1.1' }}>UI/UX + Game Design + Co-Dev</h1>
        <p style={{ 
          fontSize: '28px', 
          margin: 0, 
          color: 'rgba(255, 255, 255, 0.8)',
          display: 'inline-block',
          letterSpacing: '-0.01em',
          fontWeight: 500
        }}>
          Creative Direction + Tech Art + Integration
        </p>
      </div>
      


      {/* Live Screensaver Background */}
      {showScreensaver && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <LiveScreensaver onReady={() => setIsScreensaverLoaded(true)} />
          <button
            onClick={() => setShowScreensaver(false)}
            style={{
              position: 'absolute', top: '90px', right: '40px', zIndex: 99999999,
              width: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center',
              background: 'rgba(52, 199, 89, 0.9)', border: '1px solid rgba(52, 199, 89, 1)',
              color: 'white', padding: '16px', borderRadius: '9999px', cursor: 'pointer',
              fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px',
              backdropFilter: 'blur(8px)', transition: 'all 0.2s ease',
              boxShadow: '0 8px 24px rgba(52, 199, 89, 0.4)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(52, 199, 89, 1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(52, 199, 89, 0.9)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Close Window
          </button>
        </div>,
        document.getElementById('website-canvas') || document.body
      )}

      {/* Native Cosmic Flame Asset */}
      {showCosmicFlame && typeof document !== 'undefined' && createPortal(
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 100, cursor: 'pointer', background: 'transparent' }}
          onClick={() => setShowCosmicFlame(false)}
        >
          <EngineFlameComponent />
          <CosmicFlameAsset />
        </div>,
        document.getElementById('website-canvas') || document.body
      )}

      {/* Terrain Generator Asset */}
      {showTerrainGenerator && typeof document !== 'undefined' && createPortal(
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'transparent' }}
        >
          <TerrainGenerator 
            onStartExit={() => setIsExitingTerrainGenerator(true)}
            onClose={() => {
              setShowTerrainGenerator(false);
              setIsExitingTerrainGenerator(false);
            }}
          />
          {/* Copy Asset Key Button for Terrain Generator (Portaled together) */}
          {!isExitingTerrainGenerator && (
            <div style={{ position: 'fixed', top: '152px', right: '40px', pointerEvents: 'none', zIndex: 9999 }}>
              <button 
                style={{
                  width: '180px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'rgba(3, 255, 192, 0.9)',
                  border: '1px solid rgba(3, 255, 192, 1)',
                  color: 'black',
                  padding: '16px',
                  borderRadius: '9999px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  boxShadow: '0 8px 24px rgba(3, 255, 192, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.8s ease-in-out',
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(8px)',
                  opacity: (isButtonVisible && !isIdle) ? 1 : 0,
                  pointerEvents: isIdle ? 'none' : 'auto'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(3, 255, 192, 1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(3, 255, 192, 0.9)'; }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText("Cosmic_Compass");
                  setShowBTS(true);
                }}
              >
                Copy Asset Key
              </button>
            </div>
          )}
        </div>,
        document.getElementById('website-canvas') || document.body
      )}

      {/* Controls Indicator for Review Mode */}
      {(showCosmicFlame || (showScreensaver && isScreensaverStarted)) && (
        <div style={{ 
          position: 'fixed', 
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 90, 
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '25px',
          opacity: hasInteracted ? 0 : (isIdle ? 0 : 0.6),
          transition: 'opacity 0.8s ease-out'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{
              width: '38px', height: '38px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="4" strokeLinejoin="round"><polygon points="12,4 4,20 20,20" /></svg>
            </div>
            <div style={{ display: 'flex', gap: '2px' }}>
              <div style={{
                width: '38px', height: '38px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="4" strokeLinejoin="round" style={{ transform: 'rotate(-90deg)' }}><polygon points="12,4 4,20 20,20" /></svg>
              </div>
              <div style={{
                width: '38px', height: '38px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="4" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}><polygon points="12,4 4,20 20,20" /></svg>
              </div>
              <div style={{
                width: '38px', height: '38px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="4" strokeLinejoin="round" style={{ transform: 'rotate(90deg)' }}><polygon points="12,4 4,20 20,20" /></svg>
              </div>
            </div>
          </div>
          <div style={{
            width: '118px', height: '38px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
            fontFamily: 'var(--font-rubik), sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em'
          }}>
            SPACEBAR
          </div>
        </div>
      )}

      {/* Main Grid Wrapper */}
      <div style={{ width: '1111px', height: '373.5px', position: 'relative', zIndex: 10 }}>
        <div 
          className="flex gap-[40px]" 
          style={{ 
            width: '2222px', 
            height: '747px', 
            // The master container slides up from 80px down
            transform: `scale(0.5) ${(showScreensaver || showCosmicFlame) ? '' : (mounted ? 'translateY(0)' : 'translateY(80px)')}`, 
            transformOrigin: 'top left', 
            position: 'absolute',
            top: 0,
            left: 0,
          opacity: (showScreensaver || showCosmicFlame) ? 0 : (mounted ? 1 : 0),
          pointerEvents: (showScreensaver || showCosmicFlame) ? 'none' : 'auto',
          transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        
        {/* Large Main Box (Index 0) */}
        {engines[0] && (
          <div style={{ width: '1317px', height: '747px', position: 'relative', ...getEntranceStyle(0.1) }}>
            <div
              ref={activeIndex === 0 ? activeCardRef : null}
              style={{ ...getCardStyle(0), zIndex: activeIndex === 0 ? 10 : 1 }}
              onMouseEnter={() => { setMouseActiveIndex(0); setHoveredCardIndex(0); }} 
              onMouseLeave={() => { setHoveredCardIndex(null); setMouseActiveIndex(-1); }}
              onClick={() => handleSelect(0)}
            >
              <img 
                src={engines[0].media?.thumbnail || engines[0].icon} 
                alt={engines[0].title} 
                className="absolute inset-0 w-full h-full object-cover block"
              />
              <InfoPanel 
                index={0}
                title="Delivering Full Games"
                description="1:13 trillion scale solar system simulation using NASA JPL data."
                isHovered={hoveredCardIndex === 0}
              />
            </div>
          </div>
        )}

        {/* Small Stacked Boxes (Indices 1 & 2) */}
        <div style={{ width: '865px', height: '747px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {engines[1] && (
            <div className="flex-1 relative" style={{ ...getEntranceStyle(0.25) }}>
              <div
                ref={activeIndex === 1 ? activeCardRef : null}
                style={{ ...getCardStyle(1), zIndex: activeIndex === 1 ? 10 : 1 }}
                onMouseEnter={() => { setMouseActiveIndex(1); setHoveredCardIndex(1); }} 
                onMouseLeave={() => { setHoveredCardIndex(null); setMouseActiveIndex(-1); }}
                onClick={() => handleSelect(1)}
              >
                <img 
                  src={engines[1].media?.thumbnail || engines[1].icon} 
                  alt={engines[1].title} 
                  className="absolute inset-0 w-full h-full object-cover block"
                />
                <InfoPanel 
                  index={1}
                  title="Delivering Full Features"
                  description="Voxel mini-games & weapon systems."
                  isHovered={hoveredCardIndex === 1}
                />
              </div>
            </div>
          )}
          
          {engines[2] && (
            <div className="flex-1 relative" style={{ ...getEntranceStyle(0.4) }}>
              <div
                ref={activeIndex === 2 ? activeCardRef : null}
                style={{ ...getCardStyle(2), zIndex: activeIndex === 2 ? 10 : 1 }}
                onMouseEnter={() => { setMouseActiveIndex(2); setHoveredCardIndex(2); }} 
                onMouseLeave={() => { setHoveredCardIndex(null); setMouseActiveIndex(-1); }}
                onClick={() => handleSelect(2)}
              >
                <img 
                  src={engines[2].media?.thumbnail || engines[2].icon} 
                  alt={engines[2].title} 
                  className="absolute inset-0 w-full h-full object-cover block"
                />
                <InfoPanel 
                  index={2}
                  title="Delivering Components"
                  description="Interactive particle engines."
                  isHovered={hoveredCardIndex === 2}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Action Button & Platform Logos */}
      <div style={{ marginTop: '75px', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        
        {(() => {
          if (!showScreensaver && !showCosmicFlame) return null;
          
          if (typeof document === 'undefined') return null;

          return createPortal(
            <div style={{ 
              position: 'fixed', 
              top: showScreensaver ? '152px' : 'auto', 
              bottom: showScreensaver ? 'auto' : '135px',
              right: showScreensaver ? '40px' : 'auto',
              left: showScreensaver ? 'auto' : '50%',
              transform: showScreensaver ? 'none' : 'translateX(-50%)',
              zIndex: 99999, 
              pointerEvents: 'none' 
            }}>
              <button 
                style={{
                  width: showScreensaver ? '180px' : 'max-content', 
                  display: showScreensaver ? 'flex' : 'block', 
                  justifyContent: showScreensaver ? 'center' : 'normal', 
                  alignItems: showScreensaver ? 'center' : 'normal',
                  background: showScreensaver ? 'rgba(3, 255, 192, 0.9)' : '#03FFC0',
                  border: showScreensaver ? '1px solid rgba(3, 255, 192, 1)' : 'none',
                  color: 'black',
                  padding: showScreensaver ? '16px' : '16px 40px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  fontFamily: showScreensaver ? 'system-ui, -apple-system, sans-serif' : 'var(--font-rubik), sans-serif',
                  fontSize: showScreensaver ? '16px' : '20px',
                  fontWeight: '600',
                  letterSpacing: showScreensaver ? '0.5px' : 'normal',
                  backdropFilter: showScreensaver ? 'blur(8px)' : 'none',
                  boxShadow: showScreensaver ? '0 8px 24px rgba(3, 255, 192, 0.4)' : '0 4px 20px rgba(3, 255, 192, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.8s ease-in-out',
                  whiteSpace: 'nowrap',
                  opacity: (isButtonVisible && !isIdle) ? 1 : 0,
                  pointerEvents: isIdle ? 'none' : 'auto',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; if (showScreensaver) e.currentTarget.style.background = 'rgba(3, 255, 192, 1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; if (showScreensaver) e.currentTarget.style.background = 'rgba(3, 255, 192, 0.9)'; else e.currentTarget.style.background = '#03FFC0'; }}
                onClick={(e) => {
                  e.stopPropagation();
                  const key = "Cosmic_Compass";
                  navigator.clipboard.writeText(key);
                  setShowBTS(true);
                }}
              >
                Copy Asset Key
              </button>
            </div>,
            document.getElementById('website-canvas') || document.body
          );
        })()}

        <img 
          src="/assets/logo/platform_logos.png" 
          alt="Platform Logos" 
          style={{ 
            maxHeight: '40px', 
            objectFit: 'contain',
            transform: (showScreensaver || showCosmicFlame) ? 'translateY(25px)' : 'translateY(0)',
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }} 
        />
      </div>

      <BehindTheScenes show={showBTS} onClose={() => setShowBTS(false)} />
    </div>
  );
}
