import React, { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';

function RingingOverlay() {
  const participants = useParticipants();
  
  // If only 1 participant (the local user), show ringing
  if (participants.length <= 1) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(3, 255, 192, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
          animation: 'pulse 1.5s infinite', border: '2px solid rgba(3, 255, 192, 0.8)'
        }}>
          <span style={{ fontSize: '30px' }}>📞</span>
        </div>
        <h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>Ringing...</h2>
        <p style={{ color: '#aaa', marginTop: '10px' }}>Waiting for user to connect</p>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(3, 255, 192, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(3, 255, 192, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(3, 255, 192, 0); }
          }
        `}</style>
      </div>
    );
  }
  return null;
}

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
        video={{ facingMode: 'user' }}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={onLeave}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
        <RingingOverlay />
      </LiveKitRoom>
    </div>
  );
}
