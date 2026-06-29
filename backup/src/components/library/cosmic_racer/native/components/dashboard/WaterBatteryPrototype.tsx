'use client';

import React from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';
import dynamic from 'next/dynamic';

const BatteryPrototype3DModel = dynamic(() => import('./BatteryPrototype3DModel'), { ssr: false });

export const WaterBatteryPrototype = () => {
    return (
        <div style={{
            background: DASHBOARD_THEME.colors.background,
            borderRadius: '24px',
            border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
            padding: '3rem',
            color: DASHBOARD_THEME.colors.text.secondary,
            lineHeight: 1.8,
            fontSize: '1.05rem',
            maxWidth: '1200px',
            margin: '0 auto',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
            <h1 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '2rem', marginBottom: '1rem', fontWeight: 800 }}>
                Applying Cosmic Geometry to Metal
            </h1>
            <p style={{ fontSize: '1.1rem', color: DASHBOARD_THEME.colors.text.muted, marginBottom: '2.5rem', borderBottom: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, paddingBottom: '1.5rem' }}>
                How to bend copper and layer lithium using resonant physical architecture.
            </p>

            <div style={{ marginBottom: '3rem' }}>
                <BatteryPrototype3DModel />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* ETCHING CARD */}
                <div style={{ background: 'rgba(15,23,42,0.5)', padding: '2rem', borderRadius: '16px', border: `1px solid ${DASHBOARD_THEME.colors.glass.border}` }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📐</div>
                    <h3 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 700 }}>1. PCB Etching the Fractal</h3>
                    <p style={{ fontSize: '0.95rem' }}>
                        To bend copper into the perfect fractal, you don't fold it by hand. You use standard Printed Circuit Board (PCB) chemical etching or a desktop CNC laser.
                    </p>
                    <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
                        You take a flat sheet of pure copper foil, paint the recursive Lichtenberg or Fibonacci branching pattern onto it, and dissolve the negative space. What remains is a perfectly geometric, frictionless current collector.
                    </p>
                </div>

                {/* VIBRATION CARD */}
                <div style={{ background: 'rgba(15,23,42,0.5)', padding: '2rem', borderRadius: '16px', border: `1px solid ${DASHBOARD_THEME.colors.glass.border}` }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔊</div>
                    <h3 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 700 }}>2. Cymatic Curing</h3>
                    <p style={{ fontSize: '0.95rem' }}>
                        As you apply the thick, liquid Lithium Iron Phosphate (LiFePO4) paste over the etched copper, place the entire assembly on a metal speaker plate.
                    </p>
                    <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
                        Play a constant 432 Hz tone matching the geometric frequency. The wet chemicals will vibrate and self-organize into a perfect crystalline lattice as the solvent evaporates, permanently locking the atoms into highly efficient "roadways."
                    </p>
                </div>

                {/* FOLDING CARD */}
                <div style={{ background: 'rgba(15,23,42,0.5)', padding: '2rem', borderRadius: '16px', border: `1px solid ${DASHBOARD_THEME.colors.glass.border}` }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛠️</div>
                    <h3 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 700 }}>3. Miura-Ori Compression</h3>
                    <p style={{ fontSize: '0.95rem' }}>
                        Current batteries roll their layers tightly, causing immense heat buildup and cracking.
                    </p>
                    <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
                        Take the dry, cymatically aligned fractal plate, layer the plastic separator and the cathode, and use the <strong>Miura-ori origami fold</strong>. This rigid, interlocking geometric fold compresses the surface area down to a 30% smaller footprint without stressing the layered materials.
                    </p>
                </div>
            </div>
            
        </div>
    );
};
