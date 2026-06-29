import React, { useState, useEffect } from 'react';
import MARKET_ITEMS from '../../config/market_items.json';

interface ActiveLoadout {
    weapon1: string | null;
    weapon2: string | null;
    defense: string | null;
    engine: string | null;
    utility1: string | null;
    utility2: string | null;
    rune1: string | null;
    rune2: string | null;
    rune3: string | null;
}

export function GarageMenu({ shipType = 0, onClose }: { shipType?: number, onClose: () => void }) {
    const [ownedItems, setOwnedItems] = useState<any[]>([]);
    const [ownedRunes, setOwnedRunes] = useState<string[]>([]);
    const [activeLoadout, setActiveLoadout] = useState<ActiveLoadout>({
        weapon1: null, weapon2: null, defense: null, engine: null, utility1: null, utility2: null, rune1: null, rune2: null, rune3: null
    });
    const [selectedSlot, setSelectedSlot] = useState<keyof ActiveLoadout | null>(null);

    const shipConfigs = [
        { name: "VANGUARD CLASS", color: "#38bdf8", stroke: "#0ea5e9", svg: <path d="M -8 8 L 0 -8 L 8 8 L 0 4 Z" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="0.5" filter="drop-shadow(0 0 5px #0ea5e9)" /> },
        { name: "FALCOR INTERCEPTOR", color: "#fca5a5", stroke: "#ef4444", svg: <polygon points="0,-12 8,8 0,4 -8,8" fill="rgba(239, 68, 68, 0.8)" stroke="#fca5a5" strokeWidth="1" filter="drop-shadow(0 0 8px #ef4444)" /> },
        { name: "TARTARUS JUGGERNAUT", color: "#eab308", stroke: "#fef08a", svg: <path d="M -10 -6 L 10 -6 L 14 6 L 8 10 L -8 10 L -14 6 Z" fill="rgba(234, 179, 8, 0.8)" stroke="#fef08a" strokeWidth="1" filter="drop-shadow(0 0 8px #eab308)" /> }
    ];
    const cfg = shipConfigs[shipType] || shipConfigs[0];

    useEffect(() => {
        try {
            const rawInv = localStorage.getItem("arn_inventory");
            if (rawInv) {
                const inv = JSON.parse(rawInv);
                const allItemsDict = { ...(inv.equipment || {}), ...(inv.weapons || {}), ...(inv.cargo || {}) };
                
                let loadedItems = [];
                for (const [id, level] of Object.entries(allItemsDict)) {
                    const mItem = MARKET_ITEMS.find(m => m.id === id);
                    if (mItem) {
                        loadedItems.push({ ...mItem, level });
                    }
                }
                setOwnedItems(loadedItems.sort((a,b) => b.level - a.level));
            }

            const rawRunes = localStorage.getItem("arn_runes");
            if (rawRunes) setOwnedRunes(JSON.parse(rawRunes));

            // Support legacy global loadout for ship 0, otherwise use ship-specific slot
            let lKey = shipType === 0 ? "arn_active_loadout" : `arn_active_loadout_${shipType}`;
            let rawLoadout = localStorage.getItem(lKey);
            
            // If Ship 0 has the old global slot, we'll just read from it.
            if (!rawLoadout && shipType === 0) {
               rawLoadout = localStorage.getItem("arn_active_loadout");
            }

            if (rawLoadout) setActiveLoadout({ ...activeLoadout, ...JSON.parse(rawLoadout) });
            
            // Clear the currently active selection slot when swapping between ships
            setSelectedSlot(null);
        } catch {}
    }, [shipType]);

    const saveLoadout = (newLoadout: ActiveLoadout) => {
        setActiveLoadout(newLoadout);
        const lKey = shipType === 0 ? "arn_active_loadout" : `arn_active_loadout_${shipType}`;
        localStorage.setItem(lKey, JSON.stringify(newLoadout));
        window.dispatchEvent(new Event('arn_loadout_update'));
    };

    const handleEquip = (itemId: string) => {
        if (!selectedSlot) return;
        const newLoadout = { ...activeLoadout, [selectedSlot]: itemId };
        saveLoadout(newLoadout);
        setSelectedSlot(null);
    };

    const handleUnequip = (slot: keyof ActiveLoadout) => {
        const newLoadout = { ...activeLoadout, [slot]: null };
        saveLoadout(newLoadout);
        setSelectedSlot(null);
    };

    // Mapping slots to acceptable types
    const slotTypes: Record<keyof ActiveLoadout, string[]> = {
        weapon1: ['Weaponry'],
        weapon2: ['Weaponry'],
        defense: ['Defense'],
        engine: ['Mobility'],
        utility1: ['Utility', 'Parts'],
        utility2: ['Utility', 'Parts'],
        rune1: ['Rune'],
        rune2: ['Rune'],
        rune3: ['Rune']
    };

    const renderSlot = (slotKey: keyof ActiveLoadout, title: string, isRune: boolean = false) => {
        const id = activeLoadout[slotKey];
        let itemName = 'Empty Slot';
        let itemLevel = null;
        
        if (id) {
            if (isRune) {
                itemName = id.replace('_core', '').replace(/_/g, ' ').toUpperCase() + " RUNE";
            } else {
                const itemDef = ownedItems.find(m => m.id === id);
                if (itemDef) {
                    itemName = itemDef.name;
                    itemLevel = itemDef.level;
                } else {
                    itemName = id; // fallback
                }
            }
        }

        const isActive = selectedSlot === slotKey;
        
        return (
            <div 
                onClick={() => setSelectedSlot(slotKey)}
                style={{
                    background: isActive ? (isRune ? 'rgba(245, 158, 11, 0.1)' : 'rgba(56,189,248,0.1)') : '#0f172a',
                    border: `1px solid ${isActive ? (isRune ? '#f59e0b' : '#38bdf8') : '#1e293b'}`,
                    padding: isRune ? '1rem' : '1.5rem', borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? `0 0 15px ${isRune ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56,189,248,0.2)'}` : 'none'
                }}
            >
                <div>
                    <div style={{ fontSize: '0.8rem', color: isRune ? '#f59e0b' : '#64748b', marginBottom: '0.2rem', fontWeight: 'bold' }}>{title}</div>
                    <div style={{ fontSize: isRune ? '1rem' : '1.2rem', color: id ? (isRune ? '#fbbf24' : '#fff') : '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {itemName}
                        {itemLevel && <span style={{ fontSize: '0.8rem', background: '#38bdf8', color: '#0f172a', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>L{itemLevel}</span>}
                    </div>
                </div>
                {id && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleUnequip(slotKey); }}
                        style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        UNEQUIP
                    </button>
                )}
            </div>
        );
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.95)', backdropFilter: 'blur(10px)',
            zIndex: 10000, display: 'flex', flexDirection: 'column',
            fontFamily: 'monospace', color: '#e2e8f0', pointerEvents: 'auto'
        }}>
            <div style={{ padding: '2rem 3rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(15,23,42,1), rgba(15,23,42,0))' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#fff', textShadow: '0 0 15px rgba(56,189,248,0.5)' }}>FLEET GARAGE</h1>
                    <div style={{ fontSize: '1rem', color: '#94a3b8', marginTop: '0.5rem' }}>Configure physical loadouts and synthesize resonance matrices.</div>
                </div>
                <button onClick={onClose} style={{ padding: '0.8rem 2rem', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    CLOSE GARAGE
                </button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left: Ship Display */}
                <div style={{ width: '350px', borderRight: '1px solid #1e293b', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(15,23,42,0.5)' }}>
                    <h2 style={{ color: cfg.color, marginTop: 0 }}>{cfg.name}</h2>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="200" height="200" viewBox="-20 -20 40 40">
                            {cfg.svg}
                        </svg>
                    </div>
                </div>

                {/* Middle: Loadout Slots */}
                <div style={{ flex: 1, padding: '2rem', borderRight: '1px solid #1e293b', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '1.2rem' }}>Core Modules</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
                        {renderSlot('weapon1', 'PRIMARY WEAPON')}
                        {renderSlot('weapon2', 'SECONDARY WEAPON')}
                        {renderSlot('defense', 'SHIELD ARRAY')}
                        {renderSlot('engine', 'DRIVE THRUSTER')}
                        {renderSlot('utility1', 'UTILITY BAY A')}
                        {renderSlot('utility2', 'UTILITY BAY B')}
                    </div>

                    <div style={{ marginBottom: '1rem', color: '#f59e0b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>✦</span> Harmonic Matrix Runes
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {renderSlot('rune1', 'AMPLIFIER CORE I', true)}
                        {renderSlot('rune2', 'AMPLIFIER CORE II', true)}
                        {renderSlot('rune3', 'AMPLIFIER CORE III', true)}
                    </div>
                </div>

                {/* Right: Available Inventory */}
                <div style={{ width: '400px', padding: '2rem', background: 'rgba(15,23,42,0.3)', overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 1.5rem', color: '#fff' }}>
                        {selectedSlot ? `Select ${slotTypes[selectedSlot].join('/')}` : 'Storage Vault'}
                    </h3>

                    {!selectedSlot && (
                        <div style={{ color: '#64748b', fontSize: '1.1rem', textAlign: 'center', marginTop: '4rem' }}>
                            Select an empty slot on the left to assign equipment.
                        </div>
                    )}

                    {selectedSlot && slotTypes[selectedSlot].includes('Rune') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {ownedRunes.length === 0 ? (
                                <div style={{ color: '#64748b' }}>No synthesized cores detected. Reach Level 5 with an item to extract its core.</div>
                            ) : (
                                ownedRunes.map((runeId, idx) => {
                                    const isEquippedElsewhere = activeLoadout.rune1 === runeId || activeLoadout.rune2 === runeId || activeLoadout.rune3 === runeId;
                                    const runeName = runeId.replace('_core', '').replace(/_/g, ' ').toUpperCase();
                                    return (
                                        <div key={idx} style={{
                                            background: '#0f172a', border: '1px solid #f59e0b55', borderRadius: '6px', padding: '1rem',
                                            display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid #f59e0b'
                                        }}>
                                            <div>
                                                <div style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '0.2rem' }}>{runeName} RUNE</div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Provides passive resonant augmentation.</div>
                                            </div>
                                            <button
                                                onClick={() => handleEquip(runeId)}
                                                disabled={isEquippedElsewhere}
                                                style={{
                                                    background: isEquippedElsewhere ? '#1e293b' : 'rgba(245, 158, 11, 0.2)',
                                                    color: isEquippedElsewhere ? '#475569' : '#fbbf24',
                                                    border: `1px solid ${isEquippedElsewhere ? '#334155' : '#f59e0b'}`,
                                                    padding: '0.6rem', borderRadius: '4px', cursor: isEquippedElsewhere ? 'not-allowed' : 'pointer', fontWeight: 'bold'
                                                }}
                                            >
                                                {isEquippedElsewhere ? 'IN USE' : 'SOCKET RUNE'}
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}

                    {selectedSlot && !slotTypes[selectedSlot].includes('Rune') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {ownedItems.filter(item => slotTypes[selectedSlot].includes(item.type)).length === 0 ? (
                                <div style={{ color: '#64748b' }}>No compatible items found. Purchase blueprints at the Global Marketplace.</div>
                            ) : (
                                ownedItems
                                  .filter(item => slotTypes[selectedSlot].includes(item.type))
                                  .map((item, idx) => {
                                      const isEquippedElsewhere = Object.entries(activeLoadout).some(([key, val]) => val === item.id && key !== selectedSlot);
                                      return (
                                          <div key={idx} style={{
                                              background: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', padding: '1rem',
                                              display: 'flex', flexDirection: 'column', gap: '1rem'
                                          }}>
                                              <div>
                                                  <div style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                      {item.name}
                                                      <span style={{ fontSize: '0.8rem', background: '#38bdf8', color: '#0f172a', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>L{item.level}</span>
                                                  </div>
                                                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.type}</div>
                                              </div>
                                              <button
                                                  onClick={() => handleEquip(item.id)}
                                                  disabled={isEquippedElsewhere}
                                                  style={{
                                                      background: isEquippedElsewhere ? '#1e293b' : 'rgba(56,189,248,0.2)',
                                                      color: isEquippedElsewhere ? '#475569' : '#38bdf8',
                                                      border: `1px solid ${isEquippedElsewhere ? '#334155' : '#0ea5e9'}`,
                                                      padding: '0.6rem', borderRadius: '4px', cursor: isEquippedElsewhere ? 'not-allowed' : 'pointer', fontWeight: 'bold'
                                                  }}
                                              >
                                                  {isEquippedElsewhere ? 'EQUIPPED IN OTHER SLOT' : 'EQUIP MODULE'}
                                              </button>
                                          </div>
                                      );
                                  })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
