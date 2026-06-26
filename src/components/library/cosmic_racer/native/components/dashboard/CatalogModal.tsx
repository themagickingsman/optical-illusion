import React, { useState, useMemo } from 'react';
import { UnifiedCosmicCatalog, CatalogEntry } from '../../state/logic/UnifiedCosmicCatalog';
import { OCTAVE_COLORS } from './CosmicClock';
import { formatRadius } from '../../state/logic/formatUnits';

// Matches CosmicClock.tsx UI mapping
const LEVEL_LABELS = [0, 1, 3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 111];

interface CatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultOctave?: number;
}

const THEME = {
    background: 'rgba(15, 23, 42, 0.95)',
    border: 'rgba(99, 102, 241, 0.3)',
    text: '#fff',
    muted: '#94a3b8',
    itemBg: 'rgba(255,255,255,0.03)'
};

const OCTAVE_DOMAIN_NAMES: Record<number, string> = {
    0: "PRIMORDIAL FIELD",
    1: "QUANTUM FOAM",
    2: "STRONG NUCLEAR FORCE",
    3: "ATOMIC NUCLEUS",
    4: "ELECTRON ORBITALS",
    5: "MOLECULAR BONDS",
    6: "DNA & PROTEINS",
    7: "CELLULAR MECHANICS",
    8: "NEURAL OSCILLATIONS",
    9: "PLANETARY CAVITY",
    10: "LUNAR ORBITALS",
    11: "SOLAR SYSTEM",
    12: "OORT CLOUD",
    13: "CONSTELLATIONS",
    14: "MILKY WAY"
};

