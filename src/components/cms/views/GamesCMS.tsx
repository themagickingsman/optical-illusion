"use client";

import React, { useState } from 'react';
import { useLibraryLogic } from '@/hooks/useLibraryLogic';
import { useGamepadNavigation } from '@/hooks/useGamepadNavigation';
import { useQueryState } from '@/hooks/useQueryState';
import LiveScreensaver from '@/components/library/LiveScreensaver';
import CosmicFlameAsset from '@/components/library/CosmicFlameAsset';

export default function GamesCMS() {
  const { engines, isLoading } = useLibraryLogic();
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [selectedEngineId, setSelectedEngineId] = useQueryState<string | null>('engine', null);
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [showCosmicFlame, setShowCosmicFlame] = useState(false);

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
  }, [showScreensaver, showCosmicFlame]);

  const handleSelect = (index: number) => {
    if (index === 0) {
      // For the first box, toggle the live screensaver background
      setShowScreensaver(prev => !prev);
      return;
    }
    
    if (index === 2) {
      // For the third box, show the native CosmicFlameAsset
      setShowCosmicFlame(prev => !prev);
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
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ position: 'relative' }}>
      
      {/* Top Text Container (45px above hero cards to move it down 15px) */}
      <div style={{ marginBottom: '45px', textAlign: 'center', zIndex: 10, fontFamily: 'var(--font-rubik), sans-serif' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 500, margin: '0 0 20px 0', color: 'white' }}>Simple Review and Iteration Process</h1>
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
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: -1, cursor: 'pointer' }}
          onClick={() => setShowScreensaver(false)}
        >
          <LiveScreensaver />
        </div>
      )}

      {/* Native Cosmic Flame Asset */}
      {showCosmicFlame && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 100, cursor: 'pointer', background: 'transparent' }}
          onClick={() => setShowCosmicFlame(false)}
        >
          <CosmicFlameAsset />
        </div>
      )}

      {/* Centered Close Text for Review Mode */}
      {(showScreensaver || showCosmicFlame) && (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          zIndex: 90, // Placed below the CosmicFlameAsset wrapper (100) but above Screensaver (-1)
          color: 'white', 
          opacity: 0.5,
          pointerEvents: 'none',
          fontSize: '16px', // Smaller text
          fontWeight: 700, // Bold
          fontFamily: 'var(--font-rubik), sans-serif',
          letterSpacing: '0.1em'
        }}>
          CLICK ANYWHERE TO CLOSE
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
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Action Button & Platform Logos */}
      <div style={{ marginTop: '75px', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        
        {(showScreensaver || showCosmicFlame) && (
          <button 
            style={{
              position: 'absolute',
              bottom: '100%',
              marginBottom: '30px',
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
              transition: 'transform 0.2s, box-shadow 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText("sample-asset-key-123");
              alert("Asset key copied!");
            }}
          >
            Copy Asset Key
          </button>
        )}

        <img src="/assets/logo/platform_logos.png" alt="Platform Logos" style={{ maxHeight: '40px', objectFit: 'contain' }} />
      </div>

    </div>
  );
}
