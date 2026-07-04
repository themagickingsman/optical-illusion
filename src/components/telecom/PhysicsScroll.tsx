"use client";

import React, { useRef, useState, useEffect } from 'react';

interface PhysicsScrollProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onRefresh?: () => Promise<void> | void;
}

export default function PhysicsScroll({ children, className = '', padding = '20px', scrollRef, onRefresh }: PhysicsScrollProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = scrollRef || internalRef;
  const contentRef = useRef<HTMLDivElement>(null);

  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const lastScrollTop = useRef<number>(0);
  
  // Clean up any remaining touch state
  useEffect(() => {
    const handleMouseUp = () => {
      touchStartY.current = null;
      if (!isRefreshing) setPullY(0);
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isRefreshing]);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isRefreshing || !ref.current) return;
    if (ref.current.scrollTop <= 0) {
      touchStartY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (isRefreshing || touchStartY.current === null || !ref.current) return;
    
    // Only pull if we are exactly at the top
    if (ref.current.scrollTop > 0) {
      touchStartY.current = null;
      setPullY(0);
      return;
    }

    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = currentY - touchStartY.current;

    if (diff > 0) {
      // Apply resistance: 0.4 multiplier, max 100px
      const rawPull = diff * 0.4;
      setPullY(Math.min(rawPull, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing || touchStartY.current === null) return;
    
    if (pullY > 60 && onRefresh) {
      setIsRefreshing(true);
      setPullY(60); // Hold at 60px while refreshing
      try {
        await onRefresh();
        // Wait a tiny bit for UX
        await new Promise(r => setTimeout(r, 500));
      } finally {
        setIsRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
    
    touchStartY.current = null;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const currentScrollTop = container.scrollTop;
    const deltaScroll = currentScrollTop - lastScrollTop.current;
    lastScrollTop.current = currentScrollTop;
    
    if (Math.abs(deltaScroll) > 0) {
      window.dispatchEvent(new CustomEvent('mobile-feed-scroll', { 
        detail: { deltaY: deltaScroll, scrollTop: currentScrollTop } 
      }));
    }
  };

  return (
    <div 
      ref={ref} 
      className={`no-scrollbar ${className}`} 
      onPointerDown={handleTouchStart}
      onPointerMove={handleTouchMove}
      onPointerUp={handleTouchEnd}
      onScroll={handleScroll}
      style={{ 
        flex: 1, 
        padding: padding, 
        display: "flex", 
        flexDirection: "column", 
        zIndex: 10, 
        overflowY: 'auto', 
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorY: 'none',
        maskImage: 'linear-gradient(to bottom, transparent 0px, black 30px, black calc(100% - 15px), transparent calc(100% - 0px))',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 30px, black calc(100% - 15px), transparent calc(100% - 0px))'
      }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .pull-refresh-spinner {
           border: 2px solid rgba(255,255,255,0.2);
           border-top-color: #fff;
           border-radius: 50%;
           width: 24px;
           height: 24px;
           animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      
      {/* Pull To Refresh Indicator */}
      {onRefresh && (
        <div style={{ 
          height: 0, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          overflow: 'visible',
          opacity: pullY / 60
        }}>
          <div style={{ 
            transform: `translateY(${pullY - 60}px) ${isRefreshing ? '' : `rotate(${pullY * 4}deg)`}`,
            transition: isRefreshing || pullY === 0 ? 'transform 0.3s ease, opacity 0.3s ease' : 'none',
            pointerEvents: 'none',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          }}>
            {isRefreshing ? (
               <div className="pull-refresh-spinner" style={{ width: '20px', height: '20px' }} />
            ) : (
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27l5.58 5.7" />
               </svg>
            )}
          </div>
        </div>
      )}

      {/* Main Content Wrapper for Spring Translation */}
      <div 
        ref={contentRef}
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "15px", 
          transform: `translateY(${pullY}px)`,
          transition: isRefreshing || pullY === 0 ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          minHeight: '100%' 
        }}
      >
        {children}
      </div>
    </div>
  );
}
