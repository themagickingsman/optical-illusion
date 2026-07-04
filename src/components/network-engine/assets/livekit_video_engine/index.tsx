import React from 'react';
import { useVideoStore } from '@/store/useVideoStore';
import { useVideoSession } from './logic/useVideoSession';
import VideoUI from './assets/VideoUI';

export default function LiveKitVideoEngine() {
  const { activeRoomId, leaveRoom } = useVideoStore();
  const { token, loading, error } = useVideoSession(activeRoomId);

  if (!activeRoomId) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 9999, // Overlay on top of everything
      backgroundColor: 'black'
    }}>
      {loading && <div style={{ color: 'white', padding: '20px' }}>Connecting to Video Room...</div>}
      {error && <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>}
      {token && (
        <VideoUI 
          token={token} 
          serverUrl="wss://optical-illusions-p6n5qk8i.livekit.cloud" 
          onLeave={leaveRoom} 
        />
      )}
      <button 
        onClick={leaveRoom}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          background: 'rgba(255,59,48,0.8)',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Close Video
      </button>
    </div>
  );
}
