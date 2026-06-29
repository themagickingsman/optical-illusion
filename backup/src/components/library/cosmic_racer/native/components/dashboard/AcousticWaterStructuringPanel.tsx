'use client';

import React from 'react';
import { AcousticWaterStructuringSimulator } from './AcousticWaterStructuringSimulator';

export const AcousticWaterStructuringPanel = () => {
    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            
            {/* HER0 / INTRO */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white',
                padding: '3rem',
                borderRadius: '24px',
                marginBottom: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', 
                    background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', borderRadius: '50%'
                }}></div>
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '-5%', width: '300px', height: '300px', 
                    background: 'radial-gradient(circle, rgba(234,179,8,0.15) 0%, transparent 70%)', borderRadius: '50%'
                }}></div>

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <span style={{ background: '#38bdf8', color: '#0f172a', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                            SYSTEM BLUEPRINT
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Hexagonal Lattice Coherence
                        </span>
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                        <span style={{ color: '#38bdf8' }}>ACOUSTIC</span> WATER STRUCTURING
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '800px', lineHeight: 1.6 }}>
                        A continuous-flow purification and structuring module utilizing 3D phase-shifted standing waves to align water molecules into highly stable, energized crystalline geometries.
                    </p>
                </div>
            </div>

            {/* INTERACTIVE ENGINEERING BLUEPRINT */}
            <div style={{ marginBottom: '2rem' }}>
                <AcousticWaterStructuringSimulator />
            </div>

            {/* GRID SPECS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                
                {/* GEOMETRY & MATH CARD */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                            📐
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Optimal Geometry</h2>
                    </div>
                    
                    <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        Dimensions are derived strictly from the Cosmic Compass framework (φ = 1.618), eschewing arbitrary engineering measurements for perfect acoustic resonance.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hull Diameter</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>1.6180 <span style={{ fontSize: '1rem', color: '#94a3b8' }}>m</span></div>
                            <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 500, marginTop: '0.25rem' }}>Exactly φ meters</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hull Length</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>2.6179 <span style={{ fontSize: '1rem', color: '#94a3b8' }}>m</span></div>
                            <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 500, marginTop: '0.25rem' }}>Exactly φ² meters</div>
                        </div>
                    </div>

                    <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '12px', color: '#f8fafc' }}>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Acoustic Impedance Match (Z)</div>
                        <code style={{ fontSize: '1.1rem', color: '#38bdf8', display: 'block', marginBottom: '0.5rem' }}>
                            Z = ρ · c ≈ 1025 kg/m³ · 1500 m/s
                        </code>
                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>= 1.54 MRayls (Seawater Transfer)</div>
                    </div>
                </div>

                {/* PHYSICS & FREQUENCY CARD */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                            🌊
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Resonance Physics</h2>
                    </div>

                    <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        Operating frequency (f_opt) is scaled deterministically from the universal 432 Hz base to achieve intermolecular alignment and bonding angle modification.
                    </p>

                    <div style={{ background: '#f8fafc', borderLeft: '4px solid #38bdf8', padding: '1.5rem', borderRadius: '0 12px 12px 0', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Primary Structuring Frequency</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                            432 Hz × φ<sup style={{fontSize: '0.8rem'}}>12</sup> = 138.8 kHz
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#2563eb' }}>Generated Wavelength (λ): 10.8mm (Optimal for cluster resonance)</div>
                    </div>

                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Acoustic Radiation Force (F_ARF)</span>
                            <span>Molecular Alignment</span>
                        </div>
                        <code style={{ fontSize: '0.95rem', color: '#14532d', display: 'block', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                            F_ARF = -(π·a³·P₀²·k / 4·ρ_f·c_f²) · Φ_G · sin(2kz)
                        </code>
                        <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '0.75rem', lineHeight: 1.5 }}>
                            The acoustic pressure fields force chaotic H2O molecule clusters into organized macro-structures, significantly altering viscosity, surface tension, and biological absorption rates.
                        </div>
                    </div>
                </div>

            </div>

            {/* PERFORMANCE & DEPLOYMENT */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '3rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>Deployment Specifications</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                    {/* Column 1: Throughput */}
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏱️</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Volumetric Throughput</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            In a standard gravity-fed system, the φ-hull's interior cross-section naturally processes exactly <strong>4,112 Litres of water per second</strong> (4.11 m³/sec) entirely continuously.
                        </p>
                    </div>

                    {/* Column 2: Power */}
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Power Efficiency</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Maintaining molecular alignment requires far less energy than extracting heavy suspended metals. The ultrasonic generators draw a highly efficient <strong>1.42 kW</strong> per tube.
                        </p>
                    </div>

                    {/* Column 3: Impact */}
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💧</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Biological Impact</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Restructured hexagonal water demonstrates increased cellar hydration efficiency, promoted enzymatic activity, and dramatically extended shelf-life by naturally inhibiting microbial growth.
                        </p>
                    </div>
                </div>

            </div>

        </div>
    );
};
