"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DASHBOARD_THEME } from '../DashboardTheme';
import { ChladniResonator } from './ChladniResonator';
import { FrequencyControlPanel, FREQUENCY_PRESETS } from './FrequencyControlPanel';
import { getChladniModes } from './chladniMath';

export const CymaticsSystemContainer = () => {
    const [activePresetId, setActivePresetId] = useState<string>(FREQUENCY_PRESETS[0].id);
    const [amplitude, setAmplitude] = useState<number>(0.5);
    const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
    
    // Audio Context Refs
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    const activePreset = useMemo(() => {
        return FREQUENCY_PRESETS.find(p => p.id === activePresetId) || FREQUENCY_PRESETS[0];
    }, [activePresetId]);

    const { n, m } = useMemo(() => getChladniModes(activePreset.freq), [activePreset.freq]);

    // Handle Audio Context Initialization and Cleanup
    useEffect(() => {
        return () => {
            if (oscillatorRef.current) {
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
        };
    }, []);

    // Handle Frequency Changes or Play/Stop Toggles
    useEffect(() => {
        if (!isPlayingAudio) {
             if (gainNodeRef.current && audioCtxRef.current) {
                 // Smooth fade out
                 gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
                 setTimeout(() => {
                     if (oscillatorRef.current && !isPlayingAudio) {
                         oscillatorRef.current.stop();
                         oscillatorRef.current.disconnect();
                         oscillatorRef.current = null;
                     }
                 }, 200);
             }
             return;
        }

        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
             audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        if (!gainNodeRef.current) {
            gainNodeRef.current = audioCtxRef.current.createGain();
            gainNodeRef.current.connect(audioCtxRef.current.destination);
            gainNodeRef.current.gain.value = 0; // start muted
        }

        if (!oscillatorRef.current) {
             oscillatorRef.current = audioCtxRef.current.createOscillator();
             oscillatorRef.current.type = 'sine'; // Pure tone
             oscillatorRef.current.connect(gainNodeRef.current);
             oscillatorRef.current.start();
        }

        // Smoothly transition frequency and amplitude
        oscillatorRef.current.frequency.setTargetAtTime(activePreset.freq, audioCtxRef.current.currentTime, 0.1);
        
        // Scale visual amplitude (0.1 to 2.0) to audio volume (0 to 0.3 to avoid blowing out speakers)
        const targetVolume = (amplitude / 2.0) * 0.3;
        gainNodeRef.current.gain.setTargetAtTime(targetVolume, audioCtxRef.current.currentTime, 0.1);

    }, [activePreset.freq, isPlayingAudio, amplitude]);

    // Cleanup when unmounting or changing specific deps might be needed, but handled safely above

    const toggleAudio = () => {
        setIsPlayingAudio(prev => !prev);
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
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: DASHBOARD_THEME.colors.accents.cyan.base, background: DASHBOARD_THEME.colors.accents.cyan.bg, padding: '0.25rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                            ACOUSTIC SCIENCE
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                            VAL: PHYSICAL RESONANCE
                        </span>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1, marginBottom: '1rem' }}>
                        Frequency Patterns Engine
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: '#64748b' }}>
                        Real-time nodal visualization of acoustic frequencies on a 2D plane (Chladni Plate Simulation). 
                        Observe how specific mathematical harmonics dictate geometric form in physical space.
                    </p>
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }}>
                
                {/* Visualizer (Left) */}
                <div style={{ width: '100%', aspectRatio: '1/1' }}>
                    <ChladniResonator 
                        n={n} 
                        m={m} 
                        frequency={activePreset.freq} 
                        amplitude={amplitude} 
                    />
                </div>

                {/* Controls & Data (Right) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <FrequencyControlPanel 
                        activePresetId={activePresetId}
                        onSelectPreset={setActivePresetId}
                        amplitude={amplitude}
                        onAmplitudeChange={setAmplitude}
                    />

                    {/* Acoustic Data Readout */}
                    <div style={{ 
                        background: '#fff', 
                        borderRadius: '16px', 
                        padding: '2rem', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
                            Therapeutic & Structural Output
                        </h3>
                        
                        <div style={{ 
                            padding: '1.5rem', 
                            background: `${activePreset.color}10`, 
                            borderLeft: `3px solid ${activePreset.color}`, 
                            borderRadius: '0 8px 8px 0',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                                {activePreset.name} Effect
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
                                {activePreset.desc}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Nodal Constant (N)</span>
                                <span style={{ fontSize: '0.9rem', color: '#1e293b', fontFamily: 'monospace' }}>{n.toFixed(4)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Nodal Constant (M)</span>
                                <span style={{ fontSize: '0.9rem', color: '#1e293b', fontFamily: 'monospace' }}>{m.toFixed(4)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', marginBottom: '1.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Formula Focus</span>
                                <span style={{ fontSize: '0.85rem', color: activePreset.color, fontWeight: 700 }}>
                                    cos({n.toFixed(2)}πx) · cos({m.toFixed(2)}πy)
                                </span>
                            </div>

                            {/* AUDIO CONTROLS */}
                            <button 
                                onClick={toggleAudio}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    background: isPlayingAudio ? '#ef4444' : DASHBOARD_THEME.colors.accents.cyan.base,
                                    color: '#fff',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                }}
                            >
                                {isPlayingAudio ? (
                                    <>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} />
                                        Mute Frequency Engine
                                    </>
                                ) : (
                                    <>
                                        ▶ Play Pure Sine Tone
                                    </>
                                )}
                            </button>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.5rem' }}>
                                WARNING: Plays continuous pure tone mapping to selected Hz. Volume scales with amplitude.
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
