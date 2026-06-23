"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { engines } from '@/data/engines';

export default function AppStoreFront() {
  const router = useRouter();

  const handleSelect = (id: string) => {
    router.push(`/engine/${id}`);
  };

  const heroEngine = engines[0];
  const featuredEngines = engines.slice(1, 5);
  const newReleases = engines.slice(5, 10);
  const essentialModules = engines.slice(10, 13);

  // Reusable Card Style for horizontal rows
  const getAppCardStyle = (): React.CSSProperties => ({
    position: 'relative',
    minWidth: '280px',
    height: '280px',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)',
    scrollSnapAlign: 'start',
    flexShrink: 0,
    transition: 'transform 0.2s',
  });

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      padding: '60px 0', // Padding top/bottom, allow horizontal scrolling to edge
      overflowY: 'auto',
      overflowX: 'hidden',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '60px', padding: '0 40px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>Discover</h1>
            <p style={{ fontSize: '18px', opacity: 0.6, margin: '5px 0 0 0' }}>The best engines and modules to build your next game.</p>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 500, opacity: 0.8 }}>
            <span>Search</span>
            <span>Categories</span>
          </div>
        </div>

        {/* Hero Featured Section */}
        {heroEngine && (
          <section>
            <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', color: '#007AFF', margin: '0 0 10px 0', fontWeight: 700 }}>Featured Engine</h2>
            <div 
              onClick={() => handleSelect(heroEngine.id)}
              style={{
                position: 'relative',
                width: '100%',
                height: '450px',
                borderRadius: '20px',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 30px 40px -20px rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Image src={heroEngine.media.thumbnail} alt={heroEngine.title} fill style={{ objectFit: 'cover' }} priority />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%)' }} />
              <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px' }}>
                <h3 style={{ fontSize: '42px', fontWeight: 800, margin: '0 0 10px 0' }}>{heroEngine.title}</h3>
                <p style={{ fontSize: '20px', opacity: 0.9, margin: 0 }}>{heroEngine.subtitle}</p>
              </div>
            </div>
          </section>
        )}

        {/* Horizontal Scroll Row 1: Trending Now */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Trending Now</h2>
            <span style={{ color: '#007AFF', cursor: 'pointer', fontSize: '16px' }}>See All</span>
          </div>
          
          {/* Scrolling Container */}
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            overflowX: 'auto', 
            scrollSnapType: 'x mandatory',
            paddingBottom: '20px', // Prevent scrollbar clipping
            margin: '0 -40px', // Bleed edge
            padding: '0 40px 20px 40px',
            scrollbarWidth: 'none', // Firefox
          }}>
            {featuredEngines.map(engine => (
              <div 
                key={engine.id}
                onClick={() => handleSelect(engine.id)}
                className="app-card hover:scale-[1.02] active:scale-[0.98]"
                style={getAppCardStyle()}
              >
                <div style={{ position: 'relative', width: '100%', height: '160px' }}>
                  <Image src={engine.media.thumbnail} alt={engine.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 5px 0' }}>{engine.title}</h3>
                  <p style={{ fontSize: '14px', opacity: 0.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{engine.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Horizontal Scroll Row 2: New Releases */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>New Releases</h2>
            <span style={{ color: '#007AFF', cursor: 'pointer', fontSize: '16px' }}>See All</span>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            overflowX: 'auto', 
            scrollSnapType: 'x mandatory',
            paddingBottom: '20px',
            margin: '0 -40px',
            padding: '0 40px 20px 40px',
            scrollbarWidth: 'none',
          }}>
            {newReleases.map(engine => (
              <div 
                key={engine.id}
                onClick={() => handleSelect(engine.id)}
                className="app-card hover:scale-[1.02] active:scale-[0.98]"
                style={getAppCardStyle()}
              >
                <div style={{ position: 'relative', width: '100%', height: '160px' }}>
                  <Image src={engine.media.thumbnail} alt={engine.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 5px 0' }}>{engine.title}</h3>
                  <p style={{ fontSize: '14px', opacity: 0.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{engine.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Horizontal Scroll Row 3: Essential Modules */}
        <section style={{ paddingBottom: '100px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Essential Modules</h2>
            <span style={{ color: '#007AFF', cursor: 'pointer', fontSize: '16px' }}>See All</span>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            overflowX: 'auto', 
            scrollSnapType: 'x mandatory',
            paddingBottom: '20px',
            margin: '0 -40px',
            padding: '0 40px 20px 40px',
            scrollbarWidth: 'none',
          }}>
            {essentialModules.map(engine => (
              <div 
                key={engine.id}
                onClick={() => handleSelect(engine.id)}
                className="app-card hover:scale-[1.02] active:scale-[0.98]"
                style={getAppCardStyle()}
              >
                <div style={{ position: 'relative', width: '100%', height: '160px' }}>
                  <Image src={engine.media.thumbnail} alt={engine.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 5px 0' }}>{engine.title}</h3>
                  <p style={{ fontSize: '14px', opacity: 0.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{engine.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      <style>{`
        /* Hide scrollbars but keep functionality */
        .app-card {
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
        }
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
