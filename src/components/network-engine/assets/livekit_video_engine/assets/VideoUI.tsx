import React, { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';

interface VideoUIProps {
  token: string;
  serverUrl: string;
  onLeave: () => void;
}

export default function VideoUI({ token, serverUrl, onLeave }: VideoUIProps) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 9999,
      backgroundColor: 'black',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <LiveKitRoom
        video={{
          facingMode: 'user',
          resolution: { width: 720, height: 1280, frameRate: 30, aspectRatio: 9/16 }
        }}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={onLeave}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