export const CatalogModal: React.FC<CatalogModalProps> = ({ isOpen, onClose, defaultOctave = 11 }) => {
    const [activeOctave, setActiveOctave] = useState<number>(defaultOctave);
    const [searchQuery, setSearchQuery] = useState('');

    const catalogData = useMemo(() => {
        return UnifiedCosmicCatalog.getCatalogByOctave(activeOctave);
    }, [activeOctave]);

    const filteredData = useMemo(() => {
        let data = catalogData;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(item => 
                item.name.toLowerCase().includes(q) ||
                item.type.toLowerCase().includes(q)
            );
        }
        
        // SORT: Matches First, then by Level, then by Name
        return [...data].sort((a, b) => {
            // 1. Matches vs Gaps
            const aHasMatch = !!a.scienceMatch;
            const bHasMatch = !!b.scienceMatch;
            if (aHasMatch && !bHasMatch) return -1;
            if (!aHasMatch && bHasMatch) return 1;

            // 3. Framework Level (Ascending)
            const levelDiff = (a.frameworkLevel || 0) - (b.frameworkLevel || 0);
            if (levelDiff !== 0) return levelDiff;

            // 4. Name (Alphabetical)
            return a.name.localeCompare(b.name);
        });
    }, [catalogData, searchQuery]);

    if (!isOpen) return null;

    return (
        <div 
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(5px)',
                zIndex: 100000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '900px',
                    height: '80vh',
                    background: THEME.background,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
            >
                {/* Header with Title and Search */}
                <div style={{ 
                    padding: '1.5rem', 
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                            Taxonomy Catalog
                        </h2>
                        <div style={{ fontSize: '0.8rem', color: THEME.muted, marginTop: '5px' }}>
                            Unified Database of Known Science Mappings
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                         <input 
                            type="text" 
                            placeholder="Search objects..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '0.5rem',
                                color: '#fff',
                                width: '200px'
                            }}
                        />
                        <button 
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px', height: '32px',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >✕</button>
                    </div>
                </div>

                {/* Tabs Row - WRAPPED */}
                <div style={{ 
                    padding: '1rem 1.5rem', 
                    background: 'rgba(0,0,0,0.2)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px', 
                        width: '100%',
                        justifyContent: 'flex-start' 
                    }}>
                        {/* Include Octave 0 (Void/Primordial) */}
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(oct => {
                            // Use the authoritative taxonomy name and level label
                            const label = LEVEL_LABELS[oct] !== undefined ? LEVEL_LABELS[oct] : oct;
                            const name = OCTAVE_DOMAIN_NAMES[oct] || `Region ${oct}`;
                            
                            // Highlight matching levels
                            const isSelected = activeOctave === oct;

                            return (
                                <button
                                    key={oct}
                                    onClick={() => setActiveOctave(oct)}
                                    style={{
                                        padding: '0.5rem 0.8rem',
                                        borderRadius: '6px', // Standard radius
                                        border: `1px solid ${isSelected ? OCTAVE_COLORS[oct] || '#fff' : 'rgba(255,255,255,0.1)'}`,
                                        background: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: isSelected ? '#fff' : THEME.muted,
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        whiteSpace: 'nowrap',
                                        minWidth: 'fit-content', // Allow button to shrink to fit text
                                        transition: 'all 0.2s ease',
                                        flex: '1 0 auto', // Auto-grow to fill rows nicely
                                        textAlign: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <span style={{ 
                                        opacity: isSelected ? 1 : 0.5, 
                                        color: isSelected ? OCTAVE_COLORS[oct] : 'inherit',
                                        minWidth: '20px',
                                        textAlign: 'right'
                                    }}>{label}</span>
                                    <span style={{ opacity: 0.2 }}>|</span>
                                    <span>{name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Data Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1rem' }}>
                        {filteredData.map((item, idx) => (
                            <div key={idx} style={{
                                background: THEME.itemBg,
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr', // 2-COLUMN LAYOUT
                                position: 'relative'
                            }}>
                                {/* ACCURACY BADGE (Top Right) - ONLY FOR SCIENCE MATCHES */}
                                {item.scienceMatch && item.frameworkMatch && item.frameworkMatch.alignment !== undefined && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: 'rgba(16, 185, 129, 0.2)', // Emerald Green bg
                                        color: '#34d399', // Emerald Green text
                                        border: '1px solid rgba(52, 211, 153, 0.3)',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 800,
                                        zIndex: 10,
                                        backdropFilter: 'blur(4px)',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                                    }}>
                                        {item.frameworkMatch.alignment.toFixed(4)}%
                                    </div>
                                )}

                                {/* LEFT COLUMN: SCIENCE DATA */}
                                <div style={{ 
                                    padding: '1rem', 
                                    background: 'rgba(15, 23, 42, 0.6)', 
                                    borderRight: '1px solid rgba(255,255,255,0.05)',
                                    opacity: item.scienceMatch ? 1 : 0.5,
                                    display: 'flex', flexDirection: 'column', gap: '8px'
                                }}>
                                    <div style={{ 
                                        fontSize: '0.65rem', color: '#60a5fa', textTransform: 'uppercase', 
                                        letterSpacing: '1px', fontWeight: 700 
                                    }}>
                                        KNOWN SCIENCE
                                    </div>
                                    
                                    {item.scienceMatch ? (
                                        <>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                                                {item.scienceMatch.name}
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{item.scienceMatch.type}</span>
                                            </div>
                                            
                                            {/* PHYSICS STATS GRID */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.6rem', color: THEME.muted }}>Mass</div>
                                                    <div style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
                                                        {(item.scienceMatch as any).mass_kg ? (item.scienceMatch as any).mass_kg.toExponential(2) : '-'} <span style={{ fontSize: '0.7em', color: '#666' }}>kg</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.6rem', color: THEME.muted }}>Density</div>
                                                    <div style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
                                                        {(item.scienceMatch as any).density_gcm3 ? (item.scienceMatch as any).density_gcm3.toFixed(2) : '-'} <span style={{ fontSize: '0.7em', color: '#666' }}>g/cm³</span>
                                                    </div>
                                                </div>
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <div style={{ fontSize: '0.6rem', color: THEME.muted }}>EM Field</div>
                                                    <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: (item.scienceMatch as any).electromagnetic_field_tesla ? '#a5f3fc' : 'inherit' }}>
                                                        {(item.scienceMatch as any).electromagnetic_field_tesla ? (item.scienceMatch as any).electromagnetic_field_tesla.toExponential(2) : '0'} <span style={{ fontSize: '0.7em', color: '#666' }}>T</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div style={{ marginTop: 'auto' }}>
                                                <div style={{ fontSize: '0.6rem', color: THEME.muted, textTransform: 'uppercase' }}>Real Radius</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                                                    {formatRadius(item.scienceMatch.semi_major_axis_au, activeOctave)}
                                                </div>
                                                <div style={{ fontSize: '0.6rem', color: THEME.muted, marginTop: '4px' }}>
                                                    Src: {item.scienceMatch.source}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: THEME.muted }}>
                                            <div style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>No Known Object</div>
                                            <div style={{ fontSize: '0.65rem' }}>Gap in Scientific Catalog</div>
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT COLUMN: FRAMEWORK MATCH */}
                                <div style={{ 
                                    padding: '1rem', 
                                    background: item.frameworkMatch ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                    position: 'relative',
                                    display: 'flex', flexDirection: 'column', gap: '8px'
                                }}>
                                    <div style={{ 
                                        fontSize: '0.65rem', color: item.frameworkMatch ? '#a78bfa' : THEME.muted, textTransform: 'uppercase', 
                                        letterSpacing: '1px', fontWeight: 700 
                                    }}>
                                        FRAMEWORK MATCH
                                    </div>
                                    
                                    {item.frameworkMatch ? (
                                        <>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e0e7ff', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                                                {/* SYSTEMATIC NAMING: Object [N] Octave [O] : Sub Octave [L] : Freq [Hz] */}
                                                
                                                <div style={{ fontSize: '0.9rem', color: '#a78bfa', marginBottom: '2px' }}>
                                                    OBJECT {(idx + 1).toString().padStart(3, '0')}
                                                </div>
                                                
                                                <span style={{ color: '#c4b5fd' }}>OCTAVE {activeOctave}</span>
                                                <span style={{ margin: '0 6px', color: 'rgba(255,255,255,0.2)' }}>:</span>
                                                {/* Normalize Global Level to Local Octave Level (0-111) */}
                                                <span style={{ color: '#c4b5fd' }}>
                                                    SUB OCTAVE {Math.abs(Math.round(item.frameworkMatch.level % 111))}
                                                </span>
                                                
                                                {/* Line Break for better readability */}
                                                <div style={{ fontSize: '0.8rem', marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center', color: '#eef2ff' }}>
                                                    <span style={{ fontWeight: 600 }}>{item.frameworkMatch.object_type ? item.frameworkMatch.object_type.toUpperCase() : 'NODE'}</span>
                                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                                                    <span style={{ fontFamily: 'monospace' }}>
                                                        FREQ {item.frameworkMatch.freq_hz ? item.frameworkMatch.freq_hz.toExponential(2) : '0.00e0'} Hz
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.6rem', background: item.frameworkMatch.status === 'verified' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(139, 92, 246, 0.2)', color: item.frameworkMatch.status === 'verified' ? '#4ade80' : '#d8b4fe', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {item.frameworkMatch.status === 'verified' ? 'VERIFIED MATCH' : 'PREDICTED'}
                                                </span>
                                                
                                                {item.frameworkMatch.radius_delta !== undefined && (
                                                    <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: Math.abs(item.frameworkMatch.radius_delta) < (item.frameworkMatch.radius_au * 0.01) ? '#4ade80' : '#9ca3af' }}>
                                                        Δ {item.frameworkMatch.radius_delta.toExponential(1)} AU
                                                    </span>
                                                )}
                                            </div>

                                            {/* HARMONIC PHYSICS STATS */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.6rem', color: '#a78bfa' }}>Pred. Mass</div>
                                                    <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: '#c4b5fd' }}>
                                                        {(item.frameworkMatch as any).mass_kg ? (item.frameworkMatch as any).mass_kg.toExponential(2) : '-'} <span style={{ fontSize: '0.7em', color: '#7c3aed' }}>kg</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.6rem', color: '#a78bfa' }}>Harmonic ρ</div>
                                                    <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: '#c4b5fd' }}>
                                                        {(item.frameworkMatch as any).density_gcm3 ? (item.frameworkMatch as any).density_gcm3.toFixed(2) : '-'} <span style={{ fontSize: '0.7em', color: '#7c3aed' }}>g/cm³</span>
                                                    </div>
                                                </div>
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <div style={{ fontSize: '0.6rem', color: '#a78bfa' }}>Resonance EM</div>
                                                    <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: '#c4b5fd' }}>
                                                        {(item.frameworkMatch as any).electromagnetic_field_tesla ? (item.frameworkMatch as any).electromagnetic_field_tesla.toExponential(2) : '0'} <span style={{ fontSize: '0.7em', color: '#7c3aed' }}>T</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 'auto' }}>
                                                <div style={{ fontSize: '0.6rem', color: '#a78bfa', textTransform: 'uppercase' }}>Framework Radius</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#c4b5fd', fontFamily: 'monospace' }}>
                                                    {formatRadius(item.frameworkMatch.radius_au, activeOctave)}
                                                </div>
                                            </div>    

                                        </>
                                    ) : (
                                        <div style={{ 
                                            height: '100%', display: 'flex', flexDirection: 'column', 
                                            alignItems: 'center', justifyContent: 'center', opacity: 0.5 
                                        }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔭</div>
                                            <div style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>No Match Found</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredData.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: THEME.muted }}>
                            No objects found.
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div style={{ 
                    padding: '1.5rem', 
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                       MATCHES: {filteredData.filter(i => i.scienceMatch).length}
                    </div>
                    
                    <div style={{ fontSize: '0.9rem', color: THEME.muted }}>
                        Total Objects: {filteredData.length} (Octave {activeOctave})
                    </div>
                </div>
            </div>
        </div>
    );
};
