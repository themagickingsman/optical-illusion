"use client";

import React from 'react';

/**
 * An isolated, pristine AI Asset component that embeds the live Cosmic Racers Screensaver 
 * running on localhost:3006 into a full-screen, borderless background layer.
 */
export default function LiveScreensaver() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'none', // Allow clicks to pass through to the UI on top
    }}>
      <iframe
        src="http://localhost:3006"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          opacity: 1, // Full visibility in background
          transition: 'opacity 1s ease-in-out'
        }}
        title="Live Cosmic Racers Screensaver"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
