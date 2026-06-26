import React from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

export const RapidDeployFramework = () => {
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
                    SCHEMATIC: MIURA-FOLD DEPLOYMENT
                </div>

                <svg viewBox="0 0 500 500" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {/* Background Grid */}
                    <pattern id="gridDeploy" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="0.5" opacity="0.1" />
                    </pattern>
                    <rect width="500" height="500" fill="url(#gridDeploy)" />

                    {/* Step 1: The Transit Case */}
                    <g transform="translate(80, 100)">
                        <rect x="0" y="0" width="80" height="60" rx="4" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="2" />
                        <rect x="10" y="60" width="10" height="10" fill={DASHBOARD_THEME.colors.text.primary} />
                        <rect x="60" y="60" width="10" height="10" fill={DASHBOARD_THEME.colors.text.primary} />
                        <text x="40" y="-10" fill={DASHBOARD_THEME.colors.accents.amber.base} fontSize="12" fontWeight="bold" textAnchor="middle">1. TRANSIT</text>
                        <path d="M 100 30 L 140 30 L 130 20 M 140 30 L 130 40" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="2" fill="none" />
                    </g>

                    {/* Step 2: Extraction & Unfolding */}
                    <g transform="translate(250, 100)">
                        {/* Miura shape extracted */}
                        <polygon points="0,0 30,15 30,55 0,40" fill={DASHBOARD_THEME.colors.accents.cyan.base} opacity="0.2" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="1" />
                        <polygon points="30,15 60,0 60,40 30,55" fill={DASHBOARD_THEME.colors.accents.cyan.base} opacity="0.4" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="1" />
                        <polygon points="0,40 30,55 30,95 0,80" fill={DASHBOARD_THEME.colors.accents.cyan.base} opacity="0.4" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="1" />
                        <polygon points="30,55 60,40 60,80 30,95" fill={DASHBOARD_THEME.colors.accents.cyan.base} opacity="0.2" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="1" />
                        
                        <text x="30" y="-10" fill={DASHBOARD_THEME.colors.accents.violet.base} fontSize="12" fontWeight="bold" textAnchor="middle">2. EXTRACTION</text>
                        <path d="M 75 40 L 115 40 L 105 30 M 115 40 L 105 50" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="2" fill="none" />
                    </g>

                    {/* Step 3: Rigid Full Deployment (15 sqm Array) */}
                    <g transform="translate(100, 300)">
                        {/* Wide deployed array */}
                        <polygon points="0,20 100,-20 300,20 200,60" fill={DASHBOARD_THEME.colors.accents.emerald.base} opacity="0.2" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="2" />
                        
                        {/* Miura tessellation lines (abstracted) */}
                        <line x1="50" y1="0" x2="250" y2="40" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="150" y1="-10" x2="50" y2="40" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="250" y1="10" x2="150" y2="50" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="1" strokeDasharray="4 4" />
                        
                        {/* Titanium Exoskeleton Legs */}
                        <line x1="0" y1="20" x2="-20" y2="100" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" />
                        <line x1="300" y1="20" x2="320" y2="100" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" />
                        <line x1="200" y1="60" x2="200" y2="140" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" />
                        <line x1="100" y1="-20" x2="100" y2="40" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" opacity="0.3" /> {/* Back leg */}
                        
                        {/* Cable to Mainframe */}
                        <path d="M 200 140 Q 250 160 350 140" fill="none" stroke={DASHBOARD_THEME.colors.accents.violet.base} strokeWidth="4" />
                        <rect x="350" y="120" width="40" height="30" rx="2" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="2" />

                        <text x="150" y="-40" fill={DASHBOARD_THEME.colors.accents.emerald.base} fontSize="12" fontWeight="bold" textAnchor="middle">3. TENSION LOCK (15 MIN)</text>
                    </g>
                </svg>
            </div>

            {/* Technical Specifications Column */}
            <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', color: DASHBOARD_THEME.colors.text.primary, lineHeight: 1.1 }}>
                    Rapid-Deploy<br/>Origami Framework
                </h2>
                <p style={{ fontSize: '1.1rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.7, marginBottom: '2rem' }}>
                    Austere, off-grid terrains lack the structural integration of BIPV architectures. Borrowing heavily from NASA satellite deployment mechanics, the 15-square-meter charging array utilizes a rigid fold tessellation.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.cyan.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            AEROSPACE GEOMETRY
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            The Miura-Fold
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            A mathematically perfect origami tessellation allows the entire rigid exoskeleton to collapse along pre-stressed flex lines without placing any mechanical torsion on the carbon-fiber joints.
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.amber.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            LOGISTICS & TRANSPORT
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            Single-Case Extraction
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            The entire 15 sqm (1.5 parking spaces) solar array collapses down into an ultra-dense transit case that perfectly mirrors the small form-factor of the Mainframe Suitcase.
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.emerald.base}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.muted, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            OFF-GRID DEPLOYMENT
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            15-Minute Standing Array
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            Pulled outward by two field engineers, the Miura geometry forces the array to snap into its rigid state geometry instantly. Aircraft-grade titanium legs spike directly into austere terrain.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
