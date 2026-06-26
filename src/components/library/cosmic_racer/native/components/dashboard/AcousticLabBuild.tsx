import React from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

export default function AcousticLabBuild() {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 400px) 1fr',
            gap: '3rem',
            alignItems: 'start'
        }}>
            {/* Visual Schematic Column */}
            <div style={{
                position: 'relative',
                background: DASHBOARD_THEME.colors.glass.medium,
                border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                borderRadius: '12px',
                padding: '2rem',
                minHeight: '600px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {/* SVG Blueprint */}
                <svg width="100%" height="100%" viewBox="0 0 500 600" style={{ overflow: 'visible' }}>
                    <defs>
                        <pattern id="acoustic-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <rect width="20" height="20" fill="none" />
                            <circle cx="2" cy="2" r="1" fill={DASHBOARD_THEME.colors.text.muted} opacity="0.3" />
                        </pattern>
                        <linearGradient id="glovebox-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={DASHBOARD_THEME.colors.accents.cyan.base} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={DASHBOARD_THEME.colors.background} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#acoustic-grid)" />

                    {/* The Glovebox Ecosystem ($15k) */}
                    <g transform="translate(100, 100)">
                        <rect x="0" y="0" width="300" height="400" rx="8" fill="url(#glovebox-glow)" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" opacity="0.8" />
                        <rect x="10" y="10" width="280" height="380" rx="4" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="1" strokeDasharray="4 4" />
                        
                        {/* Glove Ports */}
                        <circle cx="80" cy="200" r="30" fill="none" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" />
                        <circle cx="80" cy="200" r="25" fill={DASHBOARD_THEME.colors.background} opacity="0.5" />
                        
                        <circle cx="220" cy="200" r="30" fill="none" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" />
                        <circle cx="220" cy="200" r="25" fill={DASHBOARD_THEME.colors.background} opacity="0.5" />
                        
                        {/* Argon Input Line */}
                        <path d="M 300 50 L 350 50 L 350 -20" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" fill="none" />
                        <circle cx="350" cy="-20" r="4" fill={DASHBOARD_THEME.colors.accents.cyan.base} />
                        <text x="360" y="-15" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold">ARGON 0% RH</text>

                        {/* Glovebox Label */}
                        <rect x="0" y="-20" width="120" height="20" fill={DASHBOARD_THEME.colors.accents.cyan.base} opacity="0.2" />
                        <text x="10" y="-5" fill={DASHBOARD_THEME.colors.accents.cyan.base} fontSize="12" fontWeight="bold">ISOLATION CHAMBER</text>
                    </g>

                    {/* The Acoustic Printer ($17k) */}
                    <g transform="translate(150, 260)">
                        {/* 3D Printer Chassis */}
                        <rect x="0" y="0" width="100" height="150" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" />
                        <rect x="10" y="10" width="80" height="40" fill={DASHBOARD_THEME.colors.accents.violet.base} opacity="0.2" />
                        {/* Z-Axis Arm */}
                        <rect x="45" y="10" width="10" height="100" fill={DASHBOARD_THEME.colors.text.secondary} />
                        {/* Build Plate */}
                        <rect x="20" y="110" width="60" height="5" fill={DASHBOARD_THEME.colors.accents.violet.base} />
                        
                        {/* Ultrasonic Transducers */}
                        <circle cx="20" cy="140" r="8" fill="none" stroke={DASHBOARD_THEME.colors.accents.amber.base} strokeWidth="2" />
                        <circle cx="80" cy="140" r="8" fill="none" stroke={DASHBOARD_THEME.colors.accents.amber.base} strokeWidth="2" />
                        
                        {/* Wave Interference Animation Lines */}
                        <path d="M 20 130 C 40 100, 60 100, 80 130" stroke={DASHBOARD_THEME.colors.accents.amber.base} strokeWidth="1" fill="none" strokeDasharray="2 2" />
                        <path d="M 20 135 C 40 110, 60 110, 80 135" stroke={DASHBOARD_THEME.colors.accents.amber.base} strokeWidth="1" fill="none" strokeDasharray="2 2" />
                        
                        {/* Label */}
                        <line x1="-30" y1="75" x2="-80" y2="75" stroke={DASHBOARD_THEME.colors.accents.violet.base} strokeWidth="2" />
                        <text x="-90" y="70" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold" textAnchor="end">MODIFIED PRINTER</text>
                        <text x="-90" y="85" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10" textAnchor="end">$17,000 CAPEX</text>
                    </g>

                    {/* Vacuum Centrifugal Mixer ($13k) */}
                    <g transform="translate(30, 130)">
                        {/* Centrifuge Cylinder */}
                        <ellipse cx="40" cy="50" rx="30" ry="10" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="2" />
                        <path d="M 10 50 L 10 100 A 30 10 0 0 0 70 100 L 70 50" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="2" />
                        <ellipse cx="40" cy="100" rx="30" ry="10" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
                        
                        {/* Internal Sonic Probe */}
                        <rect x="35" y="10" width="10" height="60" fill={DASHBOARD_THEME.colors.accents.amber.base} opacity="0.8" />
                        
                        {/* Callout */}
                        <line x1="10" y1="20" x2="-40" y2="-20" stroke={DASHBOARD_THEME.colors.accents.emerald.base} strokeWidth="2" />
                        <text x="-45" y="-25" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold" textAnchor="end">VACUUM MIXER</text>
                        <text x="-45" y="-10" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10" textAnchor="end">$13,000 CAPEX</text>
                    </g>

                    {/* Digital Metrology ($5k) */}
                    <g transform="translate(350, 400)">
                        {/* Microscope / Testing Station */}
                        <rect x="0" y="0" width="40" height="60" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="2" />
                        <circle cx="20" cy="60" r="15" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="2" clipPath="inset(0 0 50% 0)" />
                        <line x1="20" y1="60" x2="20" y2="80" stroke={DASHBOARD_THEME.colors.text.secondary} strokeWidth="4" />
                        <rect x="0" y="80" width="40" height="10" fill={DASHBOARD_THEME.colors.text.primary} />
                        
                        {/* Screen Data */}
                        <rect x="50" y="-20" width="60" height="40" fill={DASHBOARD_THEME.colors.surface} stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="1" />
                        <path d="M 55 10 L 65 -5 L 75 5 L 85 -10 L 95 10 L 105 5" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="1" fill="none" />
                        
                        {/* Callout */}
                        <line x1="80" y1="30" x2="120" y2="70" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="2" />
                        <text x="125" y="75" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold">METROLOGY</text>
                        <text x="125" y="90" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10">$5,000 CAPEX</text>
                    </g>
                    
                    {/* Overall Value Header */}
                    <g transform="translate(150, 50)">
                        <rect x="-10" y="-30" width="160" height="40" fill={DASHBOARD_THEME.colors.text.primary} />
                        <text x="70" y="-5" fill={DASHBOARD_THEME.colors.background} fontSize="18" fontWeight="bold" textAnchor="middle">$50,000 MICRO-LAB</text>
                    </g>
                </svg>
            </div>

            {/* Technical Specifications Column */}
            <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', color: DASHBOARD_THEME.colors.text.primary, lineHeight: 1.1 }}>
                    <span style={{color: DASHBOARD_THEME.colors.accents.amber.base}}>Acoustic Ink Synthesis</span><br/>Micro-Gigafactory
                </h2>
                <p style={{ fontSize: '1.1rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.7, marginBottom: '2rem' }}>
                    Solid-state batteries are famously bottlenecked by the billions of dollars required to build giant mechanical calendering lines. ARN bypasses this entirely using wave-interference physics and off-the-shelf aerospace hardware.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Section 1 */}
                    <div>
                        <div style={{ fontSize: '0.9rem', letterSpacing: '2px', color: DASHBOARD_THEME.colors.accents.violet.base, marginBottom: '0.5rem', fontWeight: 600 }}>
                            1. ACOUSTIC PRINTER CORE ($17K)
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            Standing-Wave Alignment
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            By hacking an SLA/DLP 3D-Printer with piezoelectric ultrasonic transducers, we cast phi-ratio harmonic standing waves across a UV resin vat. This forces microscopic ceramic solid-state particles to self-assemble into a perfect 3D lattice, bypassing legacy mechanical rollers entirely.
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div>
                        <div style={{ fontSize: '0.9rem', letterSpacing: '2px', color: DASHBOARD_THEME.colors.accents.cyan.base, marginBottom: '0.5rem', fontWeight: 600 }}>
                            2. ISOLATION CHAMBER ($15K)
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            Argon Glovebox Ecosystem
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            Lithium-metal printing cannot happen in an open garage. Instead of a $50-million multi-acre cleanroom, the modified printer sits inside a sealed, commercial acrylic glovebox pumped with Argon gas to guarantee absolute 0% humidity and inert synthesis.
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div>
                        <div style={{ fontSize: '0.9rem', letterSpacing: '2px', color: DASHBOARD_THEME.colors.accents.emerald.base, marginBottom: '0.5rem', fontWeight: 600 }}>
                            3. INK PREPARATION ($13K)
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            Vacuum & Sonic Mixing
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            Before printing, raw nanoparticles are blasted with an ultrasonic homogenizer to shatter clumps, then spun in a planetary centrifugal vacuum mixer. This ensures 100% monolithic dispersion and extracts all microscopic air bubbles—which would otherwise cause fatal short-circuits.
                        </div>
                    </div>

                    {/* Section 4 */}
                    <div>
                        <div style={{ fontSize: '0.9rem', letterSpacing: '2px', color: DASHBOARD_THEME.colors.text.muted, marginBottom: '0.5rem', fontWeight: 600 }}>
                            4. VALIDATION HARDWARE ($5K)
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: DASHBOARD_THEME.colors.text.primary, marginBottom: '0.25rem' }}>
                            Digital Target Metrology
                        </div>
                        <div style={{ fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary }}>
                            Final validation is handled by high-resolution digital impedance profilers. This verifies the atomic lattice density and ensures zero dendrite pathways before the Hex-Cell is slotted into a 45 kWh Mainframe Suitcase.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
