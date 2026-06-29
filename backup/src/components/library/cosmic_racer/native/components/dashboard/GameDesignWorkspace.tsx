import React, { useState, useEffect, useMemo } from 'react';
import { fetchAndHydrateShips } from './game_design_logic';

export function GameDesignWorkspace() {
  const [activeTab, setActiveTab] = useState<'linear_progression' | 'liveops_v1'>('linear_progression');
  
  // Data State
  const [ships, setShips] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  
  // Progression State
  const [progressionEnabled, setProgressionEnabled] = useState(false);
  const [shipOrder, setShipOrder] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Hydrate from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'linear_progression' || viewParam === 'liveops_v1') {
      setActiveTab(viewParam);
    }
  }, []);

  // Fetch Ships and Config
  useEffect(() => {
    Promise.all([
      fetchAndHydrateShips(),
      fetch('/api/cms?key=season_01_progression').then(r => r.json())
    ]).then(([hydratedShips, configRes]) => {
      setShips(hydratedShips);
      const conf = configRes.data || {};
      setConfig(conf);
      
      setProgressionEnabled(!!conf.progressionModeEnabled);
      
      const savedOrder = conf.progressionShipOrder || [];
      // Merge saved order with newly added ships just in case
      const activeIds = hydratedShips.map(s => s.id);
      const validSavedOrder = savedOrder.filter((id: string) => activeIds.includes(id));
      const missingIds = activeIds.filter(id => !validSavedOrder.includes(id));
      setShipOrder([...validSavedOrder, ...missingIds]);
    }).catch(e => console.error("Failed to load game design data", e));
  }, []);

  const handleTabChange = (tab: 'linear_progression' | 'liveops_v1') => {
    setActiveTab(tab);
    window.history.pushState(null, '', `?group=world%20engine&tab=game%20design&view=${tab}`);
  };

  const moveShip = (index: number, direction: -1 | 1) => {
    const newOrder = [...shipOrder];
    if (index + direction < 0 || index + direction >= newOrder.length) return;
    
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + direction];
    newOrder[index + direction] = temp;
    setShipOrder(newOrder);
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    
    const newConfig = {
      ...config,
      progressionModeEnabled: progressionEnabled,
      progressionShipOrder: shipOrder
    };
    
    try {
      await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'season_01_progression', data: newConfig })
      });
      setConfig(newConfig);
      // Dispatch event to notify engine of live config changes
      window.dispatchEvent(new CustomEvent('arn_progression_config_updated'));
    } catch(e) {
      console.error("Save failed", e);
    }
    
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <div style={{ width: "100%", minHeight: "100%", background: "#050511", color: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header / Tabs */}
      <div style={{ padding: "20px 30px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "20px", background: "rgba(0,0,0,0.3)" }}>
        <button 
          id="tab-linear-progression"
          onClick={() => handleTabChange('linear_progression')}
          style={{ 
            background: "none", border: "none", 
            color: activeTab === 'linear_progression' ? "#38bdf8" : "#888", 
            fontSize: "16px", fontWeight: activeTab === 'linear_progression' ? "bold" : "normal", 
            cursor: "pointer", borderBottom: activeTab === 'linear_progression' ? "2px solid #38bdf8" : "2px solid transparent",
            paddingBottom: "8px"
          }}
        >
          📈 Linear Progression
        </button>
        <button 
          id="tab-liveops-v1"
          onClick={() => handleTabChange('liveops_v1')}
          style={{ 
            background: "none", border: "none", 
            color: activeTab === 'liveops_v1' ? "#a855f7" : "#888", 
            fontSize: "16px", fontWeight: activeTab === 'liveops_v1' ? "bold" : "normal", 
            cursor: "pointer", borderBottom: activeTab === 'liveops_v1' ? "2px solid #a855f7" : "2px solid transparent",
            paddingBottom: "8px"
          }}
        >
          ⚡ LiveOps_v1
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: "30px" }}>
        {activeTab === 'linear_progression' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: "24px", margin: 0, color: "#38bdf8" }}>Linear Progression Session</h2>
                <button 
                  onClick={handleSave}
                  style={{ background: isSaving ? '#22c55e' : '#38bdf8', color: '#000', border: 'none', padding: '8px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {isSaving ? 'SAVED ✓' : 'SAVE CHANGES'}
                </button>
            </div>
            
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "30px", display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Session Progression Mode</h3>
                      <p style={{ margin: '4px 0 0', color: '#888', fontSize: '14px' }}>Locks the ship roster and requires players to unlock ships sequentially based on travel distance (power curve scaling over multiple weeks).</p>
                  </div>
                  <button 
                      onClick={() => setProgressionEnabled(!progressionEnabled)}
                      style={{ 
                          width: '60px', height: '32px', borderRadius: '16px', border: 'none', 
                          background: progressionEnabled ? '#38bdf8' : '#333', 
                          position: 'relative', cursor: 'pointer', transition: 'background 0.3s' 
                      }}
                  >
                      <div style={{ 
                          width: '24px', height: '24px', borderRadius: '50%', background: '#fff', 
                          position: 'absolute', top: '4px', left: progressionEnabled ? '32px' : '4px', transition: 'left 0.3s' 
                      }} />
                  </button>
              </div>

              <div style={{ opacity: progressionEnabled ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#fff' }}>Unlock Sequence</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {shipOrder.map((shipId, idx) => {
                          const ship = ships.find(s => s.id === shipId);
                          if (!ship) return null;
                          
                          // 267 K-Scale * 1.618 Golden Ratio power curve
                          const auReq = idx === 0 ? 0 : 267 * Math.pow(1.618, idx);
                          const hoursReq = auReq / 30; // ~30 AU/H average cruising speed
                          const daysReq = hoursReq / 24;
                          const reqString = idx === 0 ? 'Unlocked immediately' : `Unlocks at ${auReq.toLocaleString(undefined, {maximumFractionDigits:1})} AU (~${daysReq < 1 ? hoursReq.toFixed(1) + ' Hours' : daysReq.toFixed(1) + ' Days'})`;
                          
                          // imagePath is now always set by the unified hydration (static asset path)
                          const imageUrl = ship.imagePath || '';

                          return (
                              <div key={shipId} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#38bdf8', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                                      {idx + 1}
                                  </div>
                                  <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', background: '#0a0a0a', flexShrink: 0, border: '1px solid #222' }}>
                                      <img src={imageUrl} alt={ship.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#fff' }}>{ship.name}</div>
                                      <div style={{ fontSize: '14px', color: '#38bdf8', marginTop: '4px', fontWeight: 'bold' }}>{reqString}</div>
                                      {!progressionEnabled && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>Toggle "Session Progression Mode" ON to enable ordering.</div>}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: progressionEnabled ? 'auto' : 'none' }}>
                                      <button 
                                          onClick={() => moveShip(idx, -1)} 
                                          disabled={idx === 0}
                                          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: '16px' }}
                                      >▲</button>
                                      <button 
                                          onClick={() => moveShip(idx, 1)} 
                                          disabled={idx === shipOrder.length - 1}
                                          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px', cursor: idx === shipOrder.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === shipOrder.length - 1 ? 0.3 : 1, fontSize: '16px' }}
                                      >▼</button>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'liveops_v1' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "24px", margin: 0, color: "#a855f7" }}>LiveOps_v1</h2>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "30px", minHeight: "400px" }}>
              <p style={{ color: "#aaa" }}>Manage active events, seasonal content, limited-time offers, and dynamic game tuning here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
