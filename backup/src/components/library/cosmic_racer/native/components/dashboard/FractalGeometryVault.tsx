import React, { useState } from 'react';
import geometriesData from '../data/harmonic_geometries.json';
import { COSMIC_THEME } from './OrbitalFractalGenerator';

// Types derived from our extraction script
interface ResonanceData {
    body1: string;
    body2: string;
    ratioString: string;
    ratioError: number;
    cycleTimeDays: number;
    svgPath: string;
    octave: number;
}

interface Props {
    onClose: () => void;
    activeOctaves: number[];
}

export const FractalGeometryVault: React.FC<Props> = ({ onClose, activeOctaves }) => {
    const geometries = (geometriesData as ResonanceData[]).filter(g => activeOctaves.includes(g.octave));

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: COSMIC_THEME.background,
            color: COSMIC_THEME.text.main,
            fontFamily: 'monospace',
            padding: '20px',
            boxSizing: 'border-box',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: '0 0 5px 0', color: COSMIC_THEME.accent, fontWeight: 300 }}>Fractal Geometry Vault</h1>
                    <p style={{ margin: 0, color: COSMIC_THEME.text.muted, fontSize: '0.9rem' }}>
                        Static catalog of non-phyllotaxis harmonic orbital resonances.
                    </p>
                    {activeOctaves.length > 0 && (
                        <div style={{ marginTop: '5px', fontSize: '0.8rem', color: COSMIC_THEME.primary }}>
                            {geometries.length} Patterns Found across {activeOctaves.length} Octaves
                        </div>
                    )}
                </div>
                <button 
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: `1px solid ${COSMIC_THEME.border}`,
                        color: '#fff',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#fff'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = COSMIC_THEME.border}
                >
                    Return to Simulator
                </button>
            </div>



            {/* Geometry Grid OR Empty State */}
            {activeOctaves.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'column', gap: '15px', opacity: 0.6 }}>
                    <div style={{ fontSize: '3rem' }}>🌌</div>
                    <div style={{ fontSize: '1.2rem', color: COSMIC_THEME.accent }}>No Octaves Selected</div>
                    <div style={{ fontSize: '0.9rem', color: COSMIC_THEME.text.muted, maxWidth: '400px', textAlign: 'center' }}>
                        Select one or more cosmic octaves from the navigation above to view their geometric resonance patterns.
                    </div>
                </div>
            ) : geometries.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'column', gap: '15px', opacity: 0.6 }}>
                    <div style={{ fontSize: '3rem' }}>📡</div>
                    <div style={{ fontSize: '1.2rem', color: COSMIC_THEME.accent }}>Data Offline</div>
                    <div style={{ fontSize: '0.9rem', color: COSMIC_THEME.text.muted, maxWidth: '400px', textAlign: 'center' }}>
                        The remote drone has not yet mapped the geometric resonance pathways for the selected octaves. Please check back after the next deep-space sweep.
                    </div>
                </div>
            ) : (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
            }}>
                {geometries.map((geo, i) => (
                    <div key={i} style={{
                        background: COSMIC_THEME.surfaceRgba,
                        border: `1px solid ${COSMIC_THEME.border}`,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 4px 15px rgba(14, 165, 233, 0.2)`;
                        e.currentTarget.style.borderColor = COSMIC_THEME.primary;
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = COSMIC_THEME.border;
                    }}
                    >
                        {/* SVG Drawing Box (True Orientation) */}
                        <div style={{ 
                            width: '100%', 
                            aspectRatio: '1/1', 
                            background: '#0a0a0a', 
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            <svg viewBox="0 0 500 500" width="100%" height="100%">
                                <path 
                                    d={geo.svgPath} 
                                    fill="none" 
                                    stroke={COSMIC_THEME.accent} 
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {/* Center Origin */}
                                <circle cx="250" cy="250" r="3" fill="#fff" />
                            </svg>
                        </div>
                        
                        {/* Metadata Block */}
                        <div style={{ padding: '15px' }}>
                            <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
                                {geo.body1} ⟷ {geo.body2}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ color: COSMIC_THEME.primary, fontSize: '0.85rem' }}>
                                    Structure: {geo.ratioString}
                                </span>
                                <span style={{ color: geo.ratioError < 0.01 ? '#10b981' : '#eab308', fontSize: '0.75rem' }}>
                                    Err: {(geo.ratioError * 100).toFixed(2)}%
                                </span>
                            </div>
                            <div style={{ color: COSMIC_THEME.text.muted, fontSize: '0.8rem' }}>
                                Period: {geo.cycleTimeDays >= 365 
                                    ? `${(geo.cycleTimeDays / 365.25).toFixed(1)} orbital years` 
                                    : `${geo.cycleTimeDays} days`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
};
