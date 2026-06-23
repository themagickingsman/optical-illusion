"use client";

import React, { useEffect, useState } from 'react';

export default function ProcessCMS({ onTryItNow }: { onTryItNow?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animation helper for smooth fade-in and slide-up
  const getStyle = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(40px)',
    transition: `all 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  return (
    <div style={{ width: '100%', minHeight: '100%', padding: '0 40px 120px 40px', fontFamily: 'var(--font-rubik), sans-serif', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Hero Wrapper to center it vertically/horizontally in the full screen */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
        {/* Hero Section */}
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center', maxWidth: '1200px',
          background: 'rgba(20, 60, 180, 0.2)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(0, 255, 255, 0.1)', borderRadius: '40px', padding: '60px 40px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
          ...getStyle(0.1) 
        }}>
        <h1 style={{ fontSize: '84px', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '12px' }}>
          The End of Static Mocks.
        </h1>
        <div style={{ fontSize: '36px', color: '#0ff', fontWeight: 500, marginBottom: '24px', letterSpacing: '-0.01em' }}>
          Real-time Front-end Integration
        </div>
        <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4', fontWeight: 400 }}>
          I build live, interactive mocks that seamlessly integrate directly into your Unity and Unreal Engine projects.
        </p>
        <button 
          onClick={onTryItNow}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
          marginTop: '40px',
          background: isHovered ? '#00FFC0' : '#03FFC0',
          color: '#000',
          border: 'none',
          borderRadius: '100px',
          padding: '18px 48px',
          fontSize: '22px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: isHovered ? '0 0 40px rgba(3, 255, 192, 0.8)' : '0 0 20px rgba(3, 255, 192, 0.4)',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          Try it Now
        </button>
        </div>
      </div>

      {/* Grid of Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', maxWidth: '1200px', width: '100%', marginTop: '-15vh', zIndex: 10, position: 'relative' }}>
        
        {/* Step 1 */}
        <div style={{ background: 'rgba(20, 60, 180, 0.2)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(0, 255, 255, 0.1)', borderRadius: '32px', padding: '60px', ...getStyle(0.3) }}>
          <div style={{ fontSize: '24px', color: '#03FFC0', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>
            01 — Live Prototyping
          </div>
          <h2 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '16px', lineHeight: '1.2' }}>
            Design in WebGL.
          </h2>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
            Static Figma files are dead. I build live, interactive WebGL and React prototypes. My clients experience the exact timing, hover states, and animations in a secure web browser environment before a single line of engine code is written.
          </p>
        </div>

        {/* Step 2 */}
        <div style={{ background: 'rgba(20, 60, 180, 0.2)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(0, 255, 255, 0.1)', borderRadius: '32px', padding: '60px', ...getStyle(0.5) }}>
          <div style={{ fontSize: '24px', color: '#03FFC0', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>
            02 — The Handoff
          </div>
          <h2 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '16px', lineHeight: '1.2' }}>
            Instant JSON API.
          </h2>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
            Once the prototype is approved, the frontend automatically compiles into a highly structured JSON API. It acts as the ultimate source of truth, containing every design token, exact coordinate, hex color, and animation curve.
          </p>
        </div>

      </div>

      {/* Hero Step 3 (Full Width) */}
      <div style={{ width: '100%', maxWidth: '1200px', background: 'rgba(20, 60, 180, 0.2)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(0, 255, 255, 0.1)', borderRadius: '32px', padding: '80px', marginTop: '40px', textAlign: 'center', ...getStyle(0.7) }}>
        <div style={{ fontSize: '24px', color: '#03FFC0', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px' }}>
          03 — Engine Integration
        </div>
        <h2 style={{ fontSize: '56px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '24px', lineHeight: '1.1' }}>
          Seamless Engine Consumption.
        </h2>
        <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5', maxWidth: '800px', margin: '0 auto' }}>
          My clients connect to the API link. Unreal Engine (UMG) and Unity (UI Toolkit) instantly consume the structured data, automatically mapping out prefabs and blueprints perfectly matching the web prototype.
        </p>
      </div>

    </div>
  );
}
