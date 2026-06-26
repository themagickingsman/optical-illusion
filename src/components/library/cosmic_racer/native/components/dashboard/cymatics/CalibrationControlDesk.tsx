"use client";

import React, { useMemo } from 'react';
import { ChladniIcon } from './ChladniIcon';
// import { BRUSSPUP_BENCHMARKS } from './chladniMath';  <-- Removed

interface CalibrationControlDeskProps {
    activeFrequencies: number[];
    setActiveFrequencies: React.Dispatch<React.SetStateAction<number[]>>;
    waveAmplitude: number;
    setWaveAmplitude: React.Dispatch<React.SetStateAction<number>>;
    physicalMedium: 'AIR' | 'WATER' | 'METAL';
    setPhysicalMedium: React.Dispatch<React.SetStateAction<'AIR' | 'WATER' | 'METAL'>>;
}

export const CalibrationControlDesk: React.FC<CalibrationControlDeskProps> = ({ 
    activeFrequencies, 
    setActiveFrequencies,
    waveAmplitude,
    setWaveAmplitude,
    physicalMedium,
    setPhysicalMedium
}) => {
    // Generate 40 sweep calibration cards logarithmically across the acoustic spectrum
    // Anchored loosely to Schumann Resonance mathematics
    const frequencyCards = useMemo(() => {
        // Force the user-requested frequencies to the top of the testing list
        const cards = [2041, 1820, 4129, 4444];
        const baseFrequencies = [7.83, 14.3, 20.8, 27.3, 33.8]; // Schumann harmonics
        
        for (let octave = 1; octave <= 8; octave++) {
            for (const base of baseFrequencies) {
                // Scale up by octaves (powers of 2 roughly)
                const freq = parseFloat((base * Math.pow(2, octave - 1)).toFixed(2));
                if (freq < 4500 && !cards.includes(freq)) { // Keep under visually chaotic limit and avoid duplicates
                    cards.push(freq);
                }
            }
        }
        return cards.slice(0, 40); // Lock to 40 cards for UI parity
    }, []);

    const toggleFrequency = (hz: number) => {
        // Restrict to single frequency tracking for clean, precise validation
        setActiveFrequencies([hz]);
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
                        Physical Sweep Matrix
                    </h3>
                </div>
                
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {frequencyCards.map((hz) => {
                    const isActive = activeFrequencies.includes(hz);
                    return (
                        <button
                            key={hz}
                            onClick={() => toggleFrequency(hz)}
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
                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
                                <ChladniIcon hz={hz} size={40} color={isActive ? '#3b82f6' : '#94a3b8'} />
                                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.25rem' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>HZ_{String(hz).padStart(4, '0')}</div>
                                        <div style={{ 
                                            width: '8px', 
                                            height: '8px', 
                                            borderRadius: '50%', 
                                            background: isActive ? '#3b82f6' : '#cbd5e1',
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: isActive ? '#1e293b' : '#64748b' }}>{hz}</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Hertz</div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5, marginTop: '0.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <strong>Raw Acoustic Sweep:</strong> Isolate specific scalar frequency packets instead of atomic lattices. Notice the direct proportional relationship between injected mathematical complexity and emerging physical boundaries.
            </div>
        </div>
    );
};
