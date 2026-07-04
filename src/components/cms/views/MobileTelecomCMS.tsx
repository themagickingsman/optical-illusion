"use client";

import React, { useState, useEffect, useRef } from 'react';
import MobileChatUI from '@/components/telecom/MobileChatUI';
import LiveKitVideoEngine from '@/components/network-engine/assets/livekit_video_engine';

export default function MobileTelecomCMS() {
  const [data, setData] = useState<any>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handlePointerDown = (id: string) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      setDeletingProfileId(id);
    }, 600);
  };

  const handlePointerUpOrLeave = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };
  
  const fetchData = () => {
    fetch('/api/chat?asAdmin=true', { cache: 'no-store' })
      .then(res => res.json())
      .then(db => setData(db))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const profiles = data?.profiles || [];
  const messages = data?.messages || [];
  
  // Sort profiles by last active time descending
  const sortedProfiles = [...profiles].sort((a: any, b: any) => 
    new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  );

  const activeMessages = activeProfileId ? messages.filter((m: any) => m.profileId === activeProfileId) : [];
  const activeProfile = profiles.find((p: any) => p.id === activeProfileId);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#050505', color: '#fff' }}>
      
      {/* Left Column: Profiles Inbox */}
      <div style={{ width: '300px', borderRight: '1px solid #333', overflowY: 'auto', flexShrink: 0, backgroundColor: '#0a0a0a' }}>
        <h2 style={{ padding: '20px', borderBottom: '1px solid #333', margin: 0, fontSize: '18px' }}>Inbox</h2>
        {sortedProfiles.map((profile: any) => {
          const profileMessages = messages.filter((m: any) => m.profileId === profile.id);
          const isSelected = activeProfileId === profile.id;
          const isNew = profile.unread && !isSelected;

          return (
            <div 
              key={profile.id}
              onClick={() => {
                setActiveProfileId(profile.id);
                if (profile.unread) {
                  fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'mark_read', profileId: profile.id })
                  });
                  profile.unread = false; // Optimistic update
                }
              }}
              style={{ 
                padding: '15px 40px 15px 20px', 
                cursor: 'pointer',
                borderBottom: '1px solid #222',
                backgroundColor: isSelected ? '#1a1a1a' : 'transparent',
                transition: 'background 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                {profile.name || "Visitor"}
                {isNew && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)',
                    marginLeft: '10px',
                  }}></span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>{profile.email || "No email provided"}</div>
              
              <button
                onPointerDown={() => handlePointerDown(profile.id)}
                onPointerUp={handlePointerUpOrLeave}
                onPointerLeave={handlePointerUpOrLeave}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (deletingProfileId !== profile.id) return;
                  try {
                    const res = await fetch('/api/chat', { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'delete_profile', profileId: profile.id }) 
                    });
                    const data = await res.json();
                    setDeletingProfileId(null);
                    if (activeProfileId === profile.id) setActiveProfileId(null);
                    if (data.db) setData(data.db);
                    else fetchData();
                  } catch(err) { console.error(err); }
                }}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: deletingProfileId === profile.id ? '#FF3B30' : 'rgba(255,59,48,0.2)',
                  color: deletingProfileId === profile.id ? '#fff' : '#FF3B30',
                  border: '1px solid rgba(255,59,48,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title="Hold to delete"
              >
                ✕
              </button>
            </div>
          );
        })}
        {profiles.length === 0 && <div style={{ padding: '20px', color: '#666' }}>No messages yet.</div>}
      </div>

      {/* Middle Column: User Profile Details */}
      {activeProfileId && activeProfile && (
        <div style={{ width: '300px', borderRight: '1px solid #333', backgroundColor: '#0a0a0a', padding: '30px 20px', overflowY: 'auto', flexShrink: 0 }}>
          <h2 style={{ fontSize: '20px', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>User Profile</h2>
          
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Name</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{activeProfile.name || "Anonymous"}</div>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Email</div>
            <div style={{ fontSize: '16px' }}>{activeProfile.email || <span style={{ color: '#666' }}>Not provided</span>}</div>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Last Active</div>
            <div style={{ fontSize: '14px', color: '#aaa' }}>{new Date(activeProfile.lastActive).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Right Column: Chat Interface */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        {activeProfileId ? (
          <div style={{ width: '375px', height: '812px', borderRadius: '40px', overflow: 'hidden', position: 'relative', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', boxShadow: '0 0 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              backgroundImage: 'url(/assets/bg/mobile_bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#fff', 
              overflow: 'hidden'
            }}>
              {/* Build Overlay */}
              <div style={{ position: 'absolute', bottom: '95px', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                  BUILD OVERLAY
                </div>
              </div>

              <MobileChatUI 
                theme="op"
                mode="admin"
                adminMessages={activeMessages}
                adminTypingStatus={activeProfile.lastTyping && (Date.now() - new Date(activeProfile.lastTyping).getTime() < 5000)}
                onAdminSendMessage={async (text) => {
                  try {
                    const res = await fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'admin_reply',
                        profileId: activeProfileId,
                        text: text
                      })
                    });
                    const data = await res.json();
                    if (data.db) setData(data.db);
                    else fetchData();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                onAdminDeleteMessage={async (messageId) => {
                  try {
                    const res = await fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'delete_message',
                        messageId
                      })
                    });
                    const data = await res.json();
                    if (data.db) setData(data.db);
                    else fetchData();
                  } catch (err) {
                    console.error(err);
                  }
                }}
              />
              <LiveKitVideoEngine />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            Select a user on the left to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
