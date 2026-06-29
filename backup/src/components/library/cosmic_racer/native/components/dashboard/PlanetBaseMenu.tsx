'use client';

import React, { useState, useEffect } from 'react';

// --- Types ---
export type BuildingType = 'headquarters' | 'barracks' | 'forge' | 'ship_builder' | 'planet_council' | 'resource_production';

export interface BaseBuilding {
    type: BuildingType;
    level: number;
    constructionStartTime: number | null;
    constructionEndTime: number | null;
}

export interface PlanetBaseState {
    planetName: string;
    buildings: Record<BuildingType, BaseBuilding>;
}

export const BUILDING_CONFIG: Record<BuildingType, { name: string; desc: string; cost: number; buildTimeMs: number }> = {
    headquarters: { name: 'Headquarters', desc: 'Manage finance, resources, and buy equipment.', cost: 500, buildTimeMs: 10000 },
    barracks: { name: 'Barracks', desc: 'Train soldiers for Galactic ship duty.', cost: 300, buildTimeMs: 10000 },
    forge: { name: 'Forge', desc: 'Create weapons and gadgets.', cost: 400, buildTimeMs: 10000 },
    ship_builder: { name: 'Ship Builder', desc: 'Build new ships for your fleet.', cost: 1000, buildTimeMs: 10000 },
    planet_council: { name: 'Planet Council', desc: 'Diplomacy, trade, and alliances.', cost: 800, buildTimeMs: 10000 },
    resource_production: { name: 'Resource Production', desc: 'Generate resources over time.', cost: 200, buildTimeMs: 10000 },
};

export const INITIAL_BUILDINGS: Record<BuildingType, BaseBuilding> = {
    headquarters: { type: 'headquarters', level: 0, constructionStartTime: null, constructionEndTime: null },
    barracks: { type: 'barracks', level: 0, constructionStartTime: null, constructionEndTime: null },
    forge: { type: 'forge', level: 0, constructionStartTime: null, constructionEndTime: null },
    ship_builder: { type: 'ship_builder', level: 0, constructionStartTime: null, constructionEndTime: null },
    planet_council: { type: 'planet_council', level: 0, constructionStartTime: null, constructionEndTime: null },
    resource_production: { type: 'resource_production', level: 0, constructionStartTime: null, constructionEndTime: null },
};


// --- Custom Hook for Local Storage State ---
export function usePlanetBase(planetName: string | null) {
    const [baseState, setBaseState] = useState<PlanetBaseState | null>(null);

    // Load from local storage on mount or planet change
    useEffect(() => {
        if (!planetName) {
            setBaseState(null);
            return;
        }

        const storageKey = `arn_base_${planetName}`;
        try {
            const rawInv = localStorage.getItem('arn_inventory');
            if (rawInv) {
                const p = JSON.parse(rawInv);
                if (!p.unlockedShips) p.unlockedShips = [0]; // Hydrate old saves
                // setInventory(p); // This line was commented out in the original snippet, but it seems like it should be here if `setInventory` was defined in this scope. Assuming it's not, and the user only provided a partial snippet for context.
            }
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                setBaseState(JSON.parse(raw));
            } else {
                setBaseState({
                    planetName,
                    buildings: { ...INITIAL_BUILDINGS } // Deep copy? This is flat enough it works. Actually prefer deep copy for objects.
                });
            }
        } catch (e) {
            console.error("Failed to parse base state", e);
             setBaseState({
                planetName,
                buildings: JSON.parse(JSON.stringify(INITIAL_BUILDINGS))
            });
        }
    }, [planetName]);

    const saveState = (newState: PlanetBaseState) => {
        setBaseState(newState);
        if (planetName) {
            localStorage.setItem(`arn_base_${planetName}`, JSON.stringify(newState));
        }
    };

    const startConstruction = (buildingType: BuildingType) => {
        if (!baseState) return;
        const config = BUILDING_CONFIG[buildingType];
        const now = Date.now();
        
        const newState = { ...baseState };
        newState.buildings = { ...newState.buildings };
        
        newState.buildings[buildingType] = {
            ...newState.buildings[buildingType],
            constructionStartTime: now,
            constructionEndTime: now + config.buildTimeMs
        };
        saveState(newState);
    };

    const speedUpConstruction = (buildingType: BuildingType) => {
         if (!baseState) return;
         const newState = { ...baseState };
         newState.buildings = { ...newState.buildings };
         
         newState.buildings[buildingType] = {
             ...newState.buildings[buildingType],
             level: newState.buildings[buildingType].level + 1,
             constructionStartTime: null,
             constructionEndTime: null
         };
         saveState(newState);
    };

    const checkCompletions = () => {
         if (!baseState) return;
         let changed = false;
         const now = Date.now();
         const newState = { ...baseState };
         newState.buildings = { ...newState.buildings };

         (Object.keys(newState.buildings) as BuildingType[]).forEach(key => {
             const b = newState.buildings[key];
             if (b.constructionEndTime && now >= b.constructionEndTime) {
                 b.level += 1;
                 b.constructionStartTime = null;
                 b.constructionEndTime = null;
                 changed = true;
             }
         });

         if (changed) {
             saveState(newState);
         }
    };

    // Run checkCompletions periodically
    useEffect(() => {
        if (!baseState) return;
        const interval = setInterval(checkCompletions, 1000);
        return () => clearInterval(interval);
    }, [baseState]);

    return { baseState, startConstruction, speedUpConstruction };
}


