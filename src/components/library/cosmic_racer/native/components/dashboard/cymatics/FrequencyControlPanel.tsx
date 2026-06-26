"use client";

import React from 'react';
import { DASHBOARD_THEME } from '../DashboardTheme';
import { getChladniModes } from './chladniMath';

export interface FrequencyPreset {
    id: string;
    name: string;
    freq: number;
    color: string;
    desc: string;
}

export const FREQUENCY_PRESETS: FrequencyPreset[] = [
    { id: 'solfeggio_396', name: 'Root (Liberation)', freq: 396, color: '#ef4444', desc: 'Turns grief into joy, liberating guilt & fear. Associated with the Root chakra.' },
    { id: 'solfeggio_417', name: 'Sacral (Undoing)', freq: 417, color: '#f97316', desc: 'Undoing situations and facilitating change. Clears traumatic experiences.' },
    { id: 'solfeggio_528', name: 'Solar (Miracles/DNA)', freq: 528, color: '#eab308', desc: 'Transformation and miracles (DNA repair). Associates with the Solar Plexus.' },
    { id: 'solfeggio_639', name: 'Heart (Connection)', freq: 639, color: '#10b981', desc: 'Re-connecting and balancing relationships. Associated with the Heart.' },
    { id: 'solfeggio_741', name: 'Throat (Expression)', freq: 741, color: '#06b6d4', desc: 'Solving problems, expressions/solutions. Associated with the Throat.' },
    { id: 'solfeggio_852', name: 'Third Eye (Intuition)', freq: 852, color: '#6366f1', desc: 'Returning to spiritual order. Awakening intuition. Third Eye chakra.' },
    { id: 'schumann', name: 'Schumann Resonance', freq: 7.83, color: '#8b5cf6', desc: 'The base atmospheric resonance of the Earth itself. The global heartbeat.' },
    { id: 'math_phi', name: 'Phi Ratio Harmonic', freq: 161.8, color: '#ec4899', desc: 'Golden ratio scaling translated into pure acoustic vibration.' }
];

interface FrequencyControlPanelProps {
    activePresetId: string;
    onSelectPreset: (presetId: string) => void;
    amplitude: number;
    onAmplitudeChange: (val: number) => void;
}

export const FrequencyControlPanel: React.FC<FrequencyControlPanelProps> = ({ 
    activePresetId, 
    onSelectPreset,
    amplitude,
    onAmplitudeChange
}) => {
    return (
        <div style={{ 
            background: '#fff', 
            borderRadius: '16px', 
            padding: '2rem', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
        }}>
            <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    Harmonic Catalog
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {FREQUENCY_PRESETS.map(preset => {
                        const isActive = preset.id === activePresetId;
                        const { n, m } = getChladniModes(preset.freq);

                        return (
                            <button
                                key={preset.id}
                                onClick={() => onSelectPreset(preset.id)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: `1px solid ${isActive ? preset.color : '#e2e8f0'}`,
                                    background: isActive ? `${preset.color}10` : '#f8fafc',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: preset.color }} />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{preset.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>n:{n} / m:{m}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: preset.color, fontFamily: 'monospace' }}>
                                    {preset.freq}Hz
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Wave Amplitude</h3>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>{(amplitude * 100).toFixed(0)}%</span>
                </div>
                <input 
                    type="range" 
                    min="0.1" 
                    max="2.0" 
                    step="0.1" 
                    value={amplitude} 
                    onChange={(e) => onAmplitudeChange(parseFloat(e.target.value))}
                    style={{ 
                        width: '100%',
                        accentColor: DASHBOARD_THEME.colors.accents.cyan.base,
                        cursor: 'pointer'
                    }} 
                />
            </div>
        </div>
    );
};
