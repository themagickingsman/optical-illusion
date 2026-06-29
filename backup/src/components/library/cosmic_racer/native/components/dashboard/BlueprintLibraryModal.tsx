import React, { useState, useMemo } from 'react';
import { AminoAcidCard, BingoBlueprint } from './GenomeSequencer';

interface BlueprintLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventory: Record<string, AminoAcidCard>;
    masterLibrary: BingoBlueprint[];
    discoveredBlueprintIds: string[];
}

export const BlueprintLibraryModal: React.FC<BlueprintLibraryModalProps> = ({
    isOpen,
    onClose,
    inventory,
    masterLibrary,
    discoveredBlueprintIds
}) => {
    const [activeTab, setActiveTab] = useState('Micro-Octave 8');
    const [searchQuery, setSearchQuery] = useState('');

    // Pre-calculate progress for all blueprints
    const blueprintsWithProgress = useMemo(() => {
        return masterLibrary.map(bp => {
            const isDiscovered = discoveredBlueprintIds.includes(bp.id);
            if (!isDiscovered) {
                return { ...bp, isDiscovered, progressPercent: 0, missingCount: bp.targetSequence.length };
            }

            // We now strictly use the actual progress tracked by the GenomeSequencer game state
            // to avoid false 100% loops if the user happens to have the required cards but hasn't spun them into this specific slot yet.
            const progressPercent = (bp.currentProgress / bp.targetSequence.length) * 100;
            const missingCount = bp.targetSequence.length - bp.currentProgress;

            return {
                ...bp,
                isDiscovered,
                progressPercent,
                missingCount
            };
        });
    }, [masterLibrary, discoveredBlueprintIds, inventory]);

    // Top 5 closest to completion (that aren't 100% completed)
    const top5Closest = useMemo(() => {
        return [...blueprintsWithProgress]
            .filter(bp => bp.isDiscovered && bp.progressPercent < 100)
            .sort((a, b) => b.progressPercent - a.progressPercent)
            .slice(0, 5);
    }, [blueprintsWithProgress]);

    const activeLoadout = [...top5Closest];

    // Filtered grid
    const filteredGrid = useMemo(() => {
        return blueprintsWithProgress.filter(bp => {
            if (activeTab !== 'ALL' && bp.category !== activeTab) return false;
            if (searchQuery && !bp.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [blueprintsWithProgress, activeTab, searchQuery]);


    if (!isOpen) return null;

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 1000,
            background: '#020617', display: 'flex', flexDirection: 'column', color: '#f8fafc',
            fontFamily: 'system-ui, sans-serif'
        }}>
            {/* TOP HEADER */}
            <div style={{ borderBottom: '1px solid #1e293b', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em', color: '#38bdf8' }}>
                        GENETIC DECK MANAGER
                    </h1>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                        type="text" 
                        placeholder="Search sequence..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #1e293b', background: '#0f172a', color: '#fff' }}
                    />
                    <button onClick={onClose} style={{
                        background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 2rem', 
                        borderRadius: '4px', fontWeight: 800, cursor: 'pointer'
                    }}>CLOSE</button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* LEFT: MAIN GRID */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* OCTAVE NAVIGATION TABS */}
                    <div style={{ 
                        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.75rem', marginBottom: '2rem',
                        padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px solid #1e293b'
                    }}>
                        {Array.from({length: 15}).map((_, i) => `Micro-Octave ${i}`).map(tab => {
                            const count = blueprintsWithProgress.filter(bp => bp.category === tab).length;

                            return (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        background: activeTab === tab ? '#38bdf8' : '#1e293b',
                                        border: '1px solid',
                                        borderColor: activeTab === tab ? '#38bdf8' : 'transparent',
                                        color: activeTab === tab ? '#020617' : '#94a3b8',
                                        padding: '0.75rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 800,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem',
                                        transition: 'all 0.2s ease', fontSize: '0.85rem'
                                    }}
                                >
                                    <span>{tab.replace('Micro-Octave ', 'OCT-')}</span>
                                    <span style={{ 
                                        background: activeTab === tab ? 'rgba(0,0,0,0.2)' : '#0f172a',
                                        padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem'
                                    }}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* CARD GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {filteredGrid.map(bp => (
                            <div key={bp.id} style={{
                                background: bp.isDiscovered ? '#0f172a' : '#040b16',
                                border: `1px solid ${bp.isDiscovered ? bp.themeColor : '#1e293b'}`,
                                opacity: bp.isDiscovered ? 1 : 0.5,
                                borderRadius: '12px', padding: '1.5rem', minHeight: '300px',
                                display: 'flex', flexDirection: 'column', position: 'relative',
                                boxShadow: bp.isDiscovered ? `0 4px 20px ${bp.themeColor}20` : 'none',
                                filter: bp.isDiscovered ? 'none' : 'grayscale(100%)'
                            }}>
                                
                                <div style={{ fontSize: '0.7rem', color: bp.themeColor, fontWeight: 800, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                                    {bp.category || 'UNKNOWN SYS'} 
                                    {!bp.isDiscovered && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>[CLOCKED]</span>}
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>
                                    {bp.name}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem', flex: 1 }}>
                                    {bp.reward}
                                </div>
                                
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Target Sequence</div>
                                        {!bp.isDiscovered && <div style={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 600 }}>REQUIRES CATALYST</div>}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                        {bp.targetSequence.map((aa, i) => {
                                            const isFilled = bp.isDiscovered && i < bp.currentProgress;
                                            return (
                                                <div key={i} style={{ 
                                                    width: '40px', height: '55px',
                                                    borderRadius: '6px',
                                                    background: isFilled ? 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)' : 'rgba(30, 41, 59, 0.5)',
                                                    border: `1px ${isFilled ? 'solid' : 'dashed'} ${isFilled ? bp.themeColor : '#334155'}`,
                                                    color: isFilled ? '#0f172a' : '#475569',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: isFilled ? `0 2px 5px ${bp.themeColor}40` : 'none',
                                                    opacity: isFilled ? 1 : 0.6,
                                                    position: 'relative'
                                                }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.05em' }}>
                                                        {aa}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ background: '#1e293b', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ 
                                        width: `${bp.isDiscovered ? bp.progressPercent : 0}%`, height: '100%', 
                                        background: bp.themeColor, transition: 'width 0.3s' 
                                    }} />
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.7rem', marginTop: '0.3rem', color: '#cbd5e1' }}>
                                    {bp.isDiscovered ? Math.round(bp.progressPercent) : 0}% SYNTHESIZED
                                </div>
                                
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: DYNAMIC LOADOUT BANNER */}
                <div style={{ 
                    width: '380px', borderLeft: '1px solid #1e293b', background: '#0a0f1c', 
                    padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' 
                }}>
                    <div>
                        <h2 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                            ACTIVE TARGET LOADOUT
                        </h2>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
                            The Sequencing Engine automatically targets the 5 blueprints closest to completion based on your current synthesized progress.
                        </div>

                        {/* TOP 5 */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b', marginBottom: '1rem', letterSpacing: '0.1em' }}>TOP 5 PRIORITY</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {top5Closest.map(bp => (
                                    <LoadoutCard key={bp.id} bp={bp} inventory={inventory} />
                                ))}
                                {top5Closest.length === 0 && <div style={{ color: '#475569', fontSize: '0.8rem' }}>No active blueprints discovered yet.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mini-card for the right sidebar
const LoadoutCard = ({ bp, inventory }: { bp: any, inventory: Record<string, AminoAcidCard> }) => {
    return (
        <div style={{
            background: '#0f172a', border: `1px solid ${bp.themeColor}50`,
            borderLeft: `4px solid ${bp.themeColor}`, borderRadius: '6px',
            padding: '1rem'
        }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>{bp.name}</div>
            <div style={{ background: '#1e293b', height: '4px', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{ width: `${bp.progressPercent}%`, height: '100%', background: bp.themeColor }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>{bp.targetSequence.length - bp.missingCount} / {bp.targetSequence.length} Assembled</span>
                <span style={{ color: bp.themeColor }}>{Math.round(bp.progressPercent)}%</span>
            </div>
        </div>
    );
};
