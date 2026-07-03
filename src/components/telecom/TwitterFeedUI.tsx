"use client";

import React, { useEffect, useState } from 'react';
import PhysicsScroll from './PhysicsScroll';
import { TwitterTimelineEmbed } from 'react-twitter-embed';

export default function TwitterFeedUI() {
  const [key, setKey] = useState(Date.now());

  // Force re-mount on navigation to ensure it loads
  useEffect(() => {
    setKey(Date.now());
  }, []);

  return (
    <PhysicsScroll className="twitter-feed-scroll" padding="220px 20px 120px 20px">
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '600px', backgroundColor: 'transparent' }}>
          <TwitterTimelineEmbed
            key={key}
            sourceType="profile"
            screenName="magickingsman"
            options={{ height: 800, theme: 'dark', chrome: 'nofooter noborders transparent' }}
            noHeader
            noFooter
            noBorders
            transparent
          />
        </div>
      </div>
    </PhysicsScroll>
  );
}
