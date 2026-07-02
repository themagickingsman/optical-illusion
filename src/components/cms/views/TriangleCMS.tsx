"use client";

import React, { useState } from 'react';
import NetworkEngine from '../../network-engine/NetworkEngine';

export default function TriangleCMS() {
  const [activeTab, setActiveTab] = useState<'reddit' | 'dribbble' | 'behance' | 'x' | 'linkedin' | 'discord' | 'artstation'>('reddit');

  const tabs = [
    { id: 'reddit', label: 'Reddit' },
    { id: 'dribbble', label: 'Dribbble' },
    { id: 'behance', label: 'Behance' },
    { id: 'x', label: 'X / Twitter' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'discord', label: 'Discord' },
    { id: 'artstation', label: 'ArtStation' }
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#000', color: '#fff' }}>
      
      {/* Command Center Sub-Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid #222', backgroundColor: '#050505', padding: '0 20px', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{ 
              padding: '15px 25px', 
              border: 'none', 
              background: 'transparent', 
              color: activeTab === tab.id ? '#03FFC0' : '#666', 
              borderBottom: activeTab === tab.id ? '2px solid #03FFC0' : '2px solid transparent',
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Engine Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'reddit' ? (
          <NetworkEngine />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '24px', color: '#888' }}>{tabs.find(t => t.id === activeTab)?.label} Engine</h2>
            <div style={{ padding: '10px 20px', backgroundColor: 'rgba(3, 255, 192, 0.1)', color: '#03FFC0', borderRadius: '20px', border: '1px solid rgba(3, 255, 192, 0.2)', fontSize: '14px' }}>
              Module Pending Implementation
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
