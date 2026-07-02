"use client";

import React, { useState } from 'react';

interface GSKLoginProps {
  gsk: string;
  onUnlock: (assetKey: string) => void;
}

export default function GSKLogin({ gsk, onUnlock }: GSKLoginProps) {
  const [assetKey, setAssetKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetKey) return;
    
    setLoading(true);
    setError('');
    
    // Simulate API call for now (we will build the real API next)
    setTimeout(() => {
      if (assetKey.length < 3) {
        setError('Asset key must be at least 3 characters.');
        setLoading(false);
      } else {
        onUnlock(assetKey);
      }
    }, 800);
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'monospace',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* OP Theme Metaball Background Glows */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(3, 255, 192, 0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255, 51, 102, 0.15) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%', maxWidth: '400px' }}>
        
        {/* Logo / Branding */}
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #03FFC0, #FF3366)', marginBottom: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px rgba(3,255,192,0.3)' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#000' }} />
        </div>

        <h1 style={{ fontSize: '24px', letterSpacing: '2px', marginBottom: '10px', textTransform: 'uppercase' }}>Secure Gateway</h1>
        
        <div style={{ fontSize: '14px', color: '#03FFC0', marginBottom: '40px', letterSpacing: '1px' }}>
          NODE: [{gsk}]
        </div>

        <form onSubmit={handleUnlock} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>ENTER ASSET KEY</label>
            <input
              type="password"
              value={assetKey}
              onChange={(e) => setAssetKey(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ''))}
              placeholder="Waiting for input..."
              style={{
                width: '100%',
                padding: '15px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                fontFamily: 'monospace',
                outline: 'none',
                backdropFilter: 'blur(10px)'
              }}
            />
          </div>
          
          {error && <div style={{ color: '#FF3366', fontSize: '12px', textAlign: 'center' }}>[ERROR] {error}</div>}

          <button
            type="submit"
            disabled={loading || !assetKey}
            style={{
              padding: '16px',
              backgroundColor: assetKey ? '#fff' : 'rgba(255,255,255,0.1)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              cursor: assetKey ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Decrypting...' : 'Unlock Channel'}
          </button>
        </form>

        <div style={{ marginTop: '40px', fontSize: '10px', color: '#555', letterSpacing: '1px', textAlign: 'center' }}>
          END-TO-END ENCRYPTED<br />PROPRIETARY TELECOM PROTOCOL
        </div>

      </div>
    </div>
  );
}
