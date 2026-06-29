"use client";

import React from 'react';
import AgentAppStore from '@/components/library/AgentAppStore';
import LoginPill from '@/components/library/LoginPill';

export default function LibraryCMS() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* Centered Text */}
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-rubik), sans-serif', zIndex: 10, position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          
          {/* Animated Login Pill */}
          <LoginPill />

          <h1 style={{ fontSize: '64px', fontWeight: 500, margin: '0 0 5px 0', letterSpacing: '-0.02em', color: 'white', textShadow: '0 0 20px rgba(0,0,0,0.1)' }}>High Resolution Game Assets</h1>
          <p style={{ fontSize: '32px', opacity: 0.8, margin: 0, color: 'white' }}>
            Paste the <span style={{ color: '#03FFC0', fontWeight: 'bold' }}>Ai Asset Key</span> into any prompt to use this component.
          </p>
          <div style={{ display: 'flex', gap: '75px', justifyContent: 'center', alignItems: 'center', marginTop: '50px' }}>
            <img src="/assets/features/ai_logos/Vector.png" alt="AI Logo" style={{ maxHeight: '35px' }} />
            <img src="/assets/features/ai_logos/Vector-1.png" alt="AI Logo" style={{ maxHeight: '35px' }} />
            <img src="/assets/features/ai_logos/Vector-2.png" alt="AI Logo" style={{ maxHeight: '35px' }} />
            <img src="/assets/features/ai_logos/Vector-3.png" alt="AI Logo" style={{ maxHeight: '35px' }} />
            <img src="/assets/features/ai_logos/Vector-4.png" alt="AI Logo" style={{ maxHeight: '35px' }} />
          </div>
        </div>
      </div>

      {/* App Component container pushed down to cut off, acting as a background image */}
      <div className="w-full flex justify-center pointer-events-none" style={{ position: 'absolute', bottom: '-480px', left: 0, right: 0, zIndex: 1 }}>
        <div className="w-full max-w-[1000px] h-[650px] shadow-2xl rounded-xl overflow-hidden border border-white/20 relative">
          <AgentAppStore />

        </div>
      </div>
    </div>
  );
}
