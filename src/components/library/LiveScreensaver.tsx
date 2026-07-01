"use client";

import React, { useEffect } from 'react';
import UGCSComponentLoader from '../cms/views/UGCSComponentLoader';
import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * An isolated, pristine AI Asset component that natively loads the Cosmic Racers Screensaver.
 */
export default function LiveScreensaver({ onReady }: { onReady?: () => void }) {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const startTime = Date.now();
    trackEvent('screensaver_started');

    return () => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      trackEvent('screensaver_ended', { duration_seconds: durationSeconds });
    };
  }, []);

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
