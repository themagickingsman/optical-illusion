"use client";

import React, { useState } from 'react';
import GSKLogin from '@/components/telecom/GSKLogin';
import MobileChatUI from '@/components/telecom/MobileChatUI';
import { useParams } from 'next/navigation';

export default function TelecomGatewayPage() {
  const params = useParams();
  const gsk = params.key as string;
  
  const [unlocked, setUnlocked] = useState(false);
  const [assetKey, setAssetKey] = useState<string | null>(null);

  const handleUnlock = (key: string) => {
    setAssetKey(key);
    setUnlocked(true);
  };

  return (
    <main style={{ width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden' }}>
      {!unlocked ? (
        <GSKLogin gsk={gsk} onUnlock={handleUnlock} />
      ) : (
        <MobileChatUI sessionId={`gsk_${gsk}_${assetKey}`} theme="op" />
      )}
    </main>
  );
}
