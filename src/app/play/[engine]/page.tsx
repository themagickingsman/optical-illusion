"use client";

import React, { use } from 'react';
import UGCSComponentLoader from '@/components/cms/views/UGCSComponentLoader';

export default function PlayEnginePage({ params }: { params: Promise<{ engine: string }> }) {
  const resolvedParams = use(params);
  let assetKey = resolvedParams.engine.replace(/-/g, '_'); // e.g. cosmic-racers -> cosmic_racers
  
  // Hardcoded route mapping for plurals matching the UGCS loader
  if (assetKey === 'cosmic_racers') {
    assetKey = 'cosmic_racer';
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', margin: 0, padding: 0, overflow: 'hidden' }}>
      <UGCSComponentLoader assetKey={assetKey} />
    </div>
  );
}
