import React from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

export const BatterySolarIntegration = () => {
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
                border: `2px solid ${DASHBOARD_THEME.colors.accents.emerald.base}`,
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
                    SCHEMATIC: FRACTAL MICRO-GRID MAPPING
                </div>
                
                <svg viewBox="0 0 400 500" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {/* Background Grid */}
                    <pattern id="gridSolar" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke={DASHBOARD_THEME.colors.accents.emerald.base} strokeWidth="0.5" opacity="0.1" />
                    </pattern>
                    <rect width="400" height="500" fill="url(#gridSolar)" />

                    {/* Fractal Trapping Surface (Abstracted) */}
                    <g transform="translate(200, 150)">
                        {/* Sun Rays entering */}
                        <path d="M -150 -100 L -50 -50 M -120 -120 L -30 -60 M -80 -140 L -10 -70" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
                        <path d="M 150 -100 L 50 -50 M 120 -120 L 30 -60 M 80 -140 L 10 -70" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
                        
                        {/* Metamaterial Surface Topography */}
                        <polygon points="-100,0 0,-30 100,0 0,30" fill={DASHBOARD_THEME.colors.accents.emerald.base} opacity="0.1" stroke={DASHBOARD_THEME.colors.accents.emerald.base} strokeWidth="2" />
                        <polygon points="-80,0 0,-20 80,0 0,20" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="1" />
                        <polygon points="-60,0 0,-10 60,0 0,10" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="1" />
                        
                        {/* Trapped photons bouncing inside */}
                        <path d="M -50 10 L 0 25 L 50 10" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                        <circle cx="0" cy="25" r="3" fill="#f59e0b" />
                    </g>

                    {/* Funneling to the Mainframe */}
                    <path d="M 200 200 L 200 350" stroke={DASHBOARD_THEME.colors.accents.emerald.base} strokeWidth="6" strokeDasharray="10 5" />
                    <polygon points="190,340 210,340 200,360" fill={DASHBOARD_THEME.colors.accents.emerald.base} />

                    {/* Small Mainframe Box */}
                    <rect x="150" y="360" width="100" height="80" rx="10" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" />
                    <rect x="160" y="370" width="80" height="60" fill={DASHBOARD_THEME.colors.accents.violet.base} opacity="0.2" />
                    <text x="200" y="405" fill={DASHBOARD_THEME.colors.text.primary} fontSize="14" fontWeight="bold" textAnchor="middle">45 kWh</text>

                    {/* Airline Callout Labels */}
                    <g transform="translate(0, 0)">
                        <line x1="280" y1="130" x2="330" y2="80" stroke={DASHBOARD_THEME.colors.accents.emerald.base} strokeWidth="2" />
                        <circle cx="280" cy="130" r="4" fill={DASHBOARD_THEME.colors.accents.emerald.base} />
                        <text x="335" y="75" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold">FRACTAL METAMATERIAL</text>
                        <text x="335" y="90" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10">OMNI-DIRECTIONAL TRAP</text>

                        <line x1="80" y1="130" x2="60" y2="100" stroke={DASHBOARD_THEME.colors.accents.emerald.base} strokeWidth="2" />
                        <circle cx="80" cy="130" r="4" fill={DASHBOARD_THEME.colors.accents.emerald.base} />
                        <text x="55" y="95" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold" textAnchor="end">55% YIELD EFFICIENCY</text>
                        <text x="55" y="110" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10" textAnchor="end">550 W/m² PEAK OUTPUT</text>

                        <line x1="200" y1="280" x2="310" y2="280" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" />
                        <circle cx="200" cy="280" r="4" fill={DASHBOARD_THEME.colors.accents.cyan.base} />
                        <text x="315" y="275" fill={DASHBOARD_THEME.colors.accents.cyan.base} fontSize="12" fontWeight="bold">UMBILICAL SHIELDING</text>
                        <text x="315" y="290" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10">3.0 kWh/m² DAILY TRANSFER</text>

                        <line x1="150" y1="400" x2="80" y2="430" stroke={DASHBOARD_THEME.colors.accents.violet.base} strokeWidth="2" />
                        <circle cx="150" cy="400" r="4" fill={DASHBOARD_THEME.colors.accents.violet.base} />
                        <text x="75" y="425" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold" textAnchor="end">MAINFRAME TRANSIT</text>
                        <text x="75" y="440" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10" textAnchor="end">10-CELL ARCHITECTURE</text>
                    </g>
                </svg>
            </div>

            {/* Technical Specifications Column */}
            <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', color: DASHBOARD_THEME.colors.text.primary, lineHeight: 1.1 }}>
                    Fractal Array<br/>Power Amplification
                </h2>
                <p style={{ fontSize: '1.1rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.7, marginBottom: '2rem' }}>
                    Standard solar yields (250 W/m²) restrict off-grid viability by demanding massive surface areas. By deploying a Sub-Wavelength Fractal Metamaterial over the Perovskite Quantum Dot layer, we create an omni-directional optical trap that shrinks the required charging footprint down to just 15 square meters.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.emerald.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            THE PHYSICS OVERRIDE
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            55% Conversion Yield
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            Raw solar irradiance at sea level taps out at 1,000 W/m². The etched fractal geometry forces photons to scatter deeper into the luminescent material, breaking standard 20% efficiency limits to generate an unprecedented 550 Watts/m² of peak DC power.
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.cyan.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            OMNI-DIRECTIONAL ABSORPTION
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            Static Actuation
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            The sub-wavelength fractal acts as a light trap regardless of solar incidence angle. This mitigates early-morning and late-afternoon atmospheric attenuation, guaranteeing ~5.5 peak sun hour equivalents without mechanical tracking.
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.violet.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            THE FOOTPRINT METRIC
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            15 Square Meters
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            Governed by the immovable laws of terrestrial thermodynamics, charging a 45 kWh Mainframe battery in a single day at 55% efficiency requires exactly 15 square meters of array footprint. 
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
