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
        <div style={{ width: '100%', maxWidth: '600px', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Marketing Promotion Banner */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(29, 155, 240, 0.1), rgba(147, 51, 234, 0.1))', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            padding: '20px', 
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '"Rubik", sans-serif'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #1d9bf0, #9333ea)' }} />
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: '0 0 10px 0' }}>Promote Your Game for Free! 🚀</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
              Just drop a post in the chat with a link to your game or your portfolio for designers and game developers. Our team pushes the best ones straight to our official X page!
            </p>
          </div>

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
