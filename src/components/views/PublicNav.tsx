"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const LiveClock = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <span style={{ fontSize: '21px', fontWeight: 500, opacity: 0 }}>...</span>;

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const isBlinking = time.getSeconds() % 2 === 0;

  return (
    <span style={{ fontSize: '21px', fontWeight: 500, letterSpacing: '1px', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-rubik), sans-serif', fontVariantNumeric: 'tabular-nums' }}>
      {displayHours}
      <span style={{ opacity: isBlinking ? 1 : 0.2, transition: 'opacity 0.2s', margin: '0 2px' }}>:</span>
      {minutes}
      <span style={{ opacity: isBlinking ? 1 : 0.2, transition: 'opacity 0.2s', margin: '0 2px' }}>:</span>
      {seconds}
      <span style={{ fontSize: '12px', marginLeft: '6px', opacity: 0.6 }}>{ampm}</span>
    </span>
  );
};

export default function PublicNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <div id="build-nav-left" style={{ position: 'absolute', top: '30px', left: '40px', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '35px', pointerEvents: 'auto' }}>
        <Link href="/about" style={{ position: 'relative', width: '150px', height: '40px', cursor: 'pointer', display: 'block' }}>
          <Image src="/assets/logo/op_logo.png" alt="Logo" fill style={{ objectFit: 'contain', objectPosition: 'left center' }} priority />
        </Link>
        <Link 
          href="/hire" 
          style={{ 
            marginLeft: '7px', 
            background: pathname === '/hire' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)', 
            border: pathname === '/hire' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '30px', 
            cursor: 'pointer', 
            fontSize: '13px', 
            fontWeight: 600, 
            backdropFilter: 'blur(10px)', 
            transition: 'all 0.2s', 
            textAlign: 'center', 
            textDecoration: 'none',
            display: 'inline-block' 
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = pathname === '/hire' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; router.push('/hire'); }}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        >
          Hire Us
        </Link>
        <button
          onClick={() => window.dispatchEvent(new Event('nexus-randomize'))}
          title="Randomize Background"
          style={{ 
            marginTop: '-5px', // 35px flex gap - 5px = 30px spacing from Hire Us
            marginLeft: '7px', // Match Hire Us alignment
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)', 
            color: 'white', 
            width: '42px', 
            height: '42px', 
            borderRadius: '50%', 
            cursor: 'pointer', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)', 
            transition: 'all 0.3s ease', 
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'rotate(180deg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      </div>

      <div id="build-nav-center" style={{ position: 'absolute', top: '35px', left: '0', right: '0', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px', pointerEvents: 'auto' }}>
          <Link 
            href="/about" 
            style={{ 
              textDecoration: 'none',
              color: pathname === '/about' ? 'white' : 'rgba(255,255,255,0.7)', 
              fontSize: '20px', 
              fontWeight: 600, 
              transition: 'all 0.2s', 
              padding: 0,
              display: 'inline-block'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.color = pathname === '/about' ? 'white' : 'rgba(255,255,255,0.7)'; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(1px)'; router.push('/about'); }}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          >
            About Us
          </Link>
          <Link 
            href="/games" 
            style={{ 
              textDecoration: 'none',
              color: pathname === '/games' ? 'white' : 'rgba(255,255,255,0.7)', 
              fontSize: '20px', 
              fontWeight: 600, 
              transition: 'all 0.2s', 
              padding: 0, 
              marginLeft: '50px',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.color = pathname === '/games' ? 'white' : 'rgba(255,255,255,0.7)'; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(1px)'; router.push('/games'); }}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          >
            Games
          </Link>
          <Link 
            href="/process" 
            style={{ 
              textDecoration: 'none',
              color: pathname === '/process' ? 'white' : 'rgba(255,255,255,0.7)', 
              fontSize: '20px', 
              fontWeight: 600, 
              transition: 'all 0.2s', 
              padding: 0, 
              marginLeft: '50px',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.color = pathname === '/process' ? 'white' : 'rgba(255,255,255,0.7)'; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(1px)'; router.push('/process'); }}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          >
            Our Process
          </Link>
          <Link 
            href="/library" 
            style={{ 
              textDecoration: 'none',
              background: pathname === '/library' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', 
              border: pathname === '/library' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)', 
              color: '#03FFC0', 
              padding: '8px 24px', 
              borderRadius: '30px', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              backdropFilter: 'blur(10px)', 
              transition: 'all 0.2s', 
              marginLeft: '50px', 
              whiteSpace: 'nowrap',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(3, 255, 192, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = pathname === '/library' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none'; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; router.push('/library'); }}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          >
            Agentic Game Assets
          </Link>
        </div>
      </div>

      <div id="build-nav-right" style={{ position: 'absolute', top: '30px', right: '40px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: '20px', color: 'white' }}>
          <LiveClock />
        </div>
        <img src="/assets/sponsors/ps_xbox.png" alt="Sponsor" style={{ transform: 'scale(0.5)', transformOrigin: 'right top', position: 'relative', right: '-20px', top: '25px' }} />
      </div>
    </>
  );
}
