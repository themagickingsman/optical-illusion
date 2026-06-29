"use client";

import React from 'react';
import UGCSComponentLoader from '../cms/views/UGCSComponentLoader';

/**
 * An isolated, pristine AI Asset component that natively loads the Cosmic Racers Screensaver.
 */
export default function LiveScreensaver({ onReady }: { onReady?: () => void }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      pointerEvents: 'auto', // Allow clicks to pass through to the UI on top
    }}>
      <UGCSComponentLoader assetKey="cosmic_racer" onReady={onReady} />
    </div>
  );
}
