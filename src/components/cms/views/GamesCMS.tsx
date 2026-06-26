"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLibraryLogic } from '@/hooks/useLibraryLogic';
import { useGamepadNavigation } from '@/hooks/useGamepadNavigation';
import { useQueryState } from '@/hooks/useQueryState';
import LiveScreensaver from '@/components/library/LiveScreensaver';
import CosmicFlameAsset from '@/components/library/CosmicFlameAsset';
import EngineFlameComponent from '@/components/library/EngineFlameComponent';
import TerrainGenerator from '@/components/library/TerrainGenerator';

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
    borderTop: 'none',
    display: 'flex',
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: index === 0 ? '55px 65px 280px 65px' : '40px 50px 280px 50px', // More compact padding
    transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.5s cubic-bezier(0.1, 1.4, 0.2, 1)', 
    zIndex: 2,
    pointerEvents: 'none',
    boxShadow: 'none',
  }}>
    <div style={{ flex: 1, paddingRight: index === 0 ? '40px' : '30px' }}>
      <h3 style={{ 
        fontSize: index === 0 ? '72px' : '52px', 
        fontWeight: 700, // Bolder to make the gradient pop
        margin: '0 0 8px 0', // Extremely compact margin like Apple
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
  const idleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
        if (showScreensaver || showCosmicFlame || (showTerrainGenerator && !isExitingTerrainGenerator)) {
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
      setSelectedEngineId(engines[index].id);
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
      boxShadow: isActive ? '0 60px 40px -20px rgba(0, 0, 0, 0.7)' : '0 4px 12px rgba(0,0,0,0.2)',
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
    <div className="w-full min-h-full flex flex-col items-center justify-start pt-[120px] pb-16" style={{ position: 'relative' }}>
      
      {/* Top Text Container */}
      <div style={{ 
        marginTop: '0px',
        marginBottom: '95px', 
        textAlign: 'center', 
        zIndex: 60, 
        fontFamily: 'var(--font-rubik), sans-serif',
        transform: (showScreensaver || showCosmicFlame) ? 'translateY(-50px)' : 'translateY(0)',
        opacity: showScreensaver ? 0 : 1,
        pointerEvents: showScreensaver ? 'none' : 'auto',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <h1 style={{ fontSize: '50pt', fontWeight: 500, margin: '0 0 20px 0', color: 'white' }}>Co-Development Process</h1>
        <p style={{ 
          fontSize: '20px', 
          margin: 0, 
          color: 'white',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '12px 32px',
          borderRadius: '9999px',
          display: 'inline-block'
        }}>
          Copy and paste asset key into any Ai tool to integrate into Unity & Unreal
        </p>
      </div>
      


      {/* Live Screensaver Background */}
      {showScreensaver && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <LiveScreensaver onReady={() => setIsScreensaverLoaded(true)} />
          <button
            onClick={() => setShowScreensaver(false)}
            style={{
              position: 'absolute', top: '40px', right: '40px', zIndex: 100,
              background: 'rgba(52, 199, 89, 0.9)', border: '1px solid rgba(52, 199, 89, 1)',
              color: 'white', padding: '16px 32px', borderRadius: '9999px', cursor: 'pointer',
              fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px',
              backdropFilter: 'blur(8px)', transition: 'all 0.2s ease',
              boxShadow: '0 8px 24px rgba(52, 199, 89, 0.4)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(52, 199, 89, 1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(52, 199, 89, 0.9)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Close Window
          </button>
        </div>
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
            <div style={{ position: 'fixed', top: '110px', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 9999 }}>
              <button 
                style={{
                  background: '#03FFC0',
                  color: 'black',
                  padding: '16px 40px',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '20px',
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'var(--font-rubik), sans-serif',
                  boxShadow: '0 4px 20px rgba(3, 255, 192, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.8s ease-in-out',
                  whiteSpace: 'nowrap',
                  opacity: (isButtonVisible && !isIdle) ? 1 : 0,
                  pointerEvents: isIdle ? 'none' : 'auto'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText("terrain_generator");
                  e.currentTarget.innerText = "Copied!";
                  setTimeout(() => {
                    if (e.currentTarget) e.currentTarget.innerText = "Copy Asset Key";
                  }, 2000);
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
          opacity: hasInteracted ? 0 : 0.6,
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
            transform: 'scale(0.5)', 
            transformOrigin: 'top left', 
            position: 'absolute',
            top: 0,
            left: 0,
          opacity: (showScreensaver || showCosmicFlame) ? 0 : 1,
          pointerEvents: (showScreensaver || showCosmicFlame) ? 'none' : 'auto',
          transition: 'opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        
        {/* Large Main Box (Index 0) */}
        {engines[0] && (
          <div style={{ width: '1317px', height: '747px', position: 'relative' }}>
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
                description="1:13 trillion exact scale simulation of the solar system integrating NASA JPL data."
                isHovered={hoveredCardIndex === 0}
              />
            </div>
          </div>
        )}

        {/* Small Stacked Boxes (Indices 1 & 2) */}
        <div style={{ width: '865px', height: '747px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {engines[1] && (
            <div className="flex-1 relative">
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
                  description="Voxel Mini Game with Weapons System"
                  isHovered={hoveredCardIndex === 1}
                />
              </div>
            </div>
          )}
          
          {engines[2] && (
            <div className="flex-1 relative">
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
                  description="Ship Flight Model and Thermodynamic thruster physics."
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
          
          return (
            <button 
              style={{
                position: 'absolute',
                bottom: '100%',
                marginBottom: '135px',
                width: 'max-content',
                background: '#03FFC0',
                color: 'black',
                padding: '16px 40px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '20px',
                cursor: 'pointer',
                border: 'none',
                fontFamily: 'var(--font-rubik), sans-serif',
                boxShadow: '0 4px 20px rgba(3, 255, 192, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.8s ease-in-out',
                whiteSpace: 'nowrap',
                opacity: (isButtonVisible && !isIdle) ? 1 : 0,
                pointerEvents: isIdle ? 'none' : 'auto',
                zIndex: 9999
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onClick={(e) => {
                e.stopPropagation();
                const key = showScreensaver ? "cosmic_racers" : showCosmicFlame ? "cosmic_flame" : "terrain_generator";
                navigator.clipboard.writeText(key);
                e.currentTarget.innerText = "Copied!";
                setTimeout(() => {
                  if (e.currentTarget) e.currentTarget.innerText = "Copy Asset Key";
                }, 2000);
              }}
            >
              Copy Asset Key
            </button>
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

    </div>
  );
}
