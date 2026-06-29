import React, { useState, useEffect } from "react";

export default function ChatCMS() {
  const [data, setData] = useState<any>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [activeTab, setActiveTab] = useState<'chat' | 'email'>('chat');
  const [emailTemplate, setEmailTemplate] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);

  const fetchData = () => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(db => {
        setData(db);
        if (db.emailTemplate && emailTemplate === "") {
          setEmailTemplate(db.emailTemplate);
        }
        if (db.emailSubject && emailSubject === "") {
          setEmailSubject(db.emailSubject);
        }
      })
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

  const handleSaveEmailTemplate = async () => {
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template',
          template: emailTemplate,
          subject: emailSubject
        })
      });
      alert('Template saved!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveUserEmail = async () => {
    if (!activeProfileId || !editingEmail.trim()) return;
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_email',
          profileId: activeProfileId,
          email: editingEmail.trim()
        })
      });
      setEditingEmail("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveUserName = async () => {
    if (!activeProfileId || editingName === null) return;
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_name',
          profileId: activeProfileId,
          name: editingName.trim()
        })
      });
      setEditingName(null);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#050505', color: '#fff' }}>
      {/* Top Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #333', backgroundColor: '#111' }}>
        <button 
          onClick={() => setActiveTab('chat')}
          style={{ padding: '15px 30px', border: 'none', background: activeTab === 'chat' ? '#222' : 'transparent', color: activeTab === 'chat' ? '#4ade80' : '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', borderRight: '1px solid #333' }}
        >
          Chat View
        </button>
        <button 
          onClick={() => setActiveTab('email')}
          style={{ padding: '15px 30px', border: 'none', background: activeTab === 'email' ? '#222' : 'transparent', color: activeTab === 'email' ? '#4ade80' : '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', borderRight: '1px solid #333' }}
        >
          Email Template Editor
        </button>
      </div>

      {activeTab === 'email' ? (
        <div style={{ padding: '40px', maxWidth: '800px', width: '100%' }}>
          <h2>Pre-formatted Email Template</h2>
          <p style={{ color: '#888', marginBottom: '20px' }}>
            This template will wrap your chat responses when they are sent out via email. Use <strong>{'{{message}}'}</strong> exactly like that where you want your typed response to appear.
          </p>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Subject</label>
            <input 
              type="text"
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              placeholder="New message from Optical Illusions"
              style={{ width: '100%', padding: '12px', backgroundColor: '#111', color: '#fff', border: '1px solid #333', borderRadius: '8px', fontSize: '15px' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Body Template</label>
            <textarea
              value={emailTemplate}
              onChange={(e) => setEmailTemplate(e.target.value)}
              style={{ width: '100%', height: '300px', backgroundColor: '#111', color: '#fff', padding: '20px', border: '1px solid #333', borderRadius: '8px', fontSize: '15px', fontFamily: 'monospace' }}
              placeholder={"Hi there,\n\n{{message}}\n\nThanks,\nOptical Illusions"}
            />
          </div>
          <button 
            onClick={handleSaveEmailTemplate}
            style={{ padding: '12px 30px', backgroundColor: '#0A84FF', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Save Template
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{activeProfile.name || "Anonymous"}</div>
              <button onClick={() => setEditingName(activeProfile.name || "")} style={{ background: 'none', border: 'none', color: '#0A84FF', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
            </div>
            
            {/* Name Input Field for Manual Edits */}
            {editingName !== null && (
              <div style={{ display: 'flex', marginTop: '10px', gap: '5px' }}>
                <input 
                  type="text" 
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Enter name..."
                  style={{ flex: 1, padding: '8px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', fontSize: '13px' }}
                />
                <button 
                  onClick={handleSaveUserName}
                  style={{ padding: '8px 12px', backgroundColor: '#222', color: '#4ade80', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Save
                </button>
                <button 
                  onClick={() => setEditingName(null)}
                  style={{ padding: '8px 12px', backgroundColor: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Email</div>
            {activeProfile.email ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '16px' }}>{activeProfile.email}</div>
                <button onClick={() => setEditingEmail(activeProfile.email)} style={{ background: 'none', border: 'none', color: '#0A84FF', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
              </div>
            ) : (
              <div style={{ fontSize: '16px', color: '#666' }}>Not provided</div>
            )}

            {/* Email Input Field for Manual Edits */}
            {(!activeProfile.email || editingEmail) && (
              <div style={{ display: 'flex', marginTop: '10px', gap: '5px' }}>
                <input 
                  type="email" 
                  value={editingEmail}
                  onChange={(e) => setEditingEmail(e.target.value)}
                  placeholder="Enter email address..."
                  style={{ flex: 1, padding: '8px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', fontSize: '13px' }}
                />
                <button 
                  onClick={handleSaveUserEmail}
                  style={{ padding: '8px 12px', backgroundColor: '#222', color: '#4ade80', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Save
                </button>
              </div>
            )}
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
      )}
    </div>
  );
}
