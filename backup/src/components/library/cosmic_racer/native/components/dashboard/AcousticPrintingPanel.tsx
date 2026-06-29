'use client';

import React from 'react';
import { AcousticPrintingSimulator } from './AcousticPrintingSimulator';

export const AcousticPrintingPanel = () => {
    return (
        <div style={{ padding: '2rem', maxWidth: '100vw', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            
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
                    background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%'
                }}></div>
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '-5%', width: '300px', height: '300px', 
                    background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%'
                }}></div>

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <span style={{ background: '#8b5cf6', color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                            SYSTEM BLUEPRINT
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.1em' }}>
                            ACTIVE: ACOUSTIC ELEMENTAL PRINTING
                        </span>
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                        Volumetric <span style={{ color: '#8b5cf6' }}>Holographic</span> Assembly
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '800px', lineHeight: 1.6 }}>
                        A zero-thermal-stress manufacturing system utilizing multi-axis acoustic phased arrays to levitate elemental dust, instantly fused into solid-state alloys via Acoustic Cavitation Welding.
                    </p>
                </div>
            </div>

            {/* INTERACTIVE ENGINEERING BLUEPRINT */}
            <div style={{ marginBottom: '2rem' }}>
                <AcousticPrintingSimulator />
            </div>

            {/* GRID SPECS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                
                {/* GEOMETRY & MATH CARD */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                            📐
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Holographic Geometry</h2>
                    </div>
                    
                    <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        The print matrix is defined by manipulating 3D standing wave interference patterns. Transducers map CAD coordinates directly to high-pressure acoustic nodes (Gor'kov Traps).
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trap Resolution</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>λ / 2</div>
                            <div style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: 500, marginTop: '0.25rem' }}>Sub-millimeter precise</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trap Capacity</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>10<sup style={{fontSize: '1rem'}}>6</sup> <span style={{ fontSize: '1rem', color: '#94a3b8' }}>nodes</span></div>
                            <div style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: 500, marginTop: '0.25rem' }}>Simultaneous lock</div>
                        </div>
                    </div>

                    <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '12px', color: '#f8fafc' }}>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Gor'kov Potential Trap Force (Φ)</div>
                        <code style={{ fontSize: '1.1rem', color: '#8b5cf6', display: 'block', marginBottom: '0.5rem', overflow: 'hidden' }}>
                            U = 2πa³ρ_0(P²/ρ_0c²)(1/3f₁ - 1/2f₂)
                        </code>
                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Locks dense nanoparticles in fluid bath</div>
                    </div>
                </div>

                {/* PHYSICS & WELDING CARD */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                            ⚡
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Sonochemical Fusion</h2>
                    </div>

                    <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        Instead of thermal melting (which ruins crystal lattices and causes warping), this system uses localized <strong>Acoustic Cavitation Welding</strong> to achieve solid-state metallurgical bonding at room temperature.
                    </p>

                    <div style={{ background: '#f8fafc', borderLeft: '4px solid #10b981', padding: '1.5rem', borderRadius: '0 12px 12px 0', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Cavitation Collapse Pressure</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                            &gt; 1000 atm (100 MPa)
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#10b981' }}>Strips oxide layers instantly</div>
                    </div>

                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Solid-State Consolidation</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '0.75rem', lineHeight: 1.5 }}>
                            Transient cavitation bubbles implode near the levitating nanoparticles, creating micro-jets (&gt;100 m/s) that smash the atoms together. This forces diffusion across the metal boundaries, creating flawless, void-free multi-alloy meshes.
                        </div>
                    </div>
                </div>

            </div>

            {/* PERFORMANCE & DEPLOYMENT */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '3rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>Printing Performance Specs</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                    {/* Column 1 */}
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏱️</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Volumetric Speed</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Unlike layer-by-layer 3D printers, holographic trapping assembles massive geometries volumetrically. Millions of particles are positioned and fused simultaneously.
                        </p>
                    </div>

                    {/* Column 2 */}
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛡️</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Zero Thermal Stress</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Thermal 3D printing introduces residual stress, warping, and poor crystal structures. Sonochemical welding maintains the purest atomic lattice of the raw elemental dust.
                        </p>
                    </div>

                    {/* Column 3 */}
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔗</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Multi-Alloy Interfaces</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Titanium, Copper, and Gold can be printed into a single continuous gradient structure seamlessly, as solid-state bonding does not rely on matching melting points.
                        </p>
                    </div>
                </div>

            </div>

        </div>
    );
};
