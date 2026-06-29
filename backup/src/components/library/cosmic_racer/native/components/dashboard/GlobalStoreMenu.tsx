import React, { useState, useEffect } from 'react';
import MARKET_ITEMS from '../../config/market_items.json';
import { CPM_ASSETS, OCTAVES } from '../../config/economy_constants';

interface AssetBalance {
    TETRAHEDRON: number;
    CUBE: number;
    OCTAHEDRON: number;
    DODECAHEDRON: number;
    ICOSAHEDRON: number;
    FLOWER_OF_LIFE: number;
    RARE: number;
}

export function GlobalStoreMenu({ onClose }: { onClose: () => void }) {
    const [selectedOctave, setSelectedOctave] = useState<number>(11);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [bankedAssets, setBankedAssets] = useState<Record<string, AssetBalance>>({});
    const [ownedItems, setOwnedItems] = useState<Record<string, number>>({});
    
    // Derived global balance
    const globalBalance = Object.values(bankedAssets).reduce((acc, planetObj) => {
        Object.keys(planetObj).forEach(key => {
            acc[key as keyof AssetBalance] = (acc[key as keyof AssetBalance] || 0) + (planetObj[key as keyof AssetBalance] || 0);
        });
        return acc;
    }, { TETRAHEDRON: 0, CUBE: 0, OCTAHEDRON: 0, DODECAHEDRON: 0, ICOSAHEDRON: 0, FLOWER_OF_LIFE: 0, RARE: 0 });

    useEffect(() => {
        // Load Balances
        try {
            const rawBank = localStorage.getItem("arn_banked_platonics_v4");
            if (rawBank) setBankedAssets(JSON.parse(rawBank));
        } catch {}

        // Load Inventory and perform Level mapping migration
        try {
            const rawInv = localStorage.getItem("arn_inventory");
            if (rawInv) {
                const inv = JSON.parse(rawInv);
                
                // Migrate arrays to dicts { "id": level }
                if (Array.isArray(inv.weapons)) inv.weapons = inv.weapons.reduce((acc: any, id: string) => ({...acc, [id]: 1}), {});
                if (Array.isArray(inv.equipment)) inv.equipment = inv.equipment.reduce((acc: any, id: string) => ({...acc, [id]: 1}), {});
                if (Array.isArray(inv.cargo)) inv.cargo = inv.cargo.reduce((acc: any, id: string) => ({...acc, [id]: 1}), {});
                
                const allOwned: Record<string, number> = {
                    ...(inv.equipment || {}),
                    ...(inv.weapons || {}),
                    ...(inv.cargo || {})
                };
                
                setOwnedItems(allOwned);
                localStorage.setItem("arn_inventory", JSON.stringify(inv)); // Save migrated schema
            }
        } catch {}
    }, []);

    const canAfford = (requirements: {asset: string, count: number}[]) => {
        if (!requirements) return false;
        for (const req of requirements) {
            if (req.asset === 'energy') {
               const rawEmp = localStorage.getItem("arn_empire_resources_v1");
               const emp = rawEmp ? JSON.parse(rawEmp) : { energy: 0 };
               if (emp.energy < req.count) return false;
               continue;
            }
            const have = globalBalance[req.asset as keyof AssetBalance] || 0;
            if (have < req.count) return false;
        }
        return true;
    };

    const processDeduction = (requirements: {asset: string, count: number}[]) => {
        const newBank = { ...bankedAssets };
        for (const req of requirements) {
            if (req.asset === 'energy') {
               try {
                  const rawEmp = localStorage.getItem("arn_empire_resources_v1");
                  if (rawEmp) {
                     const emp = JSON.parse(rawEmp);
                     emp.energy = Math.max(0, emp.energy - req.count);
                     localStorage.setItem("arn_empire_resources_v1", JSON.stringify(emp));
                     window.dispatchEvent(new CustomEvent("arn_force_energy_deduct", { detail: req.count }));
                  }
               } catch (e) {}
               continue;
            }
            let leftToDeduct = req.count;
            for (const planetName of Object.keys(newBank)) {
                if (leftToDeduct <= 0) break;
                const planetItems = newBank[planetName];
                const available = planetItems[req.asset as keyof AssetBalance] || 0;
                if (available > 0) {
                    const deduct = Math.min(available, leftToDeduct);
                    planetItems[req.asset as keyof AssetBalance] -= deduct;
                    leftToDeduct -= deduct;
                }
            }
        }
        setBankedAssets(newBank);
        localStorage.setItem("arn_banked_platonics_v4", JSON.stringify(newBank));
    };

    const handlePurchase = (item: any, isUpgrade: boolean = false, upgradeLevel: number = 1, upgradeReqs: any = []) => {
        const reqs = isUpgrade ? upgradeReqs : item.requirements;
        if (!canAfford(reqs)) return;
        processDeduction(reqs);

        // Add to inventory
        try {
            const rawInv = localStorage.getItem("arn_inventory");
            const inv = rawInv ? JSON.parse(rawInv) : { equipment: {}, weapons: {}, cargo: {} };
            
            const targetCategory = item.type === 'Weaponry' ? 'weapons' : 'equipment';
            if (!inv[targetCategory]) inv[targetCategory] = {};
            
            inv[targetCategory][item.id] = isUpgrade ? upgradeLevel : 1;
            
            localStorage.setItem("arn_inventory", JSON.stringify(inv));
            setOwnedItems(prev => ({ ...prev, [item.id]: isUpgrade ? upgradeLevel : 1 }));
            window.dispatchEvent(new Event('arn_inventory_update'));
        } catch {}
    };

    const handleSynthesize = (item: any) => {
        if (!confirm(`WARNING: This will obliterate your ${item.name} Level 5 to extract its Resonance Core! It will be permanently removed from your garage. Proceed?`)) return;

        try {
            // Remove from inventory
            const rawInv = localStorage.getItem("arn_inventory");
            const inv = rawInv ? JSON.parse(rawInv) : { equipment: {}, weapons: {} };
            
            const targetCategory = item.type === 'Weaponry' ? 'weapons' : 'equipment';
            if (inv[targetCategory] && inv[targetCategory][item.id]) {
                delete inv[targetCategory][item.id];
            }
            localStorage.setItem("arn_inventory", JSON.stringify(inv));
            
            const newOwned = { ...ownedItems };
            delete newOwned[item.id];
            setOwnedItems(newOwned);
            
            // Add Rune
            const rawRunes = localStorage.getItem("arn_runes");
            const runes = rawRunes ? JSON.parse(rawRunes) : [];
            runes.push(`${item.id}_core`);
            localStorage.setItem("arn_runes", JSON.stringify(runes));

            window.dispatchEvent(new Event('arn_inventory_update'));
            alert(`Synthesis Complete! [${item.name} CORE] added to your Rune inventory.`);
        } catch {}
    };

    const categories = ['All', 'Weaponry', 'Defense', 'Mobility', 'Utility', 'Parts'];
    
    // Sort items so Native Octave falls exactly on the selected octave
    const filteredItems = MARKET_ITEMS.filter(item => {
        if (selectedCategory !== 'All' && item.type !== selectedCategory) return false;
        
        // Either match exact octave (legacy format) or if it's in native_octaves array!
        const matchBase = item.octave === selectedOctave;
        const matchArray = (item as any).native_octaves?.includes(selectedOctave);
        if (!matchBase && !matchArray) return false;
        return true;
    });

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.85)', backdropFilter: 'blur(10px)',
            zIndex: 10000, display: 'flex', flexDirection: 'column',
            fontFamily: 'monospace', color: '#e2e8f0', pointerEvents: 'auto'
        }}>
            {/* Header */}
            <div style={{ padding: '2rem 3rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(15,23,42,1), rgba(15,23,42,0))' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#fff', textShadow: '0 0 15px rgba(56,189,248,0.5)' }}>GLOBAL MARKETPLACE</h1>
                    <div style={{ fontSize: '1rem', color: '#94a3b8', marginTop: '0.5rem' }}>Acquire components, weaponry, and upgrades using your banked Geometric Platonics.</div>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        Notice: To use your raw Octave Currency (like Kuiper Minerals), you must first bank your gathered Asteroid Cargo at a Hexagonal Storage Silo!
                    </div>
                </div>
                <button onClick={onClose} style={{ padding: '0.8rem 2rem', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)' }}>
                    CLOSE
                </button>
            </div>

            {/* Balances Bar */}
            <div style={{ padding: '1rem 3rem', display: 'flex', gap: '2rem', background: '#0f172a', borderBottom: '1px solid #1e293b', overflowX: 'auto' }}>
                {Object.keys(globalBalance).map(assetKey => {
                    const aConfig = CPM_ASSETS[assetKey];
                    return (
                        <div key={assetKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: `1px solid ${aConfig?.color}40` }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: aConfig?.color || '#fff', boxShadow: `0 0 8px ${aConfig?.color}` }} />
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{aConfig?.name || assetKey}:</span>
                            <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{globalBalance[assetKey as keyof AssetBalance].toLocaleString()}</strong>
                        </div>
                    );
                })}
                {Object.values(globalBalance).every(v => v === 0) && (
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>No assets banked yet. Mine asteroids and drop off cargo at Storage Silos.</div>
                )}
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Sidebar: Navigation Categories */}
                <div style={{ width: '250px', borderRight: '1px solid #1e293b', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(15,23,42,0.5)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>CLASSIFICATIONS</div>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                            padding: '1rem', textAlign: 'left', background: selectedCategory === cat ? 'rgba(56,189,248,0.1)' : 'transparent',
                            border: `1px solid ${selectedCategory === cat ? '#38bdf8' : 'transparent'}`,
                            color: selectedCategory === cat ? '#38bdf8' : '#cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1rem', transition: 'all 0.2s', fontWeight: selectedCategory === cat ? 'bold' : 'normal'
                        }}>
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Right Content */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    {/* Octave Scroller */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                        {OCTAVES.map(oct => (
                            <button key={oct.id} onClick={() => setSelectedOctave(oct.id)} style={{
                                padding: '0.8rem 1.4rem', background: selectedOctave === oct.id ? '#0284c7' : '#1e293b',
                                color: selectedOctave === oct.id ? '#fff' : '#94a3b8', border: `1px solid ${selectedOctave === oct.id ? '#38bdf8' : '#334155'}`,
                                borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: selectedOctave === oct.id ? 'bold' : 'normal',
                                transition: 'all 0.2s'
                            }}>
                                OCTAVE {oct.id}
                            </button>
                        ))}
                    </div>

                    {/* Store Grid */}
                    {filteredItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#64748b', fontSize: '1.2rem', background: 'rgba(15,23,42,0.5)', borderRadius: '12px', border: '1px dashed #334155' }}>
                            No geometric blueprint constructs detected in this Octave bandwidth.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                            {filteredItems.map(item => {
                                const level = ownedItems[item.id] || 0;
                                const isMaxed = level >= 5;
                                const nextUpgrade = (item as any).upgrades?.find((u: any) => u.level === level + 1);
                                
                                const reqs = level === 0 ? item.requirements : (nextUpgrade ? nextUpgrade.cost : []);
                                const afford = canAfford(reqs);
                                
                                return (
                                    <div key={item.id} style={{
                                        background: '#0f172a', border: `1px solid ${level > 0 ? '#38bdf8' : '#1e293b'}`,
                                        borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                                        boxShadow: level > 0 ? '0 0 20px rgba(56,189,248,0.1)' : 'inset 0 0 50px rgba(0,0,0,0.5)',
                                        position: 'relative'
                                    }}>
                                        {level > 0 && (
                                            <div style={{ position: 'absolute', top: 0, right: 0, background: isMaxed ? '#f59e0b' : '#38bdf8', color: '#0f172a', padding: '0.4rem 1rem', borderBottomLeftRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                {isMaxed ? 'MAX LEVEL' : `LEVEL ${level}`}
                                            </div>
                                        )}
                                        
                                        <div style={{ padding: '1.5rem', flex: 1 }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
                                                {item.type.toUpperCase()} // {(item as any).native_octaves ? `O${Math.max(...(item as any).native_octaves)} - O${Math.min(...(item as any).native_octaves)}` : `O${item.octave}`}
                                            </div>
                                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: level > 0 ? '#fff' : '#cbd5e1' }}>{item.name}</h3>
                                            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                                {(item as any).desc || 'Standard component model.'}
                                            </p>
                                            
                                            {/* Upgrade Preview Window */}
                                            {level > 0 && nextUpgrade && (
                                                <div style={{ padding: '0.8rem', background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf855', borderRadius: '6px', marginBottom: '1.5rem', color: '#38bdf8', fontSize: '0.9rem' }}>
                                                    <strong>Next Mod:</strong> {nextUpgrade.effect}
                                                </div>
                                            )}
                                            
                                            {/* Requirements Panel */}
                                            {!isMaxed && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#050a14', padding: '1.2rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                                                        {level === 0 ? 'CONSTRUCTION COST' : `UPGRADE COST (L${level + 1})`}
                                                    </div>
                                                    {reqs.map((req: any) => {
                                                        const aConfig = CPM_ASSETS[req.asset];
                                                        const have = globalBalance[req.asset as keyof AssetBalance] || 0;
                                                        const hasEnough = have >= req.count;
                                                        return (
                                                            <div key={req.asset} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.5rem 0', borderBottom: '1px solid #1e293b55' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: aConfig?.color || '#fff' }} />
                                                                        <span style={{ color: hasEnough ? '#cbd5e1' : '#ef4444', fontWeight: 'bold' }}>{aConfig?.name || req.asset}</span>
                                                                    </div>
                                                                    <div style={{ color: hasEnough ? '#94a3b8' : '#ef4444', fontFamily: 'monospace' }}>
                                                                        {have.toLocaleString()} / <strong style={{color: hasEnough ? '#fff' : '#ef4444'}}>{req.count.toLocaleString()}</strong>
                                                                    </div>
                                                                </div>
                                                                {aConfig?.source && (
                                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', paddingLeft: '1.2rem', lineHeight: 1.4 }}>
                                                                        Source: {aConfig.source}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: '1rem', background: isMaxed ? 'rgba(245, 158, 11, 0.1)' : 'rgba(15,23,42,0.8)', borderTop: `1px solid ${isMaxed ? '#f59e0b55' : '#1e293b'}` }}>
                                            {isMaxed ? (
                                                <button 
                                                    onClick={() => handleSynthesize(item)}
                                                    style={{ width: '100%', padding: '1rem', background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)', transition: 'all 0.2s' }}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    SYNTHESIZE CORE LAYER
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handlePurchase(item, level > 0, level + 1, reqs)}
                                                    disabled={!afford}
                                                    style={{ width: '100%', padding: '1rem', background: afford ? (level > 0 ? '#38bdf8' : '#10b981') : '#334155', color: afford ? '#0f172a' : '#94a3b8', border: 'none', borderRadius: '6px', cursor: afford ? 'pointer' : 'not-allowed', fontWeight: '900', fontSize: '1rem', transition: 'all 0.2s', boxShadow: afford ? `0 0 15px ${level > 0 ? 'rgba(56,189,248,0.4)' : 'rgba(16,185,129,0.4)'}` : 'none' }}
                                                >
                                                    {afford ? (level > 0 ? `INSTALL L${level + 1} UPGRADE` : 'PURCHASE BLUEPRINT') : 'INSUFFICIENT FUNDS'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
