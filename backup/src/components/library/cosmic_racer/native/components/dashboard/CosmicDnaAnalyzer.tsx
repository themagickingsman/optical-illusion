'use client';

import React, { useState } from 'react';
import nucleobases from '../../state/science/datasets/dna/nucleobases.json';
import aminoAcids from '../../state/science/datasets/dna/amino_acids.json';
import codons from '../../state/science/datasets/dna/codons.json';
import chr22Data from '../../state/science/datasets/dna/chr22_resonant_signature.json';
import { DASHBOARD_THEME } from './DashboardTheme';

// Calculate Framework Output based on Biology Inputs
const calculateResonance = (mass: number) => {
    // Arbitrary framework mapping logic to display physical stats
    const baseWavelengthNm = 0.34; 
    const exactLength = (mass / 135) * baseWavelengthNm; // Rough ratio based on Adenine
    const freqTHz = 300 / exactLength; 
    return {
        lengthNm: exactLength.toFixed(4),
        freqTHz: freqTHz.toFixed(2),
        octave: exactLength < 1.0 ? "Octave 5: Molecular" : "Octave 6: Bio-Resonance"
    };
};

export const CosmicDnaAnalyzer = () => {
    const [selectedElement, setSelectedElement] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'BASES' | 'AMINO_ACIDS' | 'CODONS' | 'CODONS_CHR22' | 'LINEAGE_DRIFT'>('BASES');
    const [activeLineage, setActiveLineage] = useState('Baseline GRCh38 (RP11)');
    
    // Baseline Lineage Geometries (Mocks derived from real SNPs)
    const lineageData: Record<string, any> = {
        "Baseline GRCh38 (RP11)": {
            description: "The conventional 'center' of scientific DNA maps (Buffalo, NY). Zero drift.",
            shifts: [],
            color: "#94a3b8"
        },
        "Haplogroup R1b (Eurasian)": {
            description: "Characterized by M343. Linear geography maps this as an outward branch; Cosmic Compass maps this as a specific Phase shift.",
            shifts: [{ from: 'CAA', to: 'CGA', desc: "M343 SNP (A->G Phase Shift)" }],
            color: "#3b82f6"
        },
        "Haplogroup E1b1a (Bantu / Lemba)": {
            description: "Characterized by M2, M96. The core lineage of the Lemba tracking.",
            shifts: [
                { from: 'TTC', to: 'TTA', desc: "M96 SNP (C->A Phase Shift)" },
                { from: 'CAG', to: 'CGG', desc: "M2 SNP (A->G Phase Shift)" }
            ],
            color: "#10b981"
        },
        "Haplogroup A00 (San / Khoe)": {
            description: "The deepest diverging human lineage. Longest orbital distance from the RP11 baseline.",
            shifts: [
                { from: 'ATG', to: 'ATA', desc: "L1086 SNP (G->A Phase Shift)" },
                { from: 'CCC', to: 'CTC', desc: "V168 SNP (C->T Phase Shift)" },
                { from: 'GAC', to: 'GAT', desc: "M91 SNP (C->T Phase Shift)" }
            ],
            color: "#f43f5e"
        }
    };
    
    // Normalize heatmap density
    const maxDensity = Math.max(...Object.values(chr22Data.codonDensityMap));

    return (
        <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
            color: '#f8fafc', padding: '2rem', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '2rem'
        }}>
            {/* Header */}
            <div>
                <h1 style={{ color: DASHBOARD_THEME.colors.accents.cyan.base, fontSize: '2rem', marginBottom: '0.5rem' }}>
                    The Periodic Table of DNA
                </h1>
                <p style={{ color: DASHBOARD_THEME.colors.text.muted }}>
                    Mapping the fundamental physical elements of the genetic code to the Universal Chronometer.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <button
                    onClick={() => setViewMode('BASES')}
                    style={{
                        background: 'transparent', color: viewMode === 'BASES' ? '#14b8a6' : '#94a3b8',
                        border: 'none', borderBottom: viewMode === 'BASES' ? '2px solid #14b8a6' : 'none',
                        padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem'
                    }}
                >
                    The 4 Nucleobases
                </button>
                <button
                    onClick={() => setViewMode('AMINO_ACIDS')}
                    style={{
                        background: 'transparent', color: viewMode === 'AMINO_ACIDS' ? '#a855f7' : '#94a3b8',
                        border: 'none', borderBottom: viewMode === 'AMINO_ACIDS' ? '2px solid #a855f7' : 'none',
                        padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem'
                    }}
                >
                    The 20 Amino Acids
                </button>
                <button
                    onClick={() => setViewMode('CODONS')}
                    style={{
                        background: 'transparent', color: viewMode === 'CODONS' ? '#38bdf8' : '#94a3b8',
                        border: 'none', borderBottom: viewMode === 'CODONS' ? '2px solid #38bdf8' : 'none',
                        padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem'
                    }}
                >
                    The 64 Codon Matrix
                </button>
                <button
                    onClick={() => setViewMode('CODONS_CHR22')}
                    style={{
                        background: 'transparent', color: viewMode === 'CODONS_CHR22' ? '#f59e0b' : '#94a3b8',
                        border: 'none', borderBottom: viewMode === 'CODONS_CHR22' ? '2px solid #f59e0b' : 'none',
                        padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem'
                    }}
                >
                    Chr 22 Projection
                </button>
                <button
                    onClick={() => setViewMode('LINEAGE_DRIFT')}
                    style={{
                        background: 'transparent', color: viewMode === 'LINEAGE_DRIFT' ? '#ec4899' : '#94a3b8',
                        border: 'none', borderBottom: viewMode === 'LINEAGE_DRIFT' ? '2px solid #ec4899' : 'none',
                        padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem'
                    }}
                >
                    Lineage Tracker 
                </button>
            </div>
            
            {/* Lineage Sub-Selector */}
            {viewMode === 'LINEAGE_DRIFT' && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {Object.keys(lineageData).map((key) => (
                        <div 
                            key={key} 
                            onClick={() => setActiveLineage(key)}
                            style={{ 
                                padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${lineageData[key].color}`,
                                background: activeLineage === key ? lineageData[key].color : 'transparent',
                                color: activeLineage === key ? '#020617' : lineageData[key].color
                            }}
                        >
                            {key}
                        </div>
                    ))}
                </div>
            )}

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 350px', gap: '2rem', flex: 1 }}>
                
                {/* Visual Matrix */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'BASES' ? 'repeat(2, 1fr)' : (viewMode === 'AMINO_ACIDS' ? 'repeat(5, 1fr)' : 'repeat(8, 1fr)'),
                    gap: viewMode.startsWith('CODONS') ? '0.5rem' : '1rem',
                    alignContent: 'start'
                }}>
                    {(viewMode === 'BASES' ? nucleobases : (viewMode === 'AMINO_ACIDS' ? aminoAcids : codons)).map((item: any, idx) => {
                        const isSelected = selectedElement && ((item.name && selectedElement.name === item.name) || (item.sequence && selectedElement.sequence === item.sequence));
                        const isCodonGrid = viewMode.startsWith('CODONS') || viewMode === 'LINEAGE_DRIFT';
                        
                        // Calculate Heatmap styling for Chr22 Override
                        let bgColor = 'rgba(15,23,42,0.8)';
                        let textColor = isCodonGrid ? (item.amino_acid === 'Stop' ? '#ef4444' : (item.sequence === 'ATG' ? '#10b981' : '#38bdf8')) : (viewMode === 'BASES' ? '#3b82f6' : '#a855f7');
                        let borderStyle = `1px solid ${isSelected ? DASHBOARD_THEME.colors.accents.cyan.base : 'rgba(255,255,255,0.1)'}`;

                        if (viewMode === 'CODONS_CHR22') {
                            const frequency = chr22Data.codonDensityMap[item.sequence as keyof typeof chr22Data.codonDensityMap] || 0;
                            const intensity = frequency / maxDensity;
                            bgColor = `rgba(245, 158, 11, ${0.1 + (intensity * 0.9)})`;
                            textColor = intensity > 0.4 ? '#020617' : '#f8fafc';
                            borderStyle = `1px solid rgba(245, 158, 11, ${intensity})`;
                        }

                        if (viewMode === 'LINEAGE_DRIFT') {
                            const currentLineage = lineageData[activeLineage];
                            const isMutationOrigin = currentLineage.shifts.find((s: any) => s.from === item.sequence);
                            const isMutationTarget = currentLineage.shifts.find((s: any) => s.to === item.sequence);
                            
                            if (isMutationOrigin) {
                                bgColor = 'rgba(100, 116, 139, 0.4)';
                                borderStyle = '1px solid #64748b';
                                textColor = '#94a3b8';
                            } else if (isMutationTarget) {
                                bgColor = `rgba(${currentLineage.color === '#10b981' ? '16,185,129' : (currentLineage.color === '#f43f5e' ? '244,63,94' : '59,130,246')}, 0.2)`;
                                borderStyle = `1px solid ${currentLineage.color}`;
                                textColor = currentLineage.color;
                            } else if (activeLineage === 'Baseline GRCh38 (RP11)') {
                                bgColor = 'rgba(255,255,255,0.02)';
                                borderStyle = '1px solid rgba(255,255,255,0.05)';
                                textColor = '#334155';
                            } else {
                                bgColor = 'transparent';
                                borderStyle = '1px solid rgba(255,255,255,0.05)';
                                textColor = '#1e293b';
                            }
                        }

                        if (isSelected && !viewMode.includes('CHR22') && viewMode !== 'LINEAGE_DRIFT') {
                            bgColor = 'rgba(255,255,255,0.1)';
                        }
                        
                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedElement(item)}
                                style={{
                                    background: isSelected && viewMode === 'CODONS_CHR22' ? '#fcd34d' : (isSelected && viewMode === 'LINEAGE_DRIFT' ? lineageData[activeLineage].color : bgColor),
                                    border: borderStyle,
                                    padding: isCodonGrid ? '0.75rem' : '1.5rem', 
                                    borderRadius: '12px', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease', backdropFilter: 'blur(10px)',
                                    boxShadow: isSelected ? `0 0 15px ${viewMode === 'CODONS_CHR22' ? '#f59e0b' : (viewMode === 'LINEAGE_DRIFT' ? lineageData[activeLineage].color : DASHBOARD_THEME.colors.accents.cyan.glow)}` : 'none'
                                }}
                            >
                                <span style={{ 
                                    fontSize: isCodonGrid ? '1rem' : '2.5rem', 
                                    fontWeight: 900, 
                                    color: (isSelected && viewMode === 'CODONS_CHR22') || (isSelected && viewMode === 'LINEAGE_DRIFT') ? '#000' : textColor 
                                }}>
                                    {isCodonGrid ? item.sequence : (item.symbol || 'X')}
                                </span>
                                <span style={{ 
                                    fontSize: '0.65rem', 
                                    color: (viewMode === 'CODONS_CHR22' || (viewMode === 'LINEAGE_DRIFT' && isSelected)) ? (textColor === '#020617' || textColor === '#000' ? '#1e293b' : '#94a3b8') : '#94a3b8', 
                                    marginTop: '0.25rem', textAlign: 'center' 
                                }}>
                                    {isCodonGrid ? item.amino_acid : item.name}
                                </span>
                                {viewMode === 'BASES' && (
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                                        {item.type}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Sidebar Data Inspector */}
                <div style={{
                    background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
                    backdropFilter: 'blur(20px)'
                }}>
                    <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', margin: 0 }}>
                        Cosmic Data Inspector
                    </h2>

                    {viewMode === 'LINEAGE_DRIFT' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1.5rem', margin: 0, color: lineageData[activeLineage].color }}>
                                {activeLineage}
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                {lineageData[activeLineage].description}
                            </p>
                            
                            {activeLineage !== 'Baseline GRCh38 (RP11)' && (
                                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '1rem', marginTop: '1rem', marginBottom: selectedElement ? '1rem' : '0' }}>
                                    <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Calculated Phase Shifts</h4>
                                    {lineageData[activeLineage].shifts.map((s: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#94a3b8' }}>{s.desc}</span>
                                            <span style={{ color: lineageData[activeLineage].color, fontWeight: 600 }}>{s.from} → {s.to}</span>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>Cumulative Angular Shift</span>
                                        <span style={{ color: '#ec4899', fontSize: '1.2rem', fontWeight: 800 }}>+{(lineageData[activeLineage].shifts.length * 11.25).toFixed(2)}°</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedElement ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: viewMode.startsWith('CODONS') || viewMode === 'LINEAGE_DRIFT' ? '2.5rem' : '1.8rem', margin: 0, color: DASHBOARD_THEME.colors.accents.cyan.base, letterSpacing: viewMode.startsWith('CODONS') || viewMode === 'LINEAGE_DRIFT' ? '4px' : '0' }}>
                                    {viewMode.startsWith('CODONS') || viewMode === 'LINEAGE_DRIFT' ? selectedElement.sequence : selectedElement.name}
                                </h3>
                                <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                    {viewMode.startsWith('CODONS') || viewMode === 'LINEAGE_DRIFT' ? `Codes for: ${selectedElement.amino_acid}` : `Chemical Formula: ${selectedElement.formula}`}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Molar Mass (g/mol)</span>
                                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{selectedElement.mass_gmol || selectedElement.mass}</span>
                                </div>
                                
                                {(() => {
                                    // Calculate mass or use a default weight for Codons
                                    const calcMass = selectedElement.mass_gmol || selectedElement.mass || 330 * 3; 
                                    const res = calculateResonance(calcMass);
                                    
                                    // Provide dynamic math for Codon polarity exactly as computed in dna_catalog
                                    const baseToVal: Record<string, number> = { 'A': 0, 'C': 1, 'G': 2, 'T': 3, 'U': 3 };
                                    const baseToBonds: Record<string, number> = { 'A': 2, 'C': 3, 'G': 3, 'T': 2, 'U': 2 };

                                    let indexStr = "";
                                    let freqDesc = res.freqTHz + " THz";
                                    let wavelengthDesc = res.lengthNm + " nm";

                                    if (viewMode.startsWith('CODONS')) {
                                        const v0 = baseToVal[selectedElement.sequence[0]] || 0;
                                        const v1 = baseToVal[selectedElement.sequence[1]] || 0;
                                        const v2 = baseToVal[selectedElement.sequence[2]] || 0;
                                        const decimalIndex = v0 * 16 + v1 * 4 + v2 * 1;
                                        const totalBonds = (baseToBonds[selectedElement.sequence[0]] || 2) +
                                                           (baseToBonds[selectedElement.sequence[1]] || 2) +
                                                           (baseToBonds[selectedElement.sequence[2]] || 2);
                                        
                                        indexStr = `Phase Angle: ${((decimalIndex / 64) * 360).toFixed(0)}°`;
                                        freqDesc = `Polarity: ${totalBonds} H-Bonds`;
                                        wavelengthDesc = `Base-4 Index: ${decimalIndex}/64`;
                                        
                                        if (viewMode === 'CODONS_CHR22') {
                                            const totalOccurrences = chr22Data.codonDensityMap[selectedElement.sequence as keyof typeof chr22Data.codonDensityMap] || 0;
                                            indexStr = `Phase Shift: ${((decimalIndex / 64) * 360).toFixed(0)}°`;
                                            freqDesc = `${totalOccurrences.toLocaleString()} Resonances`;
                                            wavelengthDesc = `${((totalOccurrences / chr22Data.metadata.totalBases) * 100).toFixed(4)}% of Macro Antenna`;
                                        }
                                    }

                                    return (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{viewMode.startsWith('CODONS') ? (viewMode === 'CODONS_CHR22' ? 'Macro Density' : 'Hexagram Match') : 'Wavelength Boundary'}</span>
                                                <span style={{ color: '#fcd34d', fontWeight: 600 }}>{wavelengthDesc}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{viewMode.startsWith('CODONS') ? (viewMode === 'CODONS_CHR22' ? 'Chr22 Weight' : 'Frequency Weight') : 'Resonant Frequency'}</span>
                                                <span style={{ color: '#f43f5e', fontWeight: 600 }}>{freqDesc}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Cosmic Compass Map</span>
                                                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                                                    {viewMode.startsWith('CODONS') ? indexStr : res.octave}
                                                </span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        viewMode !== 'LINEAGE_DRIFT' && (
                            <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
                                Select a fundamental element from the matrix to analyze its geometric and atomic resonance.
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
