"use client";

import React, { useState, useEffect } from 'react';
import GSKLogin from '@/components/telecom/GSKLogin';
import MobileChatUI from '@/components/telecom/MobileChatUI';
import LiveKitVideoEngine from '@/components/network-engine/assets/livekit_video_engine';
import { useParams } from 'next/navigation';

export default function TelecomGatewayPage() {
  const params = useParams();
  const gsk = params.key as string;
  
  const [unlocked, setUnlocked] = useState(false);
  const [assetKey, setAssetKey] = useState<string | null>(null);
  const [inviteSession, setInviteSession] = useState<string | null>(null);

  useEffect(() => {
    if (gsk === 'invite') {
      const urlParams = new URLSearchParams(window.location.search);
      const t = urlParams.get('t');
      if (t) {
        setInviteSession(t);
        setUnlocked(true);
      }
    }
  }, [gsk]);

  const handleUnlock = (key: string) => {
    setAssetKey(key);
    setUnlocked(true);
  };

  const sessionId = inviteSession ? inviteSession : `gsk_${gsk}_${assetKey}`;

  return (
    <main style={{ width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden' }}>
      {!unlocked ? (
        <GSKLogin gsk={gsk} onUnlock={handleUnlock} />
      ) : (
        <>
          <MobileChatUI sessionId={sessionId} theme="op" />
          <LiveKitVideoEngine />
        </>
      )}
    </main>
  );
}
