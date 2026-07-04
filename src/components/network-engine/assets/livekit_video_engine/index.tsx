import React, { useState, useEffect } from 'react';
import { useVideoStore } from '@/store/useVideoStore';
import { useVideoSession } from './logic/useVideoSession';
import VideoUI from './assets/VideoUI';

export default function LiveKitVideoEngine({ isAdmin = false }: { isAdmin?: boolean }) {
  const { activeRoomId, leaveRoom } = useVideoStore();
  const { token, loading, error } = useVideoSession(activeRoomId);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-detect admin from URL if prop is not passed (fallback)
  const isActuallyAdmin = isAdmin || (typeof window !== 'undefined' && window.location.search.includes('admin'));

  useEffect(() => {
    if (showInviteModal) {
      fetch('/api/chat?asAdmin=true')
        .then(res => res.json())
        .then(data => {
          if (data.profiles) setProfiles(data.profiles);
        })
        .catch(console.error);
    }
  }, [showInviteModal]);

  const inviteUser = async (profileId: string) => {
    if (!activeRoomId) return;
    setSendingTo(profileId);
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_reply',
          profileId: profileId,
          text: `[VIDEO_CALL|${activeRoomId}]`
        })
      });
      setTimeout(() => {
        setSendingTo(null);
        setShowInviteModal(false);
      }, 500); // Give user a brief visual feedback
    } catch (e) {
      console.error(e);
      setSendingTo(null);
    }
  };

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

      {isActuallyAdmin && (
        <button 
          onClick={() => setShowInviteModal(!showInviteModal)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '150px',
            zIndex: 10000,
            background: showInviteModal ? '#fff' : 'rgba(255,255,255,0.2)',
            color: showInviteModal ? '#000' : 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          {showInviteModal ? '✕ Cancel' : '➕ Invite'}
        </button>
      )}

      {/* Invite Modal Overlay */}
      {showInviteModal && isActuallyAdmin && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '20px',
          right: '20px',
          bottom: '20px',
          background: 'rgba(20, 20, 20, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
              Invite to Group Call
            </div>
            <input 
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 15px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
            {profiles.filter(p => (p.name || 'Anonymous User').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div style={{ color: '#888', padding: '10px', textAlign: 'center', fontSize: '14px' }}>No active users found.</div>
            ) : (
              profiles
                .filter(p => (p.name || 'Anonymous User').toLowerCase().includes(searchQuery.toLowerCase()))
                .map(p => (
                <div 
                  key={p.id}
                  onClick={() => inviteUser(p.id)}
                  style={{
                    padding: '12px 15px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    color: '#fff',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.name || 'Anonymous User'}</span>
                    <span style={{ fontSize: '11px', color: '#888' }}>{p.ip || 'Unknown Location'}</span>
                  </div>
                  {sendingTo === p.id ? (
                    <span style={{ color: '#03FFC0', fontSize: '12px', fontWeight: 'bold' }}>Sent!</span>
                  ) : (
                    <span style={{ color: '#fff', opacity: 0.5 }}>➕</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
