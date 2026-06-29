"use client";

import React, { useState, useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export default function AssetHandoffPortal({ onClose }: Props) {
  const [pythonScript, setPythonScript] = useState<string>('Loading script...');
  const [jsonPayload, setJsonPayload] = useState<string>('Loading payload...');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'python' | 'json'>('python');

  useEffect(() => {
    // Fetch the files we generated
    Promise.all([
      fetch('/assets/ai_handoff/unreal_niagara_importer.py').then(res => res.text()),
      fetch('/assets/ai_handoff/flame_effect.json').then(res => res.text())
    ]).then(([py, js]) => {
      setPythonScript(py);
      setJsonPayload(js);
    }).catch(e => {
      console.error("Failed to load handoff assets", e);
    });
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://optical-illusions.com/api/ai-asset/flame-fx-01-json-package");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(20px)',
      animation: 'fadeIn 0.3s ease-out',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .handoff-scrollbar::-webkit-scrollbar { width: 8px; }
        .handoff-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .handoff-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '40px',
          right: '40px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white',
          width: '50px',
          height: '50px',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      >
        ×
      </button>

      <div style={{
        width: '90%',
        maxWidth: '1400px',
        height: '80vh',
        display: 'flex',
        background: 'rgba(20, 20, 25, 0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
      }}>
        
        {/* Left Column: Live Iframe Embed of the REAL component */}
        <div style={{ flex: 1, position: 'relative', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, pointerEvents: 'none' }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: 600 }}>Cosmic Flame FX</h2>
            <p style={{ color: '#03FFC0', margin: '4px 0 0', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Production Asset</p>
          </div>
          
          <iframe
            src="http://localhost:3001/cosmic_racers/?tab=game%20assets%20fx&pageId=fx"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="Cosmic Racers Flame Effect Source"
          />
        </div>

        {/* Right Column: Code & JSON */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0D0D12' }}>
          
          {/* Header & Tabs */}
          <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', fontWeight: 500 }}>Engine Pipeline Integration</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setActiveTab('python')}
                style={{ 
                  background: activeTab === 'python' ? 'rgba(3, 255, 192, 0.1)' : 'transparent', 
                  color: activeTab === 'python' ? '#03FFC0' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${activeTab === 'python' ? '#03FFC0' : 'rgba(255,255,255,0.1)'}`,
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                unreal_importer.py
              </button>
              <button 
                onClick={() => setActiveTab('json')}
                style={{ 
                  background: activeTab === 'json' ? 'rgba(3, 255, 192, 0.1)' : 'transparent', 
                  color: activeTab === 'json' ? '#03FFC0' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${activeTab === 'json' ? '#03FFC0' : 'rgba(255,255,255,0.1)'}`,
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                flame_effect.json
              </button>
            </div>
          </div>

          {/* Code Editor Area */}
          <div className="handoff-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
            <pre style={{ 
              margin: 0, 
              color: '#A9B2C3', 
              fontSize: '13px', 
              fontFamily: 'Menlo, Monaco, Consolas, monospace',
              lineHeight: '1.6'
            }}>
              <code>
                {activeTab === 'python' ? pythonScript : jsonPayload}
              </code>
            </pre>
          </div>

          {/* Call to Action Footer */}
          <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 20px 0 0' }}>Paste into an AI Agent to instantly generate the Engine Asset.</p>
            <button 
              onClick={handleCopy}
              style={{
                background: copied ? '#4CAF50' : '#03FFC0',
                color: '#000',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: copied ? '0 0 20px rgba(76, 175, 80, 0.4)' : '0 0 20px rgba(3, 255, 192, 0.3)'
              }}
            >
              {copied ? 'Copied to Clipboard!' : 'Copy AI Asset Key'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
