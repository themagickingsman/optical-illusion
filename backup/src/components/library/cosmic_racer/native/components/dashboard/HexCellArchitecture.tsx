import React from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

export const HexCellArchitecture = () => {
    return (
        <div style={{
            background: DASHBOARD_THEME.colors.background,
            borderRadius: '24px',
            border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
            padding: '3rem',
            overflow: 'hidden',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
            display: 'grid',
            gridTemplateColumns: 'minmax(400px, 1fr) minmax(350px, 1fr)',
            gap: '4rem',
            alignItems: 'center'
        }}>
            {/* Visual Schematic Column */}
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '2rem',
                border: `2px solid ${DASHBOARD_THEME.colors.accents.cyan.base}`,
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    color: DASHBOARD_THEME.colors.text.muted,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em'
                }}>
                    SCHEMATIC: HEX-CELL MK1
                </div>
                
                <svg viewBox="0 0 400 500" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {/* Background Grid */}
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="0.5" opacity="0.1" />
                    </pattern>
                    <rect width="400" height="500" fill="url(#grid)" />

                    {/* Outer Hexagon Shell (Top View Isometric Projection Simulation) */}
                    <g transform="translate(200, 250) scale(1.5)">
                        <polygon points="0,-100 86.6,-50 86.6,50 0,100 -86.6,50 -86.6,-50" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" strokeLinejoin="round" />
                        <polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill={DASHBOARD_THEME.colors.accents.cyan.base} opacity="0.05" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="1" />
                        
                        {/* Internal Core Rings */}
                        <circle cx="0" cy="0" r="40" fill="none" stroke={DASHBOARD_THEME.colors.accents.violet.base} strokeWidth="2" strokeDasharray="4 4" />
                        <circle cx="0" cy="0" r="20" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="1" />
                        
                        {/* Thermal Conduction Fins */}
                        {[0, 60, 120, 180, 240, 300].map(angle => (
                            <line key={angle} x1="0" y1="-40" x2="0" y2="-90" stroke={DASHBOARD_THEME.colors.text.secondary} strokeWidth="1" transform={`rotate(${angle})`} />
                        ))}
                    </g>

                    {/* Airline Callout Labels */}
                    <g transform="translate(0, 0)">
                        <line x1="170" y1="130" x2="100" y2="80" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" />
                        <circle cx="170" cy="130" r="4" fill={DASHBOARD_THEME.colors.accents.cyan.base} />
                        <text x="95" y="75" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold" textAnchor="end">THERMAL EXOSKELETON</text>
                        <text x="95" y="90" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10" textAnchor="end">AIRCRAFT-GRADE TITANIUM</text>

                        <line x1="230" y1="130" x2="300" y2="80" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" />
                        <circle cx="230" cy="130" r="4" fill={DASHBOARD_THEME.colors.accents.cyan.base} />
                        <text x="305" y="75" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold">SOLID-STATE LITHIUM</text>
                        <text x="305" y="90" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10">1000 Wh/L DENSITY</text>

                        <line x1="200" y1="210" x2="330" y2="210" stroke={DASHBOARD_THEME.colors.accents.violet.base} strokeWidth="2" />
                        <circle cx="200" cy="210" r="4" fill={DASHBOARD_THEME.colors.accents.violet.base} />
                        <text x="335" y="205" fill={DASHBOARD_THEME.colors.accents.violet.base} fontSize="12" fontWeight="bold">ACTIVE COOLING CORE</text>
                        <text x="335" y="220" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10">FORCED AIR DELINEATION</text>

                        <line x1="100" y1="300" x2="50" y2="340" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" />
                        <circle cx="100" cy="300" r="4" fill={DASHBOARD_THEME.colors.accents.cyan.base} />
                        <text x="45" y="335" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold" textAnchor="end">HEXAGONAL PROJECTION</text>
                        <text x="45" y="350" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10" textAnchor="end">ZERO INTERSTITIAL WASTE</text>
                    </g>
                </svg>
            </div>

            {/* Technical Specifications Column */}
            <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', color: DASHBOARD_THEME.colors.text.primary, lineHeight: 1.1 }}>
                    Solid-State<br/>Hex-Cell Architecture
                </h2>
                <p style={{ fontSize: '1.1rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.7, marginBottom: '2rem' }}>
                    Moving past the limitations of cylindrical arrays (which suffer from wasted "interstitial" air gaps when packed), the ARN system utilizes a perfectly tessellating Hexagonal Column architecture. 
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.cyan.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            DIMENSIONALITY
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            4.5 Liters
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            Exactly half the volume of a standard automotive lead-acid battery, allowing for single-handed hot-swapping by field operators.
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.violet.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            ENERGY DENSITY
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            4.5 kWh / Cell
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            Utilizing next-generation solid-state lithium-metal chemistry to achieve ~1000 Wh/L, drastically outperforming standard lithium-ion capacities.
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.amber.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            THERMAL MANAGEMENT
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            Axial Core Cooling
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            A central aperture allows high-velocity cooled air to run directly down the spine of the cell, preventing thermal runaway during rapid discharging.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
