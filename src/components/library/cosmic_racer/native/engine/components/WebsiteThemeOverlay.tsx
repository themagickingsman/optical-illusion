import React, { useState, useEffect } from 'react';
import { resolveAssetUrl } from '../../config/asset_resolver';
import CheckoutOverlay from '../../components/CheckoutOverlay';

const PHRASES = [
  "1:3 Trillion ratio simulation of solar system",
  "Take control and fly your ships around the planets",
  "Fact: At 1:3 Trillion scale, 1 pixel equals 768 kilometers",
  "Fact: Your ship is currently traveling at 16x the speed of light",
  "Fact: A real-time lightspeed journey to Earth would take 8.3 minutes",
  "Warning: Gravity wells from gas giants will impact your flight path",
  "Fact: Jupiter is so massive that 1,300 Earths could fit inside it",
  "Explore the entire solar system",
  "Ship customizations dropping soon",
  "New Ships Available Now!",
  "Install Now $2.99"
];

export default function WebsiteThemeOverlay() {
  const [count, setCount] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const messages = [];
  // Render the last 4 messages so the oldest can fade out smoothly
  for (let i = Math.max(0, count - 3); i <= count; i++) {
    messages.push(i);
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1999, pointerEvents: 'none', overflow: 'hidden'
    }}>
      {showCheckout && (
        <CheckoutOverlay onClose={() => setShowCheckout(false)} />
      )}

      {/* Background/Overlay Lines Graphic moved to CosmicRenderer to support mixBlendMode */}

      {/* Top Left: Resolution Badges */}
      <div style={{ position: 'absolute', top: '55px', left: '25px', display: 'flex', gap: '8px' }}>
        <img src={resolveAssetUrl("/overlays/website/8K (1).png")} alt="8K/4K Quality" />
      </div>

      {/* Top Center: HD High Definition Badge */}
      <div style={{ position: 'absolute', top: '55px', left: '50%', transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img src={resolveAssetUrl("/overlays/website/hd.png")} alt="HD High Definition" />
      </div>

      {/* Top Right: Autoplay Games Logo */}
      <div style={{ position: 'absolute', top: '55px', right: '195px', transform: 'translateX(50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img src={resolveAssetUrl("/overlays/website/logo (4).png")} alt="Autoplay Games" style={{ height: '42px', objectFit: 'contain' }} />
      </div>

      {/* Middle Right: New Ship Promo Graphic */}
      <div style={{ position: 'absolute', top: '50%', right: '-155px', transform: 'translateY(-50%)', marginTop: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img src={resolveAssetUrl("/overlays/website/package (2).png")} alt="New Ship Promo" style={{ filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))' }} />
      </div>

      {/* Bottom Left: Cosmic Racers Logo & Footer Info */}
      <div style={{ position: 'absolute', bottom: '30px', left: '45px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'flex-end', alignItems: 'flex-start' }}>

        <style>{`
          @keyframes slideInMessage {
            0% { max-height: 0px; padding-top: 0px; padding-bottom: 0px; margin-top: 0px; transform: translateY(20px); border-width: 0px; }
            100% { max-height: 38px; padding-top: 10px; padding-bottom: 10px; margin-top: 8px; transform: translateY(0px); border-width: 1px; }
          }
          @keyframes fadeInMessage {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>

        {/* iMessage Style Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '34px', alignItems: 'flex-start' }}>
          {messages.map(absoluteIndex => {
            const age = count - absoluteIndex;
            const phraseIndex = absoluteIndex % PHRASES.length;
            const isInstall = PHRASES[phraseIndex].includes('Install Now');
            let msgOpacity = 1;
            if (age === 1) msgOpacity = 0.4;
            if (age === 2) msgOpacity = 0.1;
            if (age >= 3) msgOpacity = 0;

            return (
              <div key={absoluteIndex} style={{
                marginTop: '8px',
                background: isInstall ? 'rgba(34, 197, 94, 0.85)' : 'rgba(88, 28, 135, 0.85)',
                border: isInstall ? '1px solid rgba(34, 197, 94, 0.8)' : '1px solid rgba(255, 136, 32, 0.3)',
                padding: '10px 18px',
                borderRadius: '20px',
                fontFamily: '"Rubik", sans-serif',
                fontSize: '16px',
                lineHeight: '16px',
                fontWeight: 'bold',
                color: '#FFF5DD',
                textAlign: 'left',
                opacity: msgOpacity,
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), background 0.6s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                animation: 'slideInMessage 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards, fadeInMessage 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {PHRASES[phraseIndex]}
              </div>
            )
          })}
        </div>

        <img src={resolveAssetUrl("/overlays/website/logo (2).png")} alt="Cosmic Racers" style={{ transform: 'scale(1.15)', transformOrigin: 'left bottom' }} />
        {/* Footer Text Replacement: Collect Graphic */}
        <img src={resolveAssetUrl("/overlays/website/collect.png")} alt="Collect" style={{ marginTop: '-19px', transform: 'translateY(-20px)', marginLeft: '4px' }} />
      </div>

      {/* Bottom Center: Directional D-pad Controls */}
      <div style={{ position: 'absolute', bottom: '55px', left: '50%', transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img src={resolveAssetUrl("/overlays/website/keyboar (2).png")} alt="Controls" style={{ opacity: 0.8, mixBlendMode: 'overlay' }} />
      </div>

      {/* Bottom Right: Install & Purchase Controls */}
      <div style={{ position: 'absolute', bottom: '10px', right: '185px', transform: 'translateX(50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
        {/* Install Button Graphic */}
        <img
          src={resolveAssetUrl("/overlays/website/INSTALL SCREENSAVER.png")}
          alt="Install Screensaver"
          onClick={() => setShowCheckout(true)}
          style={{ cursor: 'pointer', transition: 'transform 0.2s', transformOrigin: 'center', transform: 'scale(1.0)', pointerEvents: 'auto' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
        />
      </div>

    </div>
  );
}
