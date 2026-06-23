import React, { useState, useEffect } from "react";

export default function ChatCMS() {
  const [data, setData] = useState<any>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

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

  const handleReply = async () => {
    if (!replyText.trim() || !activeProfileId) return;
    
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_reply',
          profileId: activeProfileId,
          text: replyText
        })
      });
      setReplyText("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (messageId: string) => {
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
  };

  const handleDeleteProfile = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_profile',
          profileId
        })
      });
      if (activeProfileId === profileId) setActiveProfileId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!data) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;

  const profiles = data.profiles || [];
  const messages = data.messages || [];
  const ndaLinks = data.ndaLinks || [];
  
  const activeProfile = profiles.find((p: any) => p.id === activeProfileId);
  const activeMessages = messages.filter((m: any) => m.profileId === activeProfileId);
  const profileNdas = ndaLinks.filter((n: any) => n.sessionId === activeProfileId);
  const latestNda = profileNdas.sort((a:any, b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', backgroundColor: '#050505', color: '#fff' }}>
      
      {/* Left Column: Profiles Inbox */}
      <div style={{ width: '300px', borderRight: '1px solid #333', overflowY: 'auto' }}>
        <h2 style={{ padding: '20px', borderBottom: '1px solid #333', margin: 0, fontSize: '18px' }}>Inbox</h2>
        {profiles.map((profile: any) => {
          const profileMessages = messages.filter((m: any) => m.profileId === profile.id);
          const lastMessage = profileMessages[profileMessages.length - 1];
          const isNew = lastMessage && lastMessage.sender === 'user';

          return (
            <div 
              key={profile.id}
              onClick={() => setActiveProfileId(profile.id)}
              style={{ 
                padding: '15px 40px 15px 20px', 
                cursor: 'pointer',
                borderBottom: '1px solid #222',
                backgroundColor: activeProfileId === profile.id ? '#1a1a1a' : 'transparent',
                transition: 'background 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                {profile.name || "Visitor"}
                {isNew && (
                  <span style={{
                    background: '#0A84FF',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    marginLeft: '10px'
                  }}>
                    NEW
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>{profile.email || "No email provided"}</div>
              
              <button
                onClick={(e) => handleDeleteProfile(e, profile.id)}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  cursor: 'pointer',
                  opacity: 0.8
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                title="Delete Conversation"
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
        <div style={{ width: '300px', borderRight: '1px solid #333', backgroundColor: '#0a0a0a', padding: '30px 20px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>User Profile</h2>
          
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Name</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{activeProfile.name || "Anonymous"}</div>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Email</div>
            <div style={{ fontSize: '16px' }}>{activeProfile.email || "Not provided"}</div>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Last Active</div>
            <div style={{ fontSize: '14px', color: '#aaa' }}>{new Date(activeProfile.lastActive).toLocaleString()}</div>
          </div>

          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #333' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#4ade80' }}>Associated NDAs</h3>
            {profileNdas.length === 0 ? (
              <div style={{ color: '#666', fontSize: '13px' }}>No NDA submitted.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {profileNdas.map((nda: any, idx: number) => (
                  <div key={idx} style={{ background: '#111', padding: '10px', borderRadius: '8px', border: '1px solid #222' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                      {new Date(nda.timestamp).toLocaleDateString()}
                    </div>
                    <a 
                      href={nda.link} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: '#0A84FF', textDecoration: 'none', fontSize: '13px', wordBreak: 'break-all' }}
                    >
                      {nda.link}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Column: Chat Interface */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {activeProfileId ? (
          <>
            <div style={{ padding: '20px', borderBottom: '1px solid #333', backgroundColor: '#111' }}>
              <h3 style={{ margin: 0 }}>
                Chat History
              </h3>
            </div>
            
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {activeMessages.length === 0 ? (
                <div style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>No messages in this conversation.</div>
              ) : activeMessages.map((msg: any) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={msg.id} style={{
                    alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px'
                  }}>
                    <div style={{
                      backgroundColor: isAdmin ? '#0A84FF' : '#333',
                      padding: '12px 16px',
                      borderRadius: '15px',
                      borderBottomRightRadius: isAdmin ? '2px' : '15px',
                      borderBottomLeftRadius: !isAdmin ? '2px' : '15px',
                      fontSize: '15px',
                      lineHeight: '1.4'
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#666', 
                      display: 'flex', 
                      justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                      gap: '10px',
                      alignItems: 'center'
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <button 
                        onClick={() => handleDelete(msg.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #333', display: 'flex', gap: '10px', backgroundColor: '#0a0a0a' }}>
              <input 
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReply()}
                placeholder="Type your reply..."
                style={{ 
                  flex: 1, 
                  padding: '15px', 
                  borderRadius: '10px', 
                  border: '1px solid #333', 
                  backgroundColor: '#111', 
                  color: '#fff',
                  outline: 'none'
                }}
              />
              <button 
                onClick={handleReply}
                style={{ 
                  padding: '0 25px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  backgroundColor: '#4ade80', 
                  color: '#000', 
                  fontWeight: 'bold', 
                  cursor: 'pointer' 
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            Select a profile to view messages
          </div>
        )}
      </div>
    </div>
  );
}