// --- Component ---
interface PlanetBaseMenuProps {
    planetName: string;
    planetColor: string;
    initialTab?: 'BASE' | 'MARKET' | 'TRADE_MARKET' | 'SHIPYARD' | 'BARRACKS';
    empireResources?: any;
    setEmpireResources?: (r: any) => void;
    octaveCurrency?: Record<number, number>;
    setOctaveCurrency?: (r: Record<number, number>) => void;
    activeShipType?: number;
    setShipType?: (s: number) => void;
    onClose: () => void;
}

export function PlanetBaseMenu({ planetName, planetColor, initialTab = 'BASE', empireResources, setEmpireResources, octaveCurrency, setOctaveCurrency, activeShipType, setShipType, onClose }: PlanetBaseMenuProps) {
    const { baseState, startConstruction, speedUpConstruction } = usePlanetBase(planetName);
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
    const [activeTab, setActiveTab] = useState<'BASE' | 'MARKET' | 'TRADE_MARKET' | 'SHIPYARD' | 'BARRACKS'>(initialTab);

    // Feature Flags
    const hasShipyard = (baseState?.buildings?.ship_builder?.level ?? 0) > 0;
    const hasBarracks = (baseState?.buildings?.barracks?.level ?? 0) > 0;

    // Local state for Mars Market inventory
    const [inventory, setInventory] = useState<{ 
        acousticRadar: boolean, modulator: boolean, shield: boolean, shieldLevel: number, frequencyTuner: boolean, missileLevel: number,
        equipment: string[], weapons: string[], cargo: string[],
        unlockedShips?: number[]
    }>({ 
        acousticRadar: false, modulator: false, shield: false, shieldLevel: 0, frequencyTuner: false, missileLevel: 0,
        equipment: [], weapons: [], cargo: [], unlockedShips: [0]
    });
    
    const [radarSlotProgress, setRadarSlotProgress] = useState<boolean[]>([false, false, false, false, false, false]);
    const [modulatorSlotProgress, setModulatorSlotProgress] = useState<boolean[]>([false, false, false, false, false, false]);
    const [shieldSlotProgress, setShieldSlotProgress] = useState<boolean[]>([false, false, false, false, false, false]);
    
    useEffect(() => {
        try { 
            const invStr = localStorage.getItem('arn_inventory');
            const inv = invStr ? JSON.parse(invStr) : {};
            
            // Validate schema just in case old save
            const migratedInv = {
                acousticRadar: !!inv.acousticRadar,
                modulator: !!inv.modulator,
                shield: !!inv.shield,
                shieldLevel: typeof inv.shieldLevel === 'number' ? inv.shieldLevel : (inv.shield ? 1 : 0),
                frequencyTuner: !!inv.frequencyTuner,
                missileLevel: typeof inv.missileLevel === 'number' ? inv.missileLevel : 0,
                equipment: Array.isArray(inv.equipment) ? inv.equipment : [],
                weapons: Array.isArray(inv.weapons) ? inv.weapons : [],
                cargo: Array.isArray(inv.cargo) ? inv.cargo : [],
                unlockedShips: Array.isArray(inv.unlockedShips) ? inv.unlockedShips : [0]
            };

            // Auto-migrate legacy unlocks into the equipment array if they don't exist yet but were previously purchased
            if (migratedInv.acousticRadar && !migratedInv.equipment.includes('util_acoustic_radar')) {
                migratedInv.equipment.push('util_acoustic_radar');
            }
            if (migratedInv.modulator && !migratedInv.equipment.includes('util_advanced_scanner')) {
                migratedInv.equipment.push('util_advanced_scanner');
            }
            if (migratedInv.shield && !migratedInv.equipment.includes('def_harmonic_shield')) {
                migratedInv.equipment.push('def_harmonic_shield');
            }

            setInventory(migratedInv);

            const rSlots = JSON.parse(localStorage.getItem('arn_radar_slots') || '[false,false,false,false,false,false]');
            setRadarSlotProgress(rSlots);
            const mSlots = JSON.parse(localStorage.getItem('arn_modulator_slots') || '[false,false,false,false,false,false]');
            setModulatorSlotProgress(mSlots);
            const sSlots = JSON.parse(localStorage.getItem('arn_shield_slots') || '[false,false,false,false,false,false]');
            setShieldSlotProgress(sSlots);
        } catch {}
    }, []);

    const saveInventory = (inv: typeof inventory) => {
        setInventory(inv);
        localStorage.setItem('arn_inventory', JSON.stringify(inv));
        // Global event dispatch so HUD can re-render immediately
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('arn_inventory_update'));
        }
    };

    const [radarErrorMsg, setRadarErrorMsg] = useState<string | null>(null);
    const [missileErrorMsg, setMissileErrorMsg] = useState<string | null>(null);
    const [modulatorErrorMsg, setModulatorErrorMsg] = useState<string | null>(null);
    const [shieldErrorMsg, setShieldErrorMsg] = useState<string | null>(null);
    const [tunerErrorMsg, setTunerErrorMsg] = useState<string | null>(null);

    const saveRadarSlots = (slots: boolean[]) => {
        setRadarSlotProgress(slots);
        localStorage.setItem('arn_radar_slots', JSON.stringify(slots));
    };

    const saveModulatorSlots = (slots: boolean[]) => {
        setModulatorSlotProgress(slots);
        localStorage.setItem('arn_modulator_slots', JSON.stringify(slots));
    };

    const saveShieldSlots = (slots: boolean[]) => {
        setShieldSlotProgress(slots);
        localStorage.setItem('arn_shield_slots', JSON.stringify(slots));
    };

    // Helper to spend Earth (Octave 8) Frequency
    const spendBankedFrequency = (amount: number): boolean => {
        try {
            const currencyString = localStorage.getItem('arn_oct_currency');
            const currency = currencyString ? JSON.parse(currencyString) : {};
            const earthFreq = currency[8] || 0;
            if (earthFreq >= amount) {
                currency[8] = earthFreq - amount;
                localStorage.setItem('arn_oct_currency', JSON.stringify(currency));
                window.dispatchEvent(new Event('arn_currency_update')); // Notify main engine HUD
                return true;
            }
        } catch (e) {
            console.error("Failed to parse currency", e);
        }
        return false;
    };

    // Temp resources for testing
    const [tempResources, setTempResources] = useState(10000);

    // Force re-render for progress bars
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const intId = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(intId);
    }, []);

    if (!baseState) return null;

    const handleBuy = (type: BuildingType) => {
        const cost = BUILDING_CONFIG[type].cost;
        if (tempResources >= cost) {
            setTempResources(prev => prev - cost);
            startConstruction(type);
        } else {
            alert("Not enough resources! (Placeholder message)");
        }
    };

    // Main Build Menu View (Split Layout)
    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 5, 15, 0.4)', backdropFilter: 'blur(4px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace', pointerEvents: 'auto'
        }}>
            <div style={{
                width: '900px', height: '650px',
                background: '#0a101dcc',
                border: `1px solid ${planetColor}80`,
                borderRadius: '12px',
                display: 'flex', flexDirection: 'column',
                boxShadow: `0 0 40px ${planetColor}40`,
                overflow: 'hidden',
                backdropFilter: 'blur(8px)'
            }}>
                {/* Header */}
                <div style={{ 
                    padding: '1.5rem 2rem', 
                    background: `linear-gradient(to right, ${planetColor}20, transparent)`,
                    borderBottom: '1px solid #1e293b',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', letterSpacing: '0.1em' }}>PLANETARY BASE COMMAND</div>
                        <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '2rem', color: '#fff', textShadow: `0 0 10px ${planetColor}` }}>{planetName}</h2>
                        {(empireResources && (empireResources.efficiency < 1.0 || empireResources.food <= 0)) && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '6px', animation: 'pulsateAlert 1.5s infinite' }}>
                                {empireResources.efficiency < 1.0 && <div style={{ color: '#fca5a5', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '6px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>⚠️ WARNING: PLANETARY POWER GRID FAILURE. CONSTRUCT POWER PLANTS IMMEDIATELY.</div>}
                                {empireResources.food <= 0 && <div style={{ color: '#fca5a5', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '6px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>⚠️ CRITICAL: CIVILIAN STARVATION CASCADE. CONSTRUCT HYDROPONICS FARMS IMMEDIATELY.</div>}
                                <style>{`@keyframes pulsateAlert { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }`}</style>
                            </div>
                        )}
                        {planetName.toUpperCase() === 'MARS' && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button 
                                    onClick={() => setActiveTab('BASE')}
                                    style={{
                                        background: activeTab === 'BASE' ? `${planetColor}44` : 'transparent', border: `1px solid ${planetColor}`,
                                        color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 900
                                    }}>BASE COMMAND</button>
                                <button 
                                    onClick={() => setActiveTab('MARKET')}
                                    style={{
                                        background: activeTab === 'MARKET' ? `${planetColor}44` : 'transparent', border: `1px solid ${planetColor}`,
                                        color: '#00f7ff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 900
                                    }}>RESONANT MARKET</button>
                                <button
                                    onClick={() => {
                                        if (typeof window !== 'undefined') {
                                            setActiveTab('TRADE_MARKET');
                                        }
                                    }}
                                    style={{
                                        background: activeTab === 'TRADE_MARKET' ? `${planetColor}44` : 'transparent', border: `1px solid ${planetColor}`,
                                        color: '#fbbf24', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 900
                                    }}>TRADE MARKET (EXTERNAL)</button>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            {hasShipyard && (
                                <button 
                                    onClick={() => setActiveTab('SHIPYARD')}
                                    style={{
                                        background: activeTab === 'SHIPYARD' ? `${planetColor}44` : 'transparent', border: `1px solid ${planetColor}`,
                                        color: '#cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 900
                                    }}>FLEET COMMAND</button>
                            )}
                            {hasBarracks && (
                                <button 
                                    onClick={() => setActiveTab('BARRACKS')}
                                    style={{
                                        background: activeTab === 'BARRACKS' ? `${planetColor}44` : 'transparent', border: `1px solid ${planetColor}`,
                                        color: '#f87171', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 900
                                    }}>BARRACKS</button>
                            )}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>FUNDS (TEMP)</div>
                        <div style={{ fontSize: '1.25rem', color: '#fbbf24', fontWeight: 'bold' }}>{tempResources.toLocaleString()} ◈</div>
                    </div>
                </div>

                {/* Content Body */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {activeTab === 'TRADE_MARKET' ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <iframe 
                                src="/science/trade-market/equipment" 
                                style={{ width: '100%', height: '100%', border: 'none', background: '#050a14' }}
                                title="Galactic Trade Market"
                            />
                        </div>
                    ) : activeTab === 'SHIPYARD' ? (
                        <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem' }}>
                                <h2 style={{ margin: '0 0 0.5rem 0', color: '#cbd5e1', fontSize: '2.2rem' }}>Fleet Command (Docked)</h2>
                                <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6, fontSize: '1rem' }}>Procure new stellar vessels and manage your hangar bay deployments.</p>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {/* Ship 1: Falcor */}
                                <div style={{ background: '#111827', border: '1px solid #334155', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '1.4rem' }}>Falcor Interceptor</h3>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Lightweight, highly maneuverable strike craft. Equipped with rapid-fire auto-cannons.</div>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                                            <span style={{ padding: '2px 6px', background: '#3b82f644', border: '1px solid #3b82f6', color: '#93c5fd', fontSize: '0.7rem', borderRadius: '4px' }}>SPEED: HIGH</span>
                                            <span style={{ padding: '2px 6px', background: '#ef444444', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.7rem', borderRadius: '4px' }}>ARMOR: LOW</span>
                                        </div>
                                    </div>
                                    {inventory.unlockedShips?.includes(1) ? (
                                        <button 
                                            disabled={activeShipType === 1}
                                            onClick={() => setShipType && setShipType(1)}
                                            style={{ padding: '12px', background: activeShipType === 1 ? '#22c55e44' : '#3b82f6', color: activeShipType === 1 ? '#86efac' : '#fff', border: 'none', borderRadius: '4px', cursor: activeShipType === 1 ? 'default' : 'pointer', fontWeight: 'bold' }}>
                                            {activeShipType === 1 ? '✓ ACTIVE DEPLOYMENT' : 'DEPLOY FALCOR'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                const cost = 25000;
                                                if (octaveCurrency && octaveCurrency[11] >= cost) {
                                                    setOctaveCurrency && setOctaveCurrency({ ...octaveCurrency, 11: octaveCurrency[11] - cost });
                                                    const newShips = [...(inventory.unlockedShips || [0]), 1];
                                                    saveInventory({ ...inventory, unlockedShips: newShips });
                                                } else {
                                                    alert("Insufficient Photons (Needs 25,000 Credits)");
                                                }
                                            }}
                                            style={{ padding: '12px', background: '#1e293b', border: '1px solid #475569', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            PROCURE (25,000 Credits)
                                        </button>
                                    )}
                                </div>

                                {/* Ship 2: Juggernaut */}
                                <div style={{ background: '#111827', border: '1px solid #334155', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '1.4rem' }}>Tartarus Juggernaut</h3>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Heavy armor platform. Extremely slow, but possesses a massive cargo hold and twin-linked cannons.</div>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                                            <span style={{ padding: '2px 6px', background: '#eab30844', border: '1px solid #eab308', color: '#fde047', fontSize: '0.7rem', borderRadius: '4px' }}>SPEED: VERY LOW</span>
                                            <span style={{ padding: '2px 6px', background: '#22c55e44', border: '1px solid #22c55e', color: '#86efac', fontSize: '0.7rem', borderRadius: '4px' }}>ARMOR: EXTREME</span>
                                        </div>
                                    </div>
                                    {inventory.unlockedShips?.includes(2) ? (
                                        <button 
                                            disabled={activeShipType === 2}
                                            onClick={() => setShipType && setShipType(2)}
                                            style={{ padding: '12px', background: activeShipType === 2 ? '#22c55e44' : '#3b82f6', color: activeShipType === 2 ? '#86efac' : '#fff', border: 'none', borderRadius: '4px', cursor: activeShipType === 2 ? 'default' : 'pointer', fontWeight: 'bold' }}>
                                            {activeShipType === 2 ? '✓ ACTIVE DEPLOYMENT' : 'DEPLOY JUGGERNAUT'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                const cost = 100000;
                                                if (octaveCurrency && octaveCurrency[11] >= cost) {
                                                    setOctaveCurrency && setOctaveCurrency({ ...octaveCurrency, 11: octaveCurrency[11] - cost });
                                                    const newShips = [...(inventory.unlockedShips || [0]), 2];
                                                    saveInventory({ ...inventory, unlockedShips: newShips });
                                                } else {
                                                    alert("Insufficient Photons (Needs 100,000 Credits)");
                                                }
                                            }}
                                            style={{ padding: '12px', background: '#1e293b', border: '1px solid #475569', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            PROCURE (100,000 Credits)
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'BARRACKS' ? (
                        <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem' }}>
                                <h2 style={{ margin: '0 0 0.5rem 0', color: '#f87171', fontSize: '2.2rem' }}>Planetary Barracks</h2>
                                <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6, fontSize: '1rem' }}>Draft physical infantry for defensive positioning and galactic deployments.</p>
                            </div>

                            <div style={{ background: '#111827', border: '1px solid #ef444444', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '0.5rem' }}>CURRENT REGIMENT</div>
                                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#fff', textShadow: '0 0 20px #ef4444', marginBottom: '2rem' }}>{empireResources?.troops || 0} <span style={{ fontSize: '1.5rem', color: '#fca5a5' }}>ACTIVE</span></div>
                                
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
                                    <button 
                                        onClick={() => {
                                            const photonCost = 1000;
                                            const foodCost = 500;
                                            const popCost = 100;
                                            if (octaveCurrency && octaveCurrency[11] >= photonCost && empireResources && empireResources.food >= foodCost && empireResources.population >= popCost) {
                                                setOctaveCurrency && setOctaveCurrency({ ...octaveCurrency, 11: octaveCurrency[11] - photonCost });
                                                setEmpireResources && setEmpireResources({ 
                                                    ...empireResources, 
                                                    food: empireResources.food - foodCost,
                                                    population: empireResources.population - popCost,
                                                    troops: (empireResources.troops || 0) + 100 
                                                });
                                            } else {
                                                alert(`Insufficient Resources. Needs ${photonCost} Credits, ${foodCost} 🌾, and ${popCost} Population.`);
                                            }
                                        }}
                                        style={{ padding: '16px 24px', background: '#7f1d1d', border: '1px solid #b91c1c', color: '#fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: 1, maxWidth: '250px' }}>
                                        TRAIN 100 INFANTRY<br/><span style={{ fontSize: '0.75rem', opacity: 0.8 }}>-1k Credits / -500 🌾 / -100 Pop</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => {
                                            const photonCost = 10000;
                                            const foodCost = 5000;
                                            const popCost = 1000;
                                            if (octaveCurrency && octaveCurrency[11] >= photonCost && empireResources && empireResources.food >= foodCost && empireResources.population >= popCost) {
                                                setOctaveCurrency && setOctaveCurrency({ ...octaveCurrency, 11: octaveCurrency[11] - photonCost });
                                                setEmpireResources && setEmpireResources({ 
                                                    ...empireResources, 
                                                    food: empireResources.food - foodCost,
                                                    population: empireResources.population - popCost,
                                                    troops: (empireResources.troops || 0) + 1000 
                                                });
                                            } else {
                                                alert(`Insufficient Resources. Needs ${photonCost} Credits, ${foodCost} 🌾, and ${popCost} Population.`);
                                            }
                                        }}
                                        style={{ padding: '16px 24px', background: '#991b1b', border: '1px solid #ef4444', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: 1, maxWidth: '250px', boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)' }}>
                                        TRAIN 1,000 INFANTRY<br/><span style={{ fontSize: '0.75rem', opacity: 0.8 }}>-10k Credits / -5k 🌾 / -1k Pop</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'MARKET' ? (
                        <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem' }}>
                                <h2 style={{ margin: '0 0 0.5rem 0', color: '#fbbf24', fontSize: '2.2rem', textShadow: `0 0 15px rgba(251, 191, 36, 0.4)` }}>Mars Resonant Trading Hub</h2>
                                <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6, fontSize: '1rem' }}>Exchange Earth (Octave 8) Banked Frequency for advanced crafting components and planetary upgrades.</p>
                                
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Acoustic Radar Crafting Assembly */}
                                <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden', boxShadow: inventory.acousticRadar ? '0 0 20px rgba(0,247,255,0.1)' : 'none' }}>
                                    {inventory.acousticRadar && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at center, rgba(0, 247, 255, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />}
                                    <div>
                                        <h3 style={{ margin: '0 0 0.25rem', color: inventory.acousticRadar ? '#00f7ff' : '#fff', fontSize: '1.4rem' }}>Acoustic Radar System</h3>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Pulses every 3 seconds to reveal distant asteroids up to 10 AU away. Requires 5 phased synthetic components.</div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                        {[0, 1, 2, 3, 4, 5].map(idx => {
                                            const isFilled = radarSlotProgress[idx] || inventory.acousticRadar;
                                            return (
                                                <button
                                                    key={idx}
                                                    disabled={isFilled || inventory.acousticRadar}
                                                    onClick={() => {
                                                        const SLOT_COST = 50;
                                                        if (spendBankedFrequency(SLOT_COST)) {
                                                            setRadarErrorMsg(null);
                                                            const newSlots = [...radarSlotProgress];
                                                            newSlots[idx] = true;
                                                            saveRadarSlots(newSlots);
                                                            if (newSlots.every(s => s === true)) {
                                                                const equipment = [...inventory.equipment];
                                                                if (!equipment.includes('util_acoustic_radar')) equipment.push('util_acoustic_radar');
                                                                saveInventory({ ...inventory, acousticRadar: true, equipment });
                                                            }
                                                        } else {
                                                            setRadarErrorMsg(`Insufficient Earth Frequency. Need ${SLOT_COST} ◈`);
                                                            setTimeout(() => setRadarErrorMsg(null), 3000);
                                                        }
                                                    }}
                                                    style={{ 
                                                        flex: 1, height: '60px', 
                                                        background: isFilled ? 'rgba(0, 247, 255, 0.15)' : '#0f172a',
                                                        border: `1px solid ${isFilled ? '#00f7ff' : '#334155'}`,
                                                        borderRadius: '6px',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                        cursor: (isFilled || inventory.acousticRadar) ? 'default' : 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {isFilled ? ( <span style={{ color: '#00f7ff', fontSize: '1.2rem', fontWeight: 'bold' }}>✓</span> ) : (
                                                        <>
                                                            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 'bold' }}>PART {idx + 1}</span>
                                                            <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 'bold' }}>50 ◈</span>
                                                        </>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '24px' }}>
                                        {radarErrorMsg ? <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>{radarErrorMsg}</div> : <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Deposit Frequency to synthesize parts.</div>}
                                        {inventory.acousticRadar && <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✓ FULLY ALLOCATED</span>}
                                    </div>
                                </div>

                                {/* Infinite-Depth Harmonic Ascension Shield */}
                                {(() => {
                                    const cLevel = inventory.shieldLevel || (inventory.shield ? 1 : 0);
                                    let sTitle = "Harmonic Ascension Shield";
                                    let sDesc = "Dimensional protection casing allowing survival in Octave 7+ and absorbing 10 physical asteroid impacts.";
                                    let sColor = "#38bdf8";
                                    let sCost = 100;
                                    let sCostLabel = "◈";
                                    let sStatusText = cLevel > 0 ? "✓ FULLY ALLOCATED & EQUIPPED" : "Deposit Frequency to synthesize parts.";
                                    
                                    if (cLevel === 1) {
                                        sTitle = "Sub-Atomic Deflector (Overclock L2)";
                                        sDesc = "Overclock your shield matrix using Cytoplasm to withstand the quantum pressure of Octave 4 dives.";
                                        sColor = "#a855f7"; // Magenta
                                        sCost = 1200;
                                        sCostLabel = "CYTO (O-7)";
                                        sStatusText = "Requires Cytoplasm harvesting.";
                                    } else if (cLevel >= 2) {
                                        sTitle = "Quantum Stabilization Field (Overclock L3)";
                                        sDesc = "Perfect the structural cohesion using Strontium to safely dive into the sub-atomic singularity of Octave 1.";
                                        sColor = "#eab308"; // Gold
                                        sCost = 2400;
                                        sCostLabel = "STRON (O-4)";
                                        sStatusText = cLevel >= 3 ? "✓ MAXIMUM FIELD STRENGTH REACHED" : "Requires Strontium harvesting.";
                                    }

                                    return (
                                        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden', boxShadow: cLevel > 0 ? `0 0 20px ${sColor}20` : 'none' }}>
                                            {cLevel > 0 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at center, ${sColor}0f 0%, transparent 70%)`, pointerEvents: 'none' }} />}
                                            <div>
                                                <h3 style={{ margin: '0 0 0.25rem', color: sColor, fontSize: '1.4rem' }}>{sTitle}</h3>
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{sDesc}</div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                                {cLevel === 0 ? (
                                                    [0, 1, 2, 3, 4, 5].map(idx => {
                                                        const isFilled = shieldSlotProgress[idx] || cLevel > 0;
                                                        return (
                                                            <button
                                                                key={idx}
                                                                disabled={isFilled}
                                                                onClick={() => {
                                                                    if (spendBankedFrequency(sCost)) {
                                                                        setShieldErrorMsg(null);
                                                                        const newSlots = [...shieldSlotProgress];
                                                                        newSlots[idx] = true;
                                                                        saveShieldSlots(newSlots);
                                                                        if (newSlots.every(s => s === true)) {
                                                                            const equipment = [...inventory.equipment];
                                                                            if (!equipment.includes('def_harmonic_shield')) equipment.push('def_harmonic_shield');
                                                                            saveInventory({ ...inventory, shield: true, shieldLevel: 1, equipment });
                                                                        }
                                                                    } else {
                                                                        setShieldErrorMsg(`Insufficient Earth Frequency. Need ${sCost} ◈`);
                                                                        setTimeout(() => setShieldErrorMsg(null), 3000);
                                                                    }
                                                                }}
                                                                style={{ 
                                                                    flex: 1, height: '60px', 
                                                                    background: isFilled ? `${sColor}20` : '#0f172a',
                                                                    border: `1px solid ${isFilled ? sColor : '#334155'}`,
                                                                    borderRadius: '6px',
                                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                                    cursor: isFilled ? 'default' : 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                {isFilled ? ( <span style={{ color: sColor, fontSize: '1.2rem', fontWeight: 'bold' }}>✓</span> ) : (
                                                                    <>
                                                                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 'bold' }}>PART {idx + 1}</span>
                                                                        <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 'bold' }}>{sCost} {sCostLabel}</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <button
                                                        disabled={cLevel >= 3}
                                                        onClick={() => {
                                                            try {
                                                                const currencyString = localStorage.getItem('arn_oct_currency');
                                                                const currency = currencyString ? JSON.parse(currencyString) : {};
                                                                
                                                                // Level 1 -> 2 requires Volatile Cytoplasm (Octave 7)
                                                                if (cLevel === 1) {
                                                                    const cyto = currency[7] || 0;
                                                                    if (cyto >= sCost) {
                                                                        currency[7] = cyto - sCost;
                                                                        localStorage.setItem('arn_oct_currency', JSON.stringify(currency));
                                                                        setShieldErrorMsg(null);
                                                                        saveInventory({ ...inventory, shieldLevel: 2 });
                                                                    } else {
                                                                        setShieldErrorMsg(`Insufficient Cytoplasm. Need ${sCost}.`);
                                                                        setTimeout(() => setShieldErrorMsg(null), 3000);
                                                                    }
                                                                }
                                                                // Level 2 -> 3 requires Isotopic Strontium (Octave 4)
                                                                else if (cLevel === 2) {
                                                                    const stron = currency[4] || 0;
                                                                    if (stron >= sCost) {
                                                                        currency[4] = stron - sCost;
                                                                        localStorage.setItem('arn_oct_currency', JSON.stringify(currency));
                                                                        setShieldErrorMsg(null);
                                                                        saveInventory({ ...inventory, shieldLevel: 3 });
                                                                    } else {
                                                                        setShieldErrorMsg(`Insufficient Strontium. Need ${sCost}.`);
                                                                        setTimeout(() => setShieldErrorMsg(null), 3000);
                                                                    }
                                                                }
                                                            } catch(e) {}
                                                        }}
                                                        style={{ 
                                                            flex: 1, height: '60px', 
                                                            background: cLevel >= 3 ? `${sColor}20` : '#0f172a',
                                                            border: `1px solid ${cLevel >= 3 ? sColor : '#334155'}`,
                                                            borderRadius: '6px',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                            cursor: cLevel >= 3 ? 'default' : 'pointer',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        {cLevel >= 3 ? ( <span style={{ color: sColor, fontSize: '1.2rem', fontWeight: 'bold' }}>✓ MAXIMIZED</span> ) : (
                                                            <>
                                                                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 'bold' }}>SINGLE ALLOY OVERCLOCK</span>
                                                                <span style={{ color: sColor, fontSize: '0.85rem', fontWeight: 'bold' }}>{sCost} {sCostLabel}</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '24px' }}>
                                                {shieldErrorMsg ? <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>{shieldErrorMsg}</div> : <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{sStatusText}</div>}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Recursive Frequency Modulator */}
                                <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.25rem', color: inventory.modulator ? '#a855f7' : '#fff', fontSize: '1.4rem' }}>Recursive Frequency Modulator</h3>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>Unlocks deeper spectrum scanning to reveal hostile phantom nodes and recursive orbital paths.</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                        {[0, 1, 2, 3, 4, 5].map(idx => {
                                            const isFilled = modulatorSlotProgress[idx] || inventory.modulator;
                                            return (
                                                <button
                                                    key={idx}
                                                    disabled={isFilled || inventory.modulator}
                                                    onClick={() => {
                                                        const COST = 250;
                                                        try {
                                                            const currencyString = localStorage.getItem('arn_oct_currency');
                                                            const currency = currencyString ? JSON.parse(currencyString) : {};
                                                            const oct13 = currency[13] || 0;
                                                            
                                                            if (oct13 >= COST) {
                                                                currency[13] = oct13 - COST;
                                                                localStorage.setItem('arn_oct_currency', JSON.stringify(currency));
                                                                
                                                                setModulatorErrorMsg(null);
                                                                const newSlots = [...modulatorSlotProgress];
                                                                newSlots[idx] = true;
                                                                saveModulatorSlots(newSlots);
                                                                
                                                                if (newSlots.every(s => s === true)) {
                                                                    const equipment = [...inventory.equipment];
                                                                    if (!equipment.includes('util_advanced_scanner')) equipment.push('util_advanced_scanner');
                                                                    saveInventory({ ...inventory, modulator: true, equipment });
                                                                }
                                                                // trigger currency update globally
                                                                window.dispatchEvent(new Event('arn_inventory_update'));
                                                            } else {
                                                                setModulatorErrorMsg(`Insufficient Rare Minerals (Need ${COST} Photons from Octave 13).`);
                                                                setTimeout(() => setModulatorErrorMsg(null), 4000);
                                                            }
                                                        } catch(e) {}
                                                    }}
                                                    style={{ 
                                                        flex: 1, height: '60px', 
                                                        background: isFilled ? 'rgba(168, 85, 247, 0.15)' : '#0f172a',
                                                        border: `1px solid ${isFilled ? '#a855f7' : '#334155'}`,
                                                        borderRadius: '6px',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                        cursor: (isFilled || inventory.modulator) ? 'default' : 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {isFilled ? ( <span style={{ color: '#a855f7', fontSize: '1.2rem', fontWeight: 'bold' }}>✓</span> ) : (
                                                        <>
                                                            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 'bold' }}>PART {idx + 1}</span>
                                                            <span style={{ color: '#a855f7', fontSize: '0.75rem', fontWeight: 'bold', textAlign:'center' }}>250<br/>O-13</span>
                                                        </>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '24px' }}>
                                        {modulatorErrorMsg ? <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>{modulatorErrorMsg}</div> : <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Acquire components from rare ore.</div>}
                                        {inventory.modulator && <span style={{ color: '#a855f7', fontWeight: 'bold' }}>✓ FULLY ALLOCATED</span>}
                                    </div>
                                </div>

                                {/* Radar Frequency Tuner */}
                                <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden', boxShadow: inventory.frequencyTuner ? '0 0 20px rgba(255, 60, 60, 0.15)' : 'none' }}>
                                    {inventory.frequencyTuner && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at center, rgba(255, 60, 60, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />}
                                    <div>
                                        <h3 style={{ margin: '0 0 0.25rem', color: inventory.frequencyTuner ? '#ff4f4f' : '#fff', fontSize: '1.4rem' }}>Radar Frequency Tuner</h3>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>Install a precision resonance oscillator to target specific mineral frequencies on the radar map.</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                        <button
                                            disabled={inventory.frequencyTuner}
                                            onClick={() => {
                                                const COST = 1000;
                                                try {
                                                    const currencyString = localStorage.getItem('arn_oct_currency');
                                                    const currency = currencyString ? JSON.parse(currencyString) : {};
                                                    const oct13 = currency[13] || 0;
                                                    
                                                    if (oct13 >= COST) {
                                                        currency[13] = oct13 - COST;
                                                        localStorage.setItem('arn_oct_currency', JSON.stringify(currency));
                                                        setTunerErrorMsg(null);
                                                        saveInventory({ ...inventory, frequencyTuner: true });
                                                        window.dispatchEvent(new Event('arn_inventory_update'));
                                                    } else {
                                                        setTunerErrorMsg(`Insufficient O-13 Ore (Need ${COST} Units).`);
                                                        setTimeout(() => setTunerErrorMsg(null), 4000);
                                                    }
                                                } catch(e) {}
                                            }}
                                            style={{ 
                                                flex: 1, height: '60px', 
                                                background: inventory.frequencyTuner ? 'rgba(255, 60, 60, 0.15)' : '#0f172a',
                                                border: `1px solid ${inventory.frequencyTuner ? '#ff4f4f' : '#334155'}`,
                                                borderRadius: '6px',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                cursor: inventory.frequencyTuner ? 'default' : 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {inventory.frequencyTuner ? ( <span style={{ color: '#ff4f4f', fontSize: '1.2rem', fontWeight: 'bold' }}>✓</span> ) : (
                                                <>
                                                    <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 'bold' }}>SINGLE ALLOY SLOT</span>
                                                    <span style={{ color: '#ff4f4f', fontSize: '0.85rem', fontWeight: 'bold' }}>1,000 O-13</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '24px' }}>
                                        {tunerErrorMsg ? <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>{tunerErrorMsg}</div> : <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Targeted mineral extraction required.</div>}
                                        {inventory.frequencyTuner && <span style={{ color: '#ff4f4f', fontWeight: 'bold' }}>✓ INSTALLED ON SHIP</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Left Panel: List */}
                    <div style={{ 
                        width: '320px', borderRight: '1px solid #1e293b', 
                        overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                        background: '#080c16'
                    }}>
                        {(Object.keys(BUILDING_CONFIG) as BuildingType[]).map(bType => {
                            const config = BUILDING_CONFIG[bType];
                            const state = baseState.buildings[bType];
                            const isBuilt = state.level > 0;
                            const isBuilding = state.constructionEndTime !== null;
                            const isSelected = selectedBuilding === bType;
                            
                            return (
                                <button key={bType} 
                                    onClick={() => setSelectedBuilding(bType)}
                                    style={{
                                        background: isSelected ? `${planetColor}20` : '#111827',
                                        border: `1px solid ${isSelected ? planetColor : (isBuilt ? planetColor+'80' : '#334155')}`,
                                        borderRadius: '6px', padding: '1.2rem',
                                        textAlign: 'left', cursor: 'pointer',
                                        color: '#f8fafc', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                                    }}
                                >
                                    {isBuilt && <div style={{ position: 'absolute', top: 0, right: 0, background: planetColor, color: '#000', padding: '0.1rem 0.4rem', fontSize: '0.6rem', fontWeight: 'bold', borderBottomLeftRadius: '6px' }}>LVL {state.level}</div>}
                                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{config.name}</h4>
                                    <div style={{ fontSize: '0.75rem', color: isBuilding ? planetColor : (isBuilt ? '#4ade80' : '#94a3b8') }}>
                                        {isBuilding ? 'Under Construction...' : (isBuilt ? 'Operational' : 'Available to Build')}
                                    </div>
                                    {isBuilding && <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: planetColor, width: '100%', opacity: 0.8 }} />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Panel: Details */}
                    <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
                        {!selectedBuilding ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '1.1rem' }}>
                                Select a facility to configure
                            </div>
                        ) : (
                            (() => {
                                const bType = selectedBuilding;
                                const config = BUILDING_CONFIG[bType];
                                const state = baseState.buildings[bType];
                                const isBuilt = state.level > 0;
                                const isBuilding = state.constructionEndTime !== null;
                                
                                let progress = 0;
                                if (isBuilding && state.constructionStartTime && state.constructionEndTime) {
                                    const total = state.constructionEndTime - state.constructionStartTime;
                                    const elapsed = now - state.constructionStartTime;
                                    progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
                                }

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeIn 0.2s ease-out' }}>
                                        <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                            <h2 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '2.2rem', textShadow: `0 0 15px ${planetColor}40` }}>{config.name}</h2>
                                            <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6, fontSize: '1rem' }}>{config.desc}</p>
                                        </div>

                                        {/* Status / Actions */}
                                        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                            {!isBuilt && !isBuilding && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>CONSTRUCTION COST</div>
                                                        <div style={{ color: '#fbbf24', fontSize: '1.8rem', fontWeight: 'bold' }}>{config.cost} ◈</div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleBuy(bType)}
                                                        style={{ 
                                                            padding: '0.8rem 2.5rem', background: '#2563eb', color: '#fff', 
                                                            border: 'none', borderRadius: '6px',
                                                            cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold', fontSize: '1rem',
                                                            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                                                        }}
                                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                    >
                                                        COMMENCE BUILD
                                                    </button>
                                                </div>
                                            )}

                                            {isBuilding && (
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '1.1rem' }}>
                                                        <span style={{ color: planetColor, fontWeight: 'bold' }}>Construction in Progress...</span>
                                                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{Math.floor(progress)}%</span>
                                                    </div>
                                                    <div style={{ width: '100%', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
                                                        <div style={{ width: `${progress}%`, height: '100%', background: planetColor, transition: 'width 0.1s linear', boxShadow: `0 0 10px ${planetColor}` }} />
                                                    </div>
                                                    <button 
                                                        onClick={() => speedUpConstruction(bType)}
                                                        style={{ 
                                                            width: '100%', padding: '1rem', background: `${planetColor}20`, color: planetColor, 
                                                            border: `1px solid ${planetColor}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={e => e.currentTarget.style.background = `${planetColor}40`}
                                                        onMouseOut={e => e.currentTarget.style.background = `${planetColor}20`}
                                                    >
                                                        SPEED UP (INSTANT COMPLETION)
                                                    </button>
                                                </div>
                                            )}

                                            {isBuilt && !isBuilding && (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ background: planetColor, color: '#000', padding: '0.4rem 1rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                            LEVEL {state.level}
                                                        </div>
                                                        <span style={{ color: '#4ade80', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }}/>
                                                            Facility Operational
                                                        </span>
                                                    </div>
                                                    <button style={{ 
                                                        padding: '0.6rem 1.5rem', background: 'transparent', color: '#94a3b8', 
                                                        border: '1px solid #475569', borderRadius: '4px', cursor: 'pointer' 
                                                    }}>
                                                        Upgrade Facility
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Management Area */}
                                        {isBuilt && !isBuilding && (
                                            <div style={{ flex: 1, background: '#0f172a', border: '1px dashed #334155', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                <div style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#e2e8f0' }}>Management Interface</div>
                                                <p style={{ textAlign: 'center', maxWidth: '400px', lineHeight: 1.6 }}>[ Placeholder UI for {config.name} specific functionality, crew assignments, and resource outputs. ]</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()
                        )}
                    </div>
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div style={{ 
                    padding: '1.2rem 2rem', 
                    background: '#080c16', borderTop: '1px solid #1e293b',
                    display: 'flex', justifyContent: 'flex-end' 
                }}>
                    <button 
                        onClick={onClose}
                        style={{ 
                            padding: '0.7rem 2.5rem', background: '#ef4444', color: '#fff', 
                            border: 'none', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.05em',
                            boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        CLOSE SECURE LINK
                    </button>
                </div>
            </div>
        </div>
    );
}
