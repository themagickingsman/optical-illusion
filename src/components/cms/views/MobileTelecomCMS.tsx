"use client";

import React, { useState, useEffect, useRef } from 'react';
import MobileChatUI from '@/components/telecom/MobileChatUI';
import LiveKitVideoEngine from '@/components/network-engine/assets/livekit_video_engine';
import VirtualNumberControl from '@/components/telecom/VirtualNumberControl';
import AppleSpinner from '@/components/library/AppleSpinner';

export default function MobileTelecomCMS() {
  const [data, setData] = useState<any>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isGeneratingSms, setIsGeneratingSms] = useState(false);
  
  const handleNewSmsChat = async () => {
    setIsGeneratingSms(true);
    try {
      const getRes = await fetch('/api/telecom/virtual-number');
      const getData = await getRes.json();
      
      let numberToActivate = null;
      if (getData.availableNumbers && getData.availableNumbers.length > 0) {
        numberToActivate = getData.availableNumbers[Math.floor(Math.random() * getData.availableNumbers.length)];
      }

      if (numberToActivate) {
        const postRes = await fetch('/api/telecom/virtual-number', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: numberToActivate })
        });
        const postData = await postRes.json();
        
        if (postData.activeNumber) {
          const profileId = `virtual-sms-${postData.activeNumber.replace(/\D/g, '')}`;
          setActiveProfileId(profileId);
        }
      }
    } catch (err) {
      console.error("Failed to generate new SMS chat", err);
    }
    setIsGeneratingSms(false);
  };
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

  // Force a fetch if the active profile was just created but isn't in the list yet
  const [lastForcedProfileId, setLastForcedProfileId] = useState<string | null>(null);
  useEffect(() => {
    if (activeProfileId && data && data.profiles && !data.profiles.find((p: any) => p.id === activeProfileId)) {
      if (lastForcedProfileId !== activeProfileId) {
        setLastForcedProfileId(activeProfileId);
        fetchData();
      }
    }
  }, [activeProfileId, data, lastForcedProfileId]);

  const profiles = data?.profiles || [];
  const messages = data?.messages || [];
  
  // Sort profiles by last active time descending
  const sortedProfiles = [...(data?.profiles || [])].sort((a: any, b: any) => {
    // Put unread profiles at top
    if (a.unread && !b.unread) return -1;
    if (!a.unread && b.unread) return 1;
    // Then sort by newest activity
    const timeA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
    const timeB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
    return timeB - timeA;
  });

  const activeMessages = activeProfileId ? messages.filter((m: any) => m.profileId === activeProfileId) : [];
  const activeProfile = profiles.find((p: any) => p.id === activeProfileId);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', overflow: 'hidden' }}>
      {/* Mobile Shell Simulation Container */}
      <div style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'hidden', 
        position: 'relative', 
        backgroundColor: 'transparent', 
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: 'url(/assets/bg/mobile_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>

        {/* Full Width Header */}
        <div style={{ 
          width: '100%',
          height: '60px', 
          backgroundColor: 'rgba(0,0,0,0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          zIndex: 100,
          flexShrink: 0
        }}>
          <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', fontFamily: 'var(--font-rubik), sans-serif' }}>
            {activeProfileId ? (activeProfile?.name || 'Anonymous User') : 'Select User'}
          </div>
        </div>

        {/* Main Content Area (Row) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
          
          {/* Left Sidebar (Pips) */}
          <div 
            className="no-scrollbar"
          style={{ 
            width: '70px', 
            height: '100%', 
            backgroundColor: 'transparent', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '20px',
            paddingBottom: '40px',
            gap: '15px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            flexShrink: 0
          }}
        >
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          
          <button 
            onClick={handleNewSmsChat}
            disabled={isGeneratingSms}
            style={{ width: '40px', height: '32px', borderRadius: '16px', backgroundColor: 'transparent', color: '#03FFC0', border: '1px solid rgba(3, 255, 192, 0.3)', cursor: isGeneratingSms ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, transition: 'all 0.2s', opacity: isGeneratingSms ? 0.7 : 1 }}
            title="Generate New SMS Chat"
          >
            {isGeneratingSms ? <AppleSpinner size={14} /> : 'SMS'}
          </button>
          
          {sortedProfiles.map((p: any) => {
            const isSelected = p.id === activeProfileId;
            const profileMessages = messages.filter((m: any) => m.profileId === p.id);
            const hasUnread = p.unread && !isSelected;
            
            const firstLetter = (p.name && p.name.trim().length > 0) ? p.name.charAt(0).toUpperCase() : '?';

            return (
              <div 
                key={p.id}
                onPointerDown={() => handlePointerDown(p.id)}
                onPointerUp={handlePointerUpOrLeave}
                onPointerLeave={handlePointerUpOrLeave}
                onClick={() => {
                  if (deletingProfileId === p.id) return;
                  setDeletingProfileId(null);
                  setActiveProfileId(p.id);
                  if (p.unread) {
                    p.unread = false; // Optimistic update
                    fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'mark_read', profileId: p.id })
                    }).catch(console.error);
                  }
                }}
                style={{
                  position: 'relative',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: isSelected && deletingProfileId !== p.id ? '#fff' : '#222',
                  color: isSelected && deletingProfileId !== p.id ? '#000' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-rubik), sans-serif',
                  cursor: 'pointer',
                  border: isSelected && deletingProfileId !== p.id ? '2px solid #fff' : (deletingProfileId === p.id ? '2px solid #FF3B30' : '1px solid #444'),
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              >
                {deletingProfileId === p.id ? (
                  <span 
                    style={{ color: '#FF3B30', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await fetch('/api/chat', { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'delete_profile', profileId: p.id }) 
                        });
                        const data = await res.json();
                        setDeletingProfileId(null);
                        if (activeProfileId === p.id) setActiveProfileId(null);
                        if (data.db) setData(data.db);
                        else fetchData();
                      } catch(err) { console.error(err); }
                    }}
                  >
                    ✕
                  </span>
                ) : (
                  firstLetter
                )}
                
                {/* Unread Notification Dot */}
                {hasUnread && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '14px',
                    height: '14px',
                    backgroundColor: '#FF3B30',
                    borderRadius: '50%',
                    border: '2px solid #111'
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Right Area (Chat UI) */}
        <div style={{ 
          flex: 1, 
          height: '100%',
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative',
          backgroundColor: 'transparent'
        }}>
          {activeProfileId ? (
            <MobileChatUI 
              theme="op"
                mode="admin"
                adminMessages={activeMessages}
                adminTypingStatus={activeProfile?.lastTyping && (Date.now() - new Date(activeProfile.lastTyping).getTime() < 5000)}
                padding="20px 20px 120px 20px"
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
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', padding: '20px', textAlign: 'center', fontFamily: 'var(--font-rubik), sans-serif' }}>
              Select a user on the left to start chatting.
            </div>
          )}
          <LiveKitVideoEngine />
        </div>
      </div>
      {/* End Main Content Area (Row) */}
      </div>
    </div>
  );
}
