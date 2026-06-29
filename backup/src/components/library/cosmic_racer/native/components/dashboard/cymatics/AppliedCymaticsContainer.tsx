"use client";

import React, { useState } from 'react';
import { COSMIC_OCTAVES } from './OctaveResonanceVisualizer';
import { OctaveResonanceVisualizer } from './OctaveResonanceVisualizer';
import { OctaveControlDesk } from './OctaveControlDesk';

export const AppliedCymaticsContainer = () => {
    // Start with all octaves active (composite universe)
    const [activeOctaves, setActiveOctaves] = useState<number[]>(COSMIC_OCTAVES.map(o => o.id));
    
    const [animationMode, setAnimationMode] = useState<'STANDING' | 'FREQUENCY_PATTERNS'>('STANDING');
    const [activeElements, setActiveElements] = useState<number[]>([79]); // Default to Gold (Au)
    const [waveAmplitude, setWaveAmplitude] = useState<number>(1); // Base multiplier for intensity
    const [physicalMedium, setPhysicalMedium] = useState<'AIR' | 'WATER' | 'METAL'>('WATER');

    const toggleOctave = (id: number) => {
        setActiveOctaves(prev => {
            if (prev.includes(id)) {
                // Prevent turning off the last octave (always need at least 1)
                if (prev.length === 1) return prev;
                return prev.filter(o => o !== id);
            } else {
                return [...prev, id].sort((a,b) => a - b);
            }
        });
    };

    const toggleAll = () => {
        if (activeOctaves.length === COSMIC_OCTAVES.length) {
            // Isolate: just turn on Octave 1
            setActiveOctaves([1]);
        } else {
            // Composite: turn all on
            setActiveOctaves(COSMIC_OCTAVES.map(o => o.id));
        }
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {/* Header / Intro */}
            <div style={{ 
                background: '#fff', 
                borderRadius: '16px', 
                padding: '2.5rem', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <div style={{ maxWidth: '800px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '0.25rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                            APPLIED CYMATICS
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                            COSMIC COMPASS
                        </span>
                        {animationMode === 'FREQUENCY_PATTERNS' && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', background: '#fffbeb', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #fcd34d' }}>
                                ELEMENTAL FREQUENCIES
                            </span>
                        )}
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1, marginBottom: '1rem' }}>
                        {animationMode === 'STANDING' ? 'Octave Resonance Engine' : 'Frequency Patterns Engine'}
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: '#64748b' }}>
                        A foundational visualization of the 9 strict octaves of the Cosmic Compass. 
                        Observe how the base frequencies scale harmonically from the macro-cosmic scale down to the quantum foam, creating the composite interference pattern of our reality.
                    </p>
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }}>
                
                {/* Visualizer (Left) */}
                <div style={{ width: '100%', aspectRatio: '1/1' }}>
                    <OctaveResonanceVisualizer 
                        activeOctaves={activeOctaves} 
                        animationMode={animationMode}
                        setAnimationMode={setAnimationMode}
                        activeElements={activeElements}
                        waveAmplitude={waveAmplitude}
                        physicalMedium={physicalMedium}
                    />
                </div>

                {/* Controls & Data (Right) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <OctaveControlDesk 
                        activeOctaves={activeOctaves}
                        toggleOctave={toggleOctave}
                        toggleAll={toggleAll}
                        animationMode={animationMode}
                        activeElements={activeElements}
                        setActiveElements={setActiveElements}
                        waveAmplitude={waveAmplitude}
                        setWaveAmplitude={setWaveAmplitude}
                        physicalMedium={physicalMedium}
                        setPhysicalMedium={setPhysicalMedium}
                    />

                    {/* Meta Data Panel */}
                    <div style={{ 
                        background: '#fff', 
                        borderRadius: '16px', 
                        padding: '2rem', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
                            Frequency Diagnostics
                        </h3>
                        
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Octaves</span>
                                <span style={{ fontSize: '0.9rem', color: '#1e293b', fontFamily: 'monospace', fontWeight: 700 }}>{activeOctaves.length} / 9</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Wave Geometry</span>
                                <span style={{ fontSize: '0.9rem', color: '#3b82f6', fontFamily: 'monospace', fontWeight: 700 }}>CONCENTRIC_HARMONIC</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Sub-Octave Range</span>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                                    L-1 to L-72
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
