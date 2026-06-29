import React from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

export const MainframeSuitcase = () => {
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
                border: `2px solid ${DASHBOARD_THEME.colors.accents.violet.base}`,
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
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
                    SCHEMATIC: THE MAINFRAME MK1
                </div>

                <svg viewBox="0 0 500 500" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {/* Background Grid */}
                    <pattern id="gridMainframe" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke={DASHBOARD_THEME.colors.accents.violet.base} strokeWidth="0.5" opacity="0.1" />
                    </pattern>
                    <rect width="500" height="500" fill="url(#gridMainframe)" />

                    {/* Transit Case Outline (Top Down View) */}
                    <rect x="50" y="50" width="400" height="350" rx="20" fill={DASHBOARD_THEME.colors.background} stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="4" />
                    
                    {/* Telescopic Handle */}
                    <rect x="150" y="10" width="200" height="40" rx="10" fill="none" stroke={DASHBOARD_THEME.colors.text.secondary} strokeWidth="3" />
                    <line x1="180" y1="50" x2="180" y2="10" stroke={DASHBOARD_THEME.colors.text.secondary} strokeWidth="6" />
                    <line x1="320" y1="50" x2="320" y2="10" stroke={DASHBOARD_THEME.colors.text.secondary} strokeWidth="6" />

                    {/* Heavy Duty Wheels */}
                    <rect x="40" y="380" width="40" height="60" rx="8" fill={DASHBOARD_THEME.colors.text.primary} />
                    <rect x="420" y="380" width="40" height="60" rx="8" fill={DASHBOARD_THEME.colors.text.primary} />

                    {/* 50 Hex Cell Tessellation Array (Abstracted grid for visual clarity) */}
                    <g transform="translate(100, 100)">
                        {[0, 1, 2, 3, 4].map(row => (
                            <g key={`row-${row}`} transform={`translate(${row % 2 === 0 ? 0 : 25}, ${row * 45})`}>
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(col => {
                                    // Highlight a cell being hot-swapped
                                    const isHotSwap = row === 2 && col === 4;
                                    const isEmpty = row === 3 && col === 7;
                                    
                                    return (
                                        <g key={`cell-${row}-${col}`} transform={`translate(${col * 50}, 0)`}>
                                            {isEmpty ? (
                                                <polygon points="0,-25 21.6,-12.5 21.6,12.5 0,25 -21.6,12.5 -21.6,-12.5" fill={DASHBOARD_THEME.colors.glass.medium} stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="1" strokeDasharray="2 2" />
                                            ) : (
                                                <polygon 
                                                    points="0,-25 21.6,-12.5 21.6,12.5 0,25 -21.6,12.5 -21.6,-12.5" 
                                                    fill={isHotSwap ? DASHBOARD_THEME.colors.accents.cyan.base : DASHBOARD_THEME.colors.accents.violet.base} 
                                                    fillOpacity={isHotSwap ? 0.3 : 0.1}
                                                    stroke={isHotSwap ? DASHBOARD_THEME.colors.accents.cyan.base : DASHBOARD_THEME.colors.text.primary} 
                                                    strokeWidth={isHotSwap ? "3" : "1"} 
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        ))}
                    </g>

                    {/* Airline Callout Labels */}
                    <g transform="translate(0, 0)">
                        <line x1="280" y1="300" x2="350" y2="400" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" />
                        <circle cx="280" cy="300" r="4" fill={DASHBOARD_THEME.colors.accents.cyan.base} />
                        <text x="355" y="395" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold">EMPTY PORT</text>
                        <text x="355" y="410" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10">HOT-SWAP INFRASTRUCTURE</text>

                        <line x1="300" y1="190" x2="430" y2="150" stroke={DASHBOARD_THEME.colors.accents.violet.base} strokeWidth="2" />
                        <circle cx="300" cy="190" r="4" fill={DASHBOARD_THEME.colors.accents.violet.base} />
                        <text x="435" y="145" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold">10-CELL MATRIX</text>
                        <text x="435" y="160" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10">45 kWh SYSTEM CAPACITY</text>

                        <line x1="120" y1="360" x2="100" y2="430" stroke={DASHBOARD_THEME.colors.accents.amber.base} strokeWidth="2" />
                        <circle cx="120" cy="360" r="4" fill={DASHBOARD_THEME.colors.accents.amber.base} />
                        <text x="210" y="375" fill={DASHBOARD_THEME.colors.text.primary} fontSize="14" fontWeight="bold" textAnchor="middle">45 kWh</text>
                        <text x="95" y="425" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold" textAnchor="end">60L TRANSIT VOLUME</text>
                        <text x="95" y="440" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10" textAnchor="end">WATER-TIGHT SHOCK ABSORBENT</text>
                    </g>
                </svg>
            </div>

            {/* Technical Specifications Column */}
            <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', color: DASHBOARD_THEME.colors.text.primary, lineHeight: 1.1 }}>
                    The 45 kWh<br/>Mainframe Suitcase
                </h2>
                <p style={{ fontSize: '1.1rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.7, marginBottom: '2rem' }}>
                    Taking cues from military logistics and data-center architecture, The Mainframe is a heavy-duty, portable micro-grid hub. By optimizing for maximum volumetric density, it packs 45 kWh of energy into a rolling transit case—meaning just two of these cases can power an entire off-grid home.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.violet.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            CAPACITY YIELD
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            10-Cell Matrix
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            A high-impact polymer transit case houses exactly 10 solid-state Hex-Cells, delivering 45 kWh of total usable capacity within a highly mobile 60-Liter internal volume (standard luggage size).
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.cyan.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            STRUCTURAL LOGISTICS
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            Mobile Transit Case
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            Housed in a water-tight, shock-absorbent composite shell with heavy-duty recessed wheels and a telescopic handle for austere terrain deployment.
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.amber.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            MAINTENANCE INFRASTRUCTURE
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            Live Hot-Swapping
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            Individual 4.5 kWh Hex-Cells can be safely ejected and replaced by field operators while the micro-grid mainframe remains under active load.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
