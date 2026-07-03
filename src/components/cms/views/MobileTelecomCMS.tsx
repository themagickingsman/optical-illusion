"use client";

import React, { useState, useEffect } from 'react';
import MobileChatUI from '@/components/telecom/MobileChatUI';

export default function MobileTelecomCMS() {
  const [data, setData] = useState<any>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  
  const fetchData = () => {
    fetch('/api/chat')
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
            paddingTop: '40px',
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
          
          {sortedProfiles.map((p: any) => {
            const isSelected = p.id === activeProfileId;
            const profileMessages = messages.filter((m: any) => m.profileId === p.id);
            const lastMessage = profileMessages[profileMessages.length - 1];
            const hasUnread = lastMessage && lastMessage.sender === 'user' && !isSelected;
            
            const firstLetter = (p.name && p.name.trim().length > 0) ? p.name.charAt(0).toUpperCase() : '?';

            return (
              <div 
                key={p.id}
                onClick={() => setActiveProfileId(p.id)}
                style={{
                  position: 'relative',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#fff' : '#222',
                  color: isSelected ? '#000' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-rubik), sans-serif',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #fff' : '1px solid #444',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                {firstLetter}
                
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
                    await fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'admin_reply',
                        profileId: activeProfileId,
                        text: text
                      })
                    });
                    fetchData();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                onAdminDeleteMessage={async (messageId) => {
                  try {
                    await fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'delete_message',
                        messageId
                      })
                    });
                    fetchData();
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
        </div>
      </div>
      {/* End Main Content Area (Row) */}
      </div>
    </div>
  );
}
