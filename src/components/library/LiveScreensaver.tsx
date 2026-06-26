"use client";

import React, { useState } from 'react';

/**
 * An isolated, pristine AI Asset component that embeds the live Cosmic Racers Screensaver 
 * running on localhost:3006 into a full-screen, borderless background layer.
 */
export default function LiveScreensaver() {
  const [isBooting, setIsBooting] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [splashFaded, setSplashFaded] = useState(false);

  // Use the live deployed URL in production to prevent mixed-content blocking.
  const isProd = process.env.NODE_ENV === 'production';
  const iframeSrc = isProd ? "https://cosmic-racers-website.vercel.app/" : "http://localhost:3006";

  const handleInitiate = () => {
    setIsBooting(true);
  };

  const handleIframeLoad = () => {
    if (isBooting) {
      setIframeLoaded(true);
      setTimeout(() => setSplashFaded(true), 1000); // Wait for fade out to complete before unmounting splash
    }
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'auto', // Allow clicks to pass through to the UI on top
    }}>
      {/* ── Actual Screensaver Game (Loads in background) ── */}
      {isBooting && (
        <iframe
          src={iframeSrc}
          onLoad={handleIframeLoad}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            zIndex: 1,
            pointerEvents: 'auto'
          }}
          title="Live Cosmic Racers Screensaver"
          allow="autoplay; fullscreen"
        />
      )}

      {/* ── Splash Screen Overlay ── */}
      {!splashFaded && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          opacity: iframeLoaded ? 0 : 1,
          transition: 'opacity 1s ease-in-out',
          pointerEvents: isBooting ? 'none' : 'auto'
        }}>
          {/* Middle Layer (Splash Image) */}
          <img 
            src="/assets/features/title_screen/cosmic_racers_title.png" 
            alt="Cosmic Racers Title Screen" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />

          {/* Top Layer (Loading Bar Overlay) */}
          {isBooting && !iframeLoaded && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '300px', height: '3px', background: 'rgba(255,255,255,0.15)',
              borderRadius: '2px', overflow: 'hidden', zIndex: 20
            }}>
              <div style={{
                width: '100%', height: '100%', background: '#00e5ff',
                animation: 'splash-loading-slide 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }} />
              <style>{`
                @keyframes splash-loading-slide {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `}</style>
            </div>
          )}

          {/* Top Layer (Invisible hitbox 'Initiate Flight' button) */}
          {!isBooting && (
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                cursor: 'pointer',
                zIndex: 30
              }}
              onClick={handleInitiate}
            />
          )}
        </div>
      )}
    </div>
  );
}
