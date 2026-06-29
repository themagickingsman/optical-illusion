"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function HomeCMS() {
  const router = useRouter();
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'var(--font-rubik), sans-serif' }}>
      
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Top Content (Anchored to the top of the title) */}
        <div style={{ position: 'absolute', bottom: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '1200px' }}>
          <button style={{
            background: '#03FFC0',
            color: 'black',
            padding: '12px 32px',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '1px',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '20px',
            textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(3, 255, 192, 0.4)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={() => router.push('?tab=build&preview=hire')}
          >
            Hire Me
          </button>
          <div style={{ fontSize: '24px', opacity: 0.7, margin: '0 0 65px 0', color: 'white', letterSpacing: '2px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <span>Front-End Design + Tech Art</span>
          </div>
        </div>

        {/* Main Title (Dead Center) */}
        <h1 style={{ fontSize: '128px', fontWeight: 500, margin: 0, letterSpacing: '-0.02em', color: 'white', lineHeight: 1 }}>NEYO ONALENNA</h1>
        <div style={{ fontSize: '25px', opacity: 0.6, color: 'white', letterSpacing: '6px', marginTop: '80px', textTransform: 'uppercase' }}>LONDON</div>

        {/* Bottom Content (Anchored to the bottom of the title) */}
        <div style={{ position: 'absolute', top: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '1200px', paddingTop: '110px' }}>
          <p style={{ fontSize: '32px', opacity: 0.8, margin: 0, color: 'white' }}>
            Unreal, Unity, Apple, Android, Xbox, PlayStation, Switch
          </p>
          <div style={{ display: "flex", gap: "15px", marginTop: "60px" }}>
            <a href="#" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", textDecoration: "none", backdropFilter: "blur(20px)", transition: "all 0.2s" }}>
              <svg viewBox="0 0 127.14 96.36" width="20" height="20" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.58,67.58,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.09,53,91.08,65.69,84.69,65.69Z"/></svg>
            </a>
            <a href="#" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", textDecoration: "none", backdropFilter: "blur(20px)", transition: "all 0.2s" }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="#" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", textDecoration: "none", backdropFilter: "blur(20px)", transition: "all 0.2s" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}
