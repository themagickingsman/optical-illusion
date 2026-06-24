"use client";

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const SplashCursor = dynamic(() => import('./SplashCursor').then(m => m.SplashCursor), { ssr: false });

export default function EngineFlameComponent() {
  const [config, setConfig] = useState<any>(null);
  const externalEmitsRef = useRef<any[]>([]);
  const cameraDeltaRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Read the physics configuration from the external JSON file
    fetch('/flame_config.json')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Failed to load flame config:", err));
  }, []);

  useEffect(() => {
    // Listen for the ship's position to know where to render the flame
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      
      // We read the 'engineEmits' array to extract the engine emission coordinates
      if (detail && detail.engineEmits && detail.engineEmits.length > 0) {
        externalEmitsRef.current = detail.engineEmits.map((s: any) => ({
          id: s.id || 'ship-engine',
          x: s.x,
          y: s.y,
          color: s.color || '#00e5ff',
          splatRadius: s.splatRadius || 0.04
        }));
      } else {
        externalEmitsRef.current = [];
      }
    };

    window.addEventListener('SYNC_NEXUS_CURSOR', handleSync);
    return () => window.removeEventListener('SYNC_NEXUS_CURSOR', handleSync);
  }, []);

  if (!config) return null; // Wait for JSON to load

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: 'none' }}>
      <SplashCursor 
        externalEmitsRef={externalEmitsRef}
        cameraDeltaRef={cameraDeltaRef}
        SPLAT_RADIUS={config.splatRadius}
        SPLAT_FORCE={config.splatForce}
        DENSITY_DISSIPATION={config.densityDissipation}
        VELOCITY_DISSIPATION={config.velocityDissipation}
        CURL={config.curl}
        DYE_RESOLUTION={config.dyeResolution}
        SIM_RESOLUTION={config.simResolution}
        PRESSURE={config.pressure}
        PRESSURE_ITERATIONS={config.pressureIterations}
      />
    </div>
  );
}
