"use client";

import React, { useEffect, useRef } from 'react';

interface PhysicsScrollProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

export default function PhysicsScroll({ children, className = '', padding = '20px', scrollRef }: PhysicsScrollProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = scrollRef || internalRef;

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let bubblesPhysics: { y: number, offsetTop: number }[] = [];
    let lastScrollTop = container.scrollTop;
    let animationFrameId: number;
    let activeAnchor = 0;
    let lastScrollHeight = 0;

    const loop = () => {
      const currentScrollTop = container.scrollTop;
      const currentScrollHeight = container.scrollHeight;
      const deltaScroll = currentScrollTop - lastScrollTop;
      lastScrollTop = currentScrollTop;

      if (Math.abs(deltaScroll) > 0) {
        window.dispatchEvent(new CustomEvent('mobile-feed-scroll', { 
          detail: { deltaY: deltaScroll, scrollTop: currentScrollTop } 
        }));
      }

      // Only target direct children that are standard elements
      const bubbles = Array.from(container.children).filter(el => (el as HTMLElement).tagName !== 'STYLE' && (el as HTMLElement).id !== 'physics-anchor');
      if (bubbles.length === 0) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      if (bubblesPhysics.length !== bubbles.length || lastScrollHeight !== currentScrollHeight) {
        bubblesPhysics = Array.from({ length: bubbles.length }).map((_, i) => {
          const el = bubbles[i] as HTMLElement;
          return { y: bubblesPhysics[i]?.y || 0, offsetTop: el.offsetTop, offsetHeight: el.offsetHeight };
        });
        lastScrollHeight = currentScrollHeight;
      }

      const viewportCenter = currentScrollTop + container.clientHeight / 2;

      if (deltaScroll !== 0) {
        bubblesPhysics.forEach((phys) => {
           phys.y += deltaScroll; 
        });
      }

      bubbles.forEach((bubble, i) => {
        const el = bubble as HTMLElement;
        const phys = bubblesPhysics[i];

        // 1. Smooth Spring Physics (No Jumping Anchors)
        // We use cached offsetTop/Height to prevent massive layout thrashing (forced synchronous layout).
        const center = phys.offsetTop + phys.offsetHeight / 2;
        const dist = Math.abs(center - viewportCenter);
        
        // Elements near the center snap back faster (0.3), elements at edges lag more (0.1)
        const normalizedDist = Math.min(dist / container.clientHeight, 1);
        const stiffness = 0.3 - (normalizedDist * 0.2);
        
        phys.y += (0 - phys.y) * stiffness;

        if (Math.abs(phys.y) > 0.1 || Math.abs(deltaScroll) > 0) {
          el.style.transform = `translateY(${phys.y}px)`;
        }
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div 
      ref={ref} 
      className={`no-scrollbar ${className}`} 
      style={{ 
        flex: 1, 
        padding: padding, 
        display: "flex", 
        flexDirection: "column", 
        gap: "15px", 
        zIndex: 10, 
        overflowY: 'auto', 
        WebkitOverflowScrolling: 'touch',
        maskImage: 'linear-gradient(to bottom, transparent 0px, black 30px, black calc(100% - 110px), transparent calc(100% - 50px))',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 30px, black calc(100% - 110px), transparent calc(100% - 50px))'
      }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {children}
    </div>
  );
}
