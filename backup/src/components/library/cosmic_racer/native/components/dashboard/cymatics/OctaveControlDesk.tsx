"use client";

import React from 'react';
import { COSMIC_OCTAVES } from './OctaveResonanceVisualizer';
import { ELEMENTS, CATEGORY_COLORS, calculateElementalFrequency, formatFrequency, PeriodicElement } from '../../../state/data/elements_data';

interface OctaveControlDeskProps {
    activeOctaves: number[];
    toggleOctave: (id: number) => void;
    toggleAll: () => void;
    animationMode: 'STANDING' | 'FREQUENCY_PATTERNS';
    activeElements: number[];
    setActiveElements: React.Dispatch<React.SetStateAction<number[]>>;
    waveAmplitude: number;
    setWaveAmplitude: React.Dispatch<React.SetStateAction<number>>;
    physicalMedium: 'AIR' | 'WATER' | 'METAL';
    setPhysicalMedium: React.Dispatch<React.SetStateAction<'AIR' | 'WATER' | 'METAL'>>;
}

export const OctaveControlDesk: React.FC<OctaveControlDeskProps> = ({ 
    activeOctaves, 
    toggleOctave,
    toggleAll,
    animationMode,
    activeElements,
    setActiveElements,
    waveAmplitude,
    setWaveAmplitude,
    physicalMedium,
    setPhysicalMedium
}) => {
    const isAllActive = activeOctaves.length === COSMIC_OCTAVES.length;
    const isAllElementsActive = activeElements.length === ELEMENTS.length;

    const toggleElement = (id: number) => {
        // Restrict to single element selection for clarity
        setActiveElements([id]);
    };

    const toggleAllElements = () => {
        if (isAllElementsActive) {
            setActiveElements([1, 8]); // Isolate down to H2O
        } else {
            setActiveElements(ELEMENTS.map(e => e.number));
        }
    };

    return (
        <div style={{ 
            background: '#fff', 
            borderRadius: '16px', 
            padding: '2rem', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {animationMode === 'STANDING' ? 'Cosmic Compass Octaves' : 'Physical Elements Matrix'}
                    </h3>
                    {animationMode === 'STANDING' && (
                        <button 
                            onClick={toggleAll}
                            style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', background: isAllActive ? '#f1f5f9' : '#fff', cursor: 'pointer', color: '#64748b' }}
                        >
                            {isAllActive ? 'ISOLATE' : 'COMPOSITE'}
                        </button>
                    )}
                </div>
                
                {animationMode === 'FREQUENCY_PATTERNS' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Physical Medium</label>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                {(['AIR', 'WATER', 'METAL'] as const).map(medium => (
                                    <button
                                        key={medium}
                                        onClick={() => setPhysicalMedium(medium)}
                                        style={{
                                            padding: '0.5rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            borderRadius: '6px',
                                            border: '1px solid',
                                            borderColor: physicalMedium === medium ? '#3b82f6' : '#cbd5e1',
                                            background: physicalMedium === medium ? '#eff6ff' : '#fff',
                                            color: physicalMedium === medium ? '#2563eb' : '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {medium}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Wave Amplitude</label>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6', fontFamily: 'monospace' }}>{waveAmplitude.toFixed(2)}x</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="3.0" 
                                step="0.1" 
                                value={waveAmplitude}
                                onChange={(e) => setWaveAmplitude(parseFloat(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gap: '0.5rem', maxHeight: animationMode === 'FREQUENCY_PATTERNS' ? '600px' : 'none', overflowY: animationMode === 'FREQUENCY_PATTERNS' ? 'auto' : 'visible', paddingRight: '0.25rem' }}>
                {animationMode === 'STANDING' ? (
                    COSMIC_OCTAVES.map(octave => {
                        const isActive = activeOctaves.includes(octave.id);
                        return (
                            <button
                                key={octave.id}
                                onClick={() => toggleOctave(octave.id)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                    padding: '0.875rem',
                                    borderRadius: '8px',
                                    border: `1px solid ${isActive ? octave.color : '#e2e8f0'}`,
                                    background: isActive ? `${octave.color}10` : '#f8fafc',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'left',
                                    opacity: isActive ? 1 : 0.6
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ 
                                        width: '16px', 
                                        height: '16px', 
                                        borderRadius: '50%', 
                                        background: isActive ? octave.color : '#e2e8f0',
                                        border: `2px solid ${isActive ? '#fff' : 'transparent'}`,
                                        boxShadow: isActive ? `0 0 0 1px ${octave.color}` : 'none'
                                    }} />
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{octave.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{octave.levelRange} | Base: {octave.baseFrequency}Hz</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: isActive ? octave.color : '#cbd5e1', fontFamily: 'monospace' }}>
                                    O{octave.id}
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {ELEMENTS.map(element => {
                        const isActive = activeElements.includes(element.number);
                        const elementColorbg = CATEGORY_COLORS[element.category] || '#64748b';
                        return (
                            <button
                                key={element.number}
                                onClick={() => toggleElement(element.number)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: `1px solid ${isActive ? '#3b82f6' : '#e2e8f0'}`,
                                    background: isActive ? '#eff6ff' : '#f8fafc',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'left',
                                    opacity: isActive ? 1 : 0.6
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.25rem' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>{element.number}</div>
                                    <div style={{ 
                                        width: '8px', 
                                        height: '8px', 
                                        borderRadius: '50%', 
                                        background: elementColorbg,
                                    }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: isActive ? '#1e293b' : '#64748b' }}>{element.symbol}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{element.name}</div>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                                    Freq: {formatFrequency(calculateElementalFrequency(element))} | Mass: {element.atomic_mass}
                                </div>
                            </button>
                        );
                    })}
                    </div>
                )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5, marginTop: '0.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                {animationMode === 'STANDING' ? (
                    <><strong>Composite Resonance:</strong> The universe functions as a composite waveform of all 15 octaves interacting simultaneously. Isolating an octave reveals its foundational frequency signature.</>
                ) : (
                    <><strong>Elemental Frequencies:</strong> The structural loci of molecular resonance. Denser, higher-mass atomic lattices form deeply complex electromagnetic interference patterns at vastly accelerated kinetic propagation speeds.</>
                )}
            </div>
        </div>
    );
};
