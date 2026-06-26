"use client";

import React, { useState } from 'react';
import { CalibrationVisualizer } from './CalibrationVisualizer';
import { CalibrationControlDesk } from './CalibrationControlDesk';

export const CalibrationSimulatorContainer = () => {
    // The user requested explicit frequencies for testing geometric rendering
    const [activeFrequencies, setActiveFrequencies] = useState<number[]>([2041]); 
    const [waveAmplitude, setWaveAmplitude] = useState<number>(1);
    const [physicalMedium, setPhysicalMedium] = useState<'AIR' | 'WATER' | 'METAL'>('WATER');

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
                            CALIBRATION SYSTEM
                        </span>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1, marginBottom: '1rem' }}>
                        Calibration Simulator Engine
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: '#64748b' }}>
                        A precision diagnostic tool to isolate and visualize exact acoustic frequencies on a 2D plane. 
                        Use this to validate the geometric complexity and physical rendering of custom waveforms independent of the standard elemental periodic lattice.
                    </p>
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }}>
                
                {/* Visualizer (Left) */}
                <div style={{ width: '100%', aspectRatio: '1/1' }}>
                    <CalibrationVisualizer 
                        activeFrequencies={activeFrequencies}
                        waveAmplitude={waveAmplitude}
                        physicalMedium={physicalMedium}
                    />
                </div>

                {/* Controls & Data (Right) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <CalibrationControlDesk 
                        activeFrequencies={activeFrequencies}
                        setActiveFrequencies={setActiveFrequencies}
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
                            Signal Diagnostics
                        </h3>
                        
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Frequency</span>
                                <span style={{ fontSize: '0.9rem', color: '#1e293b', fontFamily: 'monospace', fontWeight: 700 }}>
                                    {activeFrequencies.length > 0 ? `${activeFrequencies[0]} Hz` : 'NONE'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Wave Geometry</span>
                                <span style={{ fontSize: '0.9rem', color: '#3b82f6', fontFamily: 'monospace', fontWeight: 700 }}>DYNAMICS_CHLADNI</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Test Range</span>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                                    50 Hz - 4000 Hz
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
