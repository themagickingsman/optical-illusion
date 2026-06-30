"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AgentAppStore from '@/components/library/AgentAppStore';
import LoginPill from '@/components/library/LoginPill';

export default function LibraryCMS() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const getStyle = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(40px)',
    transition: `all 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 110px)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '0px', ...getStyle(0.1) }}>
      
      {/* Centered Text */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'var(--font-rubik), sans-serif', zIndex: 10, position: 'relative', marginTop: '100px' }}>
        <div style={{ textAlign: 'center' }}>
          
          {/* Animated Login Pill */}
          <LoginPill />

          <h1 style={{ fontSize: '64px', fontWeight: 500, margin: '0 0 5px 0', letterSpacing: '-0.02em', color: 'white', textShadow: '0 0 20px rgba(0,0,0,0.1)' }}>High Resolution Game Assets</h1>
          <p style={{ fontSize: '36px', fontWeight: 500, letterSpacing: '-0.01em', opacity: 0.8, margin: 0, color: 'white' }}>
            Paste <span style={{ color: '#03FFC0', fontWeight: 'bold' }}>Asset Keys</span> into any Ai prompt to use.
          </p>
          <div style={{ display: 'flex', gap: '75px', justifyContent: 'center', alignItems: 'center', marginTop: '100px' }}>
            <img src="/assets/features/ai_logos/Vector.png" alt="AI Logo" style={{ maxHeight: '35px' }} />
            <img src="/assets/features/ai_logos/Vector-1.png" alt="AI Logo" style={{ maxHeight: '35px' }} />
            <img src="/assets/features/ai_logos/Vector-2.png" alt="AI Logo" style={{ maxHeight: '35px' }} />
            <img src="/assets/features/ai_logos/Vector-3.png" alt="AI Logo" style={{ maxHeight: '35px' }} />
            <img src="/assets/features/ai_logos/Vector-4.png" alt="AI Logo" style={{ maxHeight: '35px' }} />
          </div>
        </div>
      </div>

      {/* App Component container - Portaled to build-scroll-container to escape layout transform stacking context while preserving exact layout boundaries */}
      {mounted && typeof document !== 'undefined' && document.getElementById('build-scroll-container') && createPortal(
        <div className="w-full flex justify-center" style={{ position: 'fixed', bottom: '-455px', left: 0, right: 0, zIndex: 10, pointerEvents: 'none', ...getStyle(0.3) }}>
          <div className="w-full max-w-[1000px] h-[650px] shadow-2xl rounded-xl overflow-hidden border border-white/20 relative" style={{ pointerEvents: 'auto' }}>
            <AgentAppStore />
            {/* Invisible overlay to strictly block interaction */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 50, cursor: 'default' }} />
          </div>
        </div>,
        document.getElementById('build-scroll-container')!
      )}
    </div>
  );
}
