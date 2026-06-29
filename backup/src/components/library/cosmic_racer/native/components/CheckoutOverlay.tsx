"use client";

import React, { useState, useEffect, useRef } from 'react';
// import Script from 'next/script';

export default function CheckoutOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = rect.width / 1864;
        const scaleY = rect.height / 1320;
        setScale(Math.min(scaleX, scaleY) * 0.9);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Listen for Gumroad successful purchase event
  useEffect(() => {
    const handleGumroadEvent = (e: any) => {
      // Gumroad fires 'gumroad-purchase-success' custom event on window or via postMessage
      // This is a placeholder for the actual Gumroad success callback logic.
      // Often you can pass a ?wanted=true&success_url=... or listen to messages.
    };
    window.addEventListener('message', handleGumroadEvent);
    return () => window.removeEventListener('message', handleGumroadEvent);
  }, []);

  let imageSrc = '';
  if (step === 1) imageSrc = '/marketing/autoplay/bg/final.png';
  if (step === 3) imageSrc = '/marketing/autoplay/bg/download_page.png';

  return (
    <div style={{ 
      position: 'absolute', inset: 0, zIndex: 10000, display: 'flex', justifyContent: 'center', 
      alignItems: 'center', background: 'rgba(0,0,0,0.85)', pointerEvents: 'auto' 
    }}>
      {/* Load Gumroad JS for Overlay */}
      {/* <Script src="https://gumroad.com/js/gumroad.js" strategy="lazyOnload" /> */}

      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 40, right: 40, zIndex: 10001, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          ×
        </button>

        <div ref={containerRef} style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/marketing/autoplay/bg/landing_page_bg_line.png)',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          
          <div style={{
              position: 'relative', 
              width: 1864, height: 1320, 
              transform: `scale(${scale})`, 
              transformOrigin: 'center center',
              flexShrink: 0
          }}>
            <div style={{ position: 'absolute', inset: 0, transform: 'translateY(200px)' }}>
              <img src={imageSrc} alt={`UI Layer Step ${step}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />

              {/* Step 1: Trigger Gumroad */}
              {step === 1 && (
                  <a 
                    href="https://gumroad.com/l/placeholder_product_url" 
                    // Temporarily removed className="gumroad-button" so it doesn't spin infinitely
                    // className="gumroad-button" 
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer', background: 'transparent', display: 'block' }} 
                    title="Click to Buy"
                    onClick={(e) => {
                      e.preventDefault();
                      // Because it's a placeholder link, we show an alert and move to step 3 manually.
                      alert("Gumroad needs your real product URL! The placeholder URL causes an infinite spinner.\n\nSimulating a successful purchase for now to show you the next screen.");
                      setStep(3);
                    }}
                  />
              )}

              {/* Step 3: Download Page */}
              {step === 3 && (
                  <div 
                    onClick={() => {
                        alert("Starting download...");
                        onClose();
                    }} 
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer', background: 'transparent' }} 
                    title="Click to Download"
                  />
              )}
            </div>
          </div>
        </div>

        {/* Developer helper banner */}
        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', color: '#00ffff', background: 'rgba(0,0,0,0.7)', padding: '10px 24px', borderRadius: '24px', pointerEvents: 'none', fontSize: '14px', border: '1px solid rgba(0, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '1px', zIndex: 1000 }}>
           {step === 1 ? 'Click anywhere to trigger Gumroad Overlay' : 'Checkout Complete! Click to download'}
        </div>
      </div>
    </div>
  );
}
