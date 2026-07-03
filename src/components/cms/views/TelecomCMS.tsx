import React, { useState, useEffect } from 'react';
import ArchitectureCMS from "./ArchitectureCMS";
import TriangleCMS from "./TriangleCMS";
import SquareCMS from "./SquareCMS";
import MobileChatUI from '@/components/telecom/MobileChatUI';

export default function TelecomCMS() {
  // --- Telecom Keys (GSK) State ---
  const [keys, setKeys] = useState<{ gsk: string, assetKey: string | null }[]>([]);
  const [newGsk, setNewGsk] = useState('');

  // --- Chat & Communications State ---
  const [data, setData] = useState<any>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [activeTab, setActiveTab] = useState<'keys' | 'chat' | 'email' | 'architecture' | 'triangle' | 'square'>('chat');
  const [emailTemplate, setEmailTemplate] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);

  // --- Telecom Logic ---
  const generateKey = () => {
    if (!newGsk || newGsk.length > 18) return;
    setKeys([...keys, { gsk: newGsk, assetKey: null }]);
    setNewGsk('');
  };

  const deleteKey = (gskToDelete: string) => {
    setKeys(keys.filter(k => k.gsk !== gskToDelete));
  };

  // --- Chat Logic ---
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#050505', color: '#fff' }}>
      {/* Top Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #333', backgroundColor: '#111' }}>
        <button 
          onClick={() => setActiveTab('chat')}
          style={{ position: 'relative', padding: '15px 30px', border: 'none', background: activeTab === 'chat' ? '#222' : 'transparent', color: activeTab === 'chat' ? '#4ade80' : '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', borderRight: '1px solid #333' }}
        >
          Chat View
          {profiles.some((p: any) => p.unread) && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)' }} />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('keys')}
          style={{ padding: '15px 30px', border: 'none', background: activeTab === 'keys' ? '#222' : 'transparent', color: activeTab === 'keys' ? '#03FFC0' : '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', borderRight: '1px solid #333' }}
        >
          Network Keys
        </button>
        <button 
          onClick={() => setActiveTab('email')}
          style={{ padding: '15px 30px', border: 'none', background: activeTab === 'email' ? '#222' : 'transparent', color: activeTab === 'email' ? '#4ade80' : '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', borderRight: '1px solid #333' }}
        >
          Email Template Editor
        </button>
        <button 
          onClick={() => setActiveTab('architecture')}
          style={{ padding: '15px 30px', border: 'none', background: activeTab === 'architecture' ? '#222' : 'transparent', color: activeTab === 'architecture' ? '#4ade80' : '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', borderRight: '1px solid #333' }}
        >
          Architecture
        </button>
        <button 
          onClick={() => setActiveTab('triangle')}
          style={{ padding: '15px 30px', border: 'none', background: activeTab === 'triangle' ? '#222' : 'transparent', color: activeTab === 'triangle' ? '#4ade80' : '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', borderRight: '1px solid #333' }}
        >
          Command Center
        </button>
        <button 
          onClick={() => setActiveTab('square')}
          style={{ padding: '15px 30px', border: 'none', background: activeTab === 'square' ? '#222' : 'transparent', color: activeTab === 'square' ? '#03FFC0' : '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', borderRight: '1px solid #333' }}
        >
          Publish
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'keys' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#050505', color: '#fff', padding: '40px', overflowY: 'auto' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#03FFC0' }}>Telecom Terminal</h1>
            <p style={{ color: '#888', marginBottom: '40px' }}>Manage your Global Social Keys (GSK). These are the public entry points for your direct comms.</p>

            <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #222', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Generate New GSK</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newGsk}
                  onChange={(e) => setNewGsk(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  maxLength={18}
                  placeholder="e.g. lifeisgood"
                  style={{ flex: 1, padding: '15px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', borderRadius: '8px', fontSize: '16px' }}
                />
                <button
                  onClick={generateKey}
                  style={{ padding: '0 30px', backgroundColor: '#03FFC0', color: '#000', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  INITIALIZE KEY
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Active Nodes</h2>
              {keys.length === 0 ? (
                <div style={{ color: '#555', fontStyle: 'italic' }}>No active keys. Initialize a new GSK above.</div>
              ) : (
                keys.map((k, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a0a0a', padding: '20px', border: '1px solid #222', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                        {typeof window !== 'undefined' ? window.location.origin.replace(/^https?:\/\//, '') : 'domain'}/k/{k.gsk}
                      </div>
                      <div style={{ fontSize: '14px', color: k.assetKey ? '#03FFC0' : '#FF3366', marginTop: '5px' }}>
                        {k.assetKey ? `LOCKED: ${k.assetKey}` : 'PENDING: Unclaimed'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          const domain = typeof window !== 'undefined' ? window.location.origin : '';
                          const html = `<a href="${domain}/k/${k.gsk}">${k.gsk}</a>`;
                          const blob = new Blob([html], { type: 'text/html' });
                          const data = [new window.ClipboardItem({ 'text/html': blob })];
                          navigator.clipboard.write(data);
                          alert('Rich text link copied to clipboard!');
                        }}
                        style={{ padding: '10px 20px', backgroundColor: 'rgba(3, 255, 192, 0.1)', color: '#03FFC0', border: '1px solid rgba(3, 255, 192, 0.3)', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Copy Ghost Link
                      </button>
                      <button
                        onClick={() => deleteKey(k.gsk)}
                        style={{ padding: '10px 20px', backgroundColor: 'rgba(255, 51, 102, 0.1)', color: '#FF3366', border: '1px solid rgba(255, 51, 102, 0.3)', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        REVOKE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'architecture' && <ArchitectureCMS />}
        {activeTab === 'triangle' && <TriangleCMS />}
        {activeTab === 'square' && <SquareCMS />}

        {activeTab === 'email' && (
          <div style={{ padding: '40px', maxWidth: '800px', width: '100%', height: '100%', overflowY: 'auto' }}>
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
        )}

        {activeTab === 'chat' && (
          <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Left Column: Profiles Inbox */}
            <div style={{ width: '300px', borderRight: '1px solid #333', overflowY: 'auto', flexShrink: 0 }}>
              <h2 style={{ padding: '20px', borderBottom: '1px solid #333', margin: 0, fontSize: '18px' }}>Inbox</h2>
              {profiles.map((profile: any) => {
                const profileMessages = messages.filter((m: any) => m.profileId === profile.id);
                const lastMessage = profileMessages[profileMessages.length - 1];
                const isNew = profile.unread;

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
                        // Optimistically update local state so the dot disappears immediately
                        profile.unread = false;
                      }
                    }}
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
                          backgroundColor: '#ef4444',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)',
                          marginLeft: '10px',
                          animation: 'pulseDot 2s infinite'
                        }}></span>
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
              <div style={{ width: '300px', borderRight: '1px solid #333', backgroundColor: '#0a0a0a', padding: '30px 20px', overflowY: 'auto', flexShrink: 0 }}>
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' }}>
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
                    <MobileChatUI 
                      theme="op"
                      mode="admin"
                      adminMessages={activeMessages}
                      adminTypingStatus={activeProfile.lastTyping && (Date.now() - new Date(activeProfile.lastTyping).getTime() < 5000)}
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
                    />
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  Select a profile to view messages
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
