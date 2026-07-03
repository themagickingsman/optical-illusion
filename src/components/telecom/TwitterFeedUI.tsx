"use client";

import React, { useEffect } from 'react';
import PhysicsScroll from './PhysicsScroll';

export default function TwitterFeedUI() {
  useEffect(() => {
    // Inject the Twitter widget script if it doesn't exist
    if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // If it already exists, force a re-render of the widgets
      if ((window as any).twttr && (window as any).twttr.widgets) {
        (window as any).twttr.widgets.load();
      }
    }
  }, []);

  return (
    <PhysicsScroll className="twitter-feed-scroll" padding="220px 20px 120px 20px">
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
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
