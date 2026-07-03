"use client";

import React, { useEffect, useRef } from 'react';
import PhysicsScroll from './PhysicsScroll';

export default function TwitterFeedUI() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTwitterWidget = () => {
      if ((window as any).twttr && (window as any).twttr.widgets && containerRef.current) {
        (window as any).twttr.widgets.load(containerRef.current);
      }
    };

    if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.onload = loadTwitterWidget;
      document.body.appendChild(script);
    } else {
      setTimeout(loadTwitterWidget, 100);
    }
  }, []);

  return (
    <PhysicsScroll className="twitter-feed-scroll" padding="220px 20px 120px 20px">
      <div ref={containerRef} style={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <a 
          className="twitter-timeline" 
          data-theme="dark"
          data-chrome="nofooter noborders transparent"
          href="https://twitter.com/magickingsman?ref_src=twsrc%5Etfw"
        >
          Loading feed...
        </a>
      </div>
    </PhysicsScroll>
  );
}
