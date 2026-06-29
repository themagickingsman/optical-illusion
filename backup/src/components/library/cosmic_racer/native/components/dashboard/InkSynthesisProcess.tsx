'use client';

import React, { useState } from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

const steps = [
    {
        id: 1,
        title: "1. Inert Measurement",
        equipment: "Argon Glovebox & Analytical Balance",
        icon: "⚖️",
        color: DASHBOARD_THEME.colors.accents.amber.base,
        sop: [
            "Purge the glovebox with Argon gas until O2 and H2O levels are strictly < 0.1 ppm.",
            "Sterilize all spatulas and glassware, then transfer them into the vacuum antechamber.",
            "Using the analytical balance (0.01mg precision), weigh precise molar ratios of Quantum Dot precursors (e.g., Lead Halides, Cadmium Selenide).",
            "Transfer dry powder precursors into a sterile glass vial and seal with a PTFE-lined cap before removing from the inert atmosphere."
        ]
    },
    {
        id: 2,
        title: "2. Thermal Dissolution",
        equipment: "Magnetic Stirrer Hot Plate",
        icon: "🌪️",
        color: DASHBOARD_THEME.colors.accents.cyan.base,
        sop: [
            "Inject anhydrous solvent (DMF/DMSO) into the sealed precursor vial via syringe to maintain the oxygen-free environment.",
            "Place the vial in a silicone oil bath on the magnetic hot plate to ensure even heat distribution.",
            "Drop in a PTFE-coated magnetic stir bar.",
            "Set stir speed to 800 RPM and temperature to exactly 70°C.",
            "Allow continuous stirring for 2 hours until the solution is completely clear, indicating zero micro-clumps."
        ]
    },
    {
        id: 3,
        title: "3. Nanocrystal Tuning",
        equipment: "Schlenk Line & Heating Mantle",
        icon: "🌡️",
        color: DASHBOARD_THEME.colors.accents.violet.base,
        sop: [
            "Transfer the homogeneous solution to a 3-neck round bottom flask under a continuous Schlenk Line vacuum/nitrogen flow.",
            "Rapidly inject the secondary chemical precursor into the flask at exactly 180°C to trigger instantaneous nucleation.",
            "Monitor the temperature drop down to the second. Longer heat exposure equates to mathematically larger nanocrystals (red tuning).",
            "Quench the reaction instantly by submerging the flask in an ice bath the moment the target nanometer scale (and resulting frequency color) is achieved."
        ]
    },
    {
        id: 4,
        title: "4. Acoustic Suspension",
        equipment: "Ultrasonic Homogenizer",
        icon: "🔊",
        color: DASHBOARD_THEME.colors.accents.emerald.base,
        sop: [
            "Transfer the quenched, tuned ink into the acoustic processing chamber.",
            "Submerge the titanium ultrasonic probe directly into the liquid suspension.",
            "Apply precise acoustic frequencies (e.g., 432 Hz standing wave harmonics) for 15 minutes at high amplitude.",
            "The acoustic cavitation shatters any remaining microscopic agglomerations, forcing the nanocrystals into a perfect, uniform mono-dispersion.",
            "Verify suspension quality via dynamic light scattering."
        ]
    },
    {
        id: 5,
        title: "5. Micro-Filtration",
        equipment: "PTFE 0.22μm Syringe Filter",
        icon: "💉",
        color: DASHBOARD_THEME.colors.text.primary,
        sop: [
            "Draw the sonicated ink into a sterile glass syringe.",
            "Securely attach a 0.22μm PTFE hydrophobic membrane filter to the syringe tip.",
            "Slowly and steadily extrude the ink through the membrane into the final UV-blocking amber glass storage bottle.",
            "This final pass removes any rogue, unreacted macro-particles that could potentially clog the Slot-Die printer head on the manufacturing line.",
            "Seal, crimp, and label the bottle with the specific nanometer scale and output wattage frequency."
        ]
    },
    {
        id: 6,
        title: "6. Metrology & Validation",
        equipment: "XRD & Optical Spectroscopy",
        icon: "🔬",
        color: DASHBOARD_THEME.colors.accents.rose?.base || '#f43f5e',
        sop: [
            "Load a micro-sample of the formulated ink into the UV-Vis-NIR Spectrophotometer to verify the exact absorption frequency.",
            "An extremely sharp absorption peak confirms perfect uniform mono-dispersion of Quantum Dots.",
            "For solid-state verification, initiate X-Ray Diffraction (XRD) on an acoustically-printed test film.",
            "XRD scatters high-energy x-rays into the dried, acoustically-crystallized lattice.",
            "A chaotic graph indicates a defective print. Sharp, distinct vertical peaks mathematically prove a perfect, 7-layer harmonically aligned crystalline structure.",
            "Once verified, cryptographically seal the batch signature for global decentralized distribution."
        ]
    }
];

export const InkSynthesisProcess = () => {
    const [activeStep, setActiveStep] = useState(1);

    const currentStepData = steps.find(s => s.id === activeStep);

    // Airline Safety Card Style SVG Renderers
    const renderEquipmentSVG = (stepId: number, color: string) => {
        const svgConfig = {
            viewBox: "0 0 400 300",
            style: { width: '100%', height: 'auto', dropShadow: `0 4px 12px ${color}15` }
        };

        const strokeColor = DASHBOARD_THEME.colors.text.primary;
        const highlightColor = color;
        const strokeWidth = 3;

        switch (stepId) {
            case 1: // Glovebox
                return (
                    <svg {...svgConfig}>
                        {/* Box Outline */}
                        <path d="M 50 100 L 350 100 L 320 250 L 80 250 Z" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                        <path d="M 50 100 L 100 50 L 400 50 L 350 100" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                        <path d="M 400 50 L 370 200 L 320 250" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                        {/* Glove Ports */}
                        <circle cx="150" cy="180" r="30" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <circle cx="250" cy="180" r="30" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <circle cx="150" cy="180" r="20" fill={highlightColor} opacity="0.2" />
                        <circle cx="250" cy="180" r="20" fill={highlightColor} opacity="0.2" />
                        {/* Antechamber (Airlock) */}
                        <rect x="20" y="120" width="30" height="80" rx="4" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <line x1="35" y1="120" x2="35" y2="200" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" />
                        {/* Internal Balance */}
                        <rect x="180" y="210" width="40" height="15" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <path d="M 185 210 L 185 190 L 215 190 L 215 210" fill="none" stroke={highlightColor} strokeWidth={2} />
                        {/* Argon Gas Line */}
                        <path d="M 375 75 L 375 20 L 390 20" fill="none" stroke={highlightColor} strokeWidth={strokeWidth} strokeDasharray="5 5" />
                        
                        {/* Airline Labels */}
                        <line x1="35" y1="120" x2="70" y2="70" stroke={highlightColor} strokeWidth="1" />
                        <text x="70" y="65" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">AIRLOCK</text>
                        
                        <line x1="200" y1="190" x2="200" y2="150" stroke={highlightColor} strokeWidth="1" />
                        <text x="200" y="145" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">ANALYTICAL BALANCE</text>
                        
                        <line x1="375" y1="40" x2="330" y2="20" stroke={highlightColor} strokeWidth="1" />
                        <text x="330" y="15" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">ARGON PURGE</text>
                        
                        <text x="150" y="225" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">ZERO-O2 ATMOSPHERE</text>
                    </svg>
                );
            case 2: // Hot Plate
                return (
                    <svg {...svgConfig}>
                        {/* Hot Plate Base */}
                        <rect x="100" y="220" width="200" height="40" rx="4" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Dials */}
                        <circle cx="140" cy="240" r="10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <circle cx="180" cy="240" r="10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <path d="M 140 240 L 145 235" stroke={highlightColor} strokeWidth="2" />
                        <path d="M 180 240 L 180 232" stroke={highlightColor} strokeWidth="2" />
                        {/* Heating pad */}
                        <rect x="120" y="210" width="160" height="10" fill={highlightColor} opacity="0.3" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Beaker / Oil Bath */}
                        <path d="M 140 210 L 140 120 C 140 110, 260 110, 260 120 L 260 210 Z" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Liquid Line */}
                        <path d="M 140 160 Q 200 170 260 160" fill="none" stroke={highlightColor} strokeWidth={2} strokeDasharray="4 4" />
                        {/* Vial inside bath */}
                        <rect x="180" y="130" width="40" height="75" rx="2" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <rect x="185" y="115" width="30" height="15" fill={strokeColor} />
                        {/* Magnetic Stir bar */}
                        <rect x="190" y="195" width="20" height="6" rx="3" fill={highlightColor} />
                        {/* Spin motion lines */}
                        <path d="M 180 200 C 180 190, 220 190, 220 200" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
                        <path d="M 180 200 C 180 210, 220 210, 220 200" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />

                        {/* Airline Labels */}
                        <line x1="260" y1="180" x2="310" y2="150" stroke={highlightColor} strokeWidth="1" />
                        <text x="310" y="145" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">SILICONE OIL BATH</text>

                        <line x1="200" y1="130" x2="250" y2="90" stroke={highlightColor} strokeWidth="1" />
                        <text x="250" y="85" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">SOLVENT BASE</text>

                        <line x1="200" y1="200" x2="250" y2="240" stroke={highlightColor} strokeWidth="1" />
                        <text x="250" y="250" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">PTFE STIR BAR</text>

                        <line x1="140" y1="240" x2="80" y2="200" stroke={highlightColor} strokeWidth="1" />
                        <text x="80" y="195" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">70°C THERMOSTAT</text>
                    </svg>
                );
            case 3: // Schlenk Line
                return (
                    <svg {...svgConfig}>
                        {/* Schlenk Manifold */}
                        <line x1="50" y1="50" x2="350" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <line x1="50" y1="70" x2="350" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Stopcocks/Valves */}
                        {[150, 200, 250].map(x => (
                            <React.Fragment key={x}>
                                <circle cx={x} cy="60" r="10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                                <line x1={x} y1="70" x2={x} y2="100" stroke={strokeColor} strokeWidth={strokeWidth} />
                            </React.Fragment>
                        ))}
                        {/* Nitrogen / Vacuum indicators */}
                        <text x="60" y="45" fill={highlightColor} fontSize="12" fontWeight="bold">N₂</text>
                        <text x="60" y="85" fill={strokeColor} fontSize="12" fontWeight="bold">VAC</text>
                        {/* 3-Neck Flask */}
                        <path d="M 160 210 C 160 260, 240 260, 240 210 C 240 180, 210 170, 210 140 L 190 140 C 190 170, 160 180, 160 210 Z" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <path d="M 165 190 L 140 160 L 155 150" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <path d="M 235 190 L 260 160 L 245 150" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Needles/Injection */}
                        <line x1="148" y1="155" x2="160" y2="185" stroke={highlightColor} strokeWidth="2" />
                        <line x1="200" y1="100" x2="200" y2="170" stroke={highlightColor} strokeWidth="2" strokeDasharray="3 3" />
                        {/* Thermocouple */}
                        <line x1="252" y1="155" x2="210" y2="230" stroke={strokeColor} strokeWidth="2" />
                        {/* Liquid */}
                        <path d="M 170 230 Q 200 220 230 230" fill="none" stroke={highlightColor} strokeWidth={2} />
                        {/* Ice bath ready */}
                        <rect x="130" y="250" width="140" height="30" rx="4" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <path d="M 140 250 L 150 280 M 160 250 L 170 280 M 240 250 L 230 280 M 260 250 L 250 280" stroke={highlightColor} strokeWidth={1} />

                        {/* Airline Labels */}
                        <line x1="200" y1="130" x2="250" y2="100" stroke={highlightColor} strokeWidth="1" />
                        <text x="250" y="95" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">N2 / VAC MANIFOLD</text>

                        <line x1="148" y1="155" x2="90" y2="120" stroke={highlightColor} strokeWidth="1" />
                        <text x="90" y="115" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">FAST INJECTION</text>

                        <line x1="252" y1="155" x2="310" y2="130" stroke={highlightColor} strokeWidth="1" />
                        <text x="310" y="125" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">THERMOCOUPLE</text>

                        <line x1="130" y1="265" x2="70" y2="265" stroke={highlightColor} strokeWidth="1" />
                        <text x="70" y="260" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">ICE BATH QUENCH</text>
                    </svg>
                );
            case 4: // Ultrasonic
                return (
                    <svg {...svgConfig}>
                        {/* Control Box */}
                        <rect x="80" y="60" width="100" height="150" rx="8" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <rect x="95" y="80" width="70" height="40" fill={highlightColor} opacity="0.1" stroke={strokeColor} strokeWidth={2} />
                        <text x="130" y="105" fill={highlightColor} fontSize="14" fontWeight="bold" textAnchor="middle">432 Hz</text>
                        <circle cx="110" cy="150" r="10" fill="none" stroke={strokeColor} strokeWidth={2} />
                        <circle cx="150" cy="150" r="10" fill="none" stroke={strokeColor} strokeWidth={2} />
                        {/* Converter / Transducer */}
                        <rect x="230" y="50" width="40" height="60" rx="4" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Titanium Horn (Probe) */}
                        <path d="M 240 110 L 260 110 L 255 200 L 245 200 Z" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Cable */}
                        <path d="M 180 80 C 200 80, 210 50, 230 60" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Beaker with ink */}
                        <path d="M 210 160 L 210 250 C 210 260, 290 260, 290 250 L 290 160" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Cavitation waves */}
                        <path d="M 235 210 C 240 220, 260 220, 265 210" fill="none" stroke={highlightColor} strokeWidth="2" />
                        <path d="M 230 225 C 240 240, 260 240, 270 225" fill="none" stroke={highlightColor} strokeWidth="2" />
                        <circle cx="240" cy="230" r="2" fill={highlightColor} />
                        <circle cx="250" cy="235" r="3" fill={highlightColor} />
                        <circle cx="260" cy="225" r="2" fill={highlightColor} />

                         {/* Airline Labels */}
                        <line x1="250" y1="160" x2="310" y2="120" stroke={highlightColor} strokeWidth="1" />
                        <text x="310" y="115" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">TITANIUM HORN</text>

                        <line x1="280" y1="230" x2="340" y2="230" stroke={highlightColor} strokeWidth="1" />
                        <text x="340" y="225" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">CAVITATION FIELD</text>

                        <line x1="130" y1="60" x2="130" y2="20" stroke={highlightColor} strokeWidth="1" />
                        <text x="130" y="15" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">FREQ GENERATOR</text>

                        <line x1="210" y1="180" x2="150" y2="210" stroke={highlightColor} strokeWidth="1" />
                        <text x="150" y="220" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">LIQUID SUSPENSION</text>
                    </svg>
                );
            case 5: // Syringe Filter
                return (
                    <svg {...svgConfig}>
                        {/* Glass Syringe Barrel */}
                        <rect x="180" y="60" width="40" height="120" rx="2" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Plunger */}
                        <rect x="195" y="20" width="10" height="80" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <rect x="185" y="10" width="30" height="10" rx="2" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <rect x="182" y="100" width="36" height="10" fill={strokeColor} /> {/* Rubber seal */}
                        {/* Tick marks */}
                        {[70, 90, 110, 130, 150].map(y => (
                            <line key={y} x1="180" y1={y} x2="190" y2={y} stroke={strokeColor} strokeWidth="1" />
                        ))}
                        {/* Ink driving down */}
                        <path d="M 195 120 L 195 170 M 205 120 L 205 170" stroke={highlightColor} strokeWidth="2" strokeDasharray="4 4" />
                        {/* Luer Lock / Filter Housing (0.22 micron) */}
                        <circle cx="200" cy="190" r="20" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <line x1="185" y1="190" x2="215" y2="190" stroke={highlightColor} strokeWidth="3" strokeDasharray="2 2" /> {/* Membrane */}
                        {/* Needle / Output */}
                        <line x1="200" y1="210" x2="200" y2="230" stroke={strokeColor} strokeWidth={strokeWidth} />
                        {/* Amber Glass Crimp Vial */}
                        <path d="M 170 250 L 170 290 C 170 295, 230 295, 230 290 L 230 250 C 230 240, 215 240, 215 230 L 215 220 L 185 220 L 185 230 C 185 240, 170 240, 170 250 Z" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <rect x="182" y="215" width="36" height="10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Crimp top */}
                        <text x="200" y="275" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">Q-DOT</text>

                         {/* Airline Labels */}
                        <line x1="180" y1="100" x2="120" y2="100" stroke={highlightColor} strokeWidth="1" />
                        <text x="120" y="95" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">GLASS SYRINGE</text>

                        <line x1="220" y1="190" x2="280" y2="190" stroke={highlightColor} strokeWidth="1" />
                        <text x="280" y="185" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">0.22μm MEMBRANE</text>

                        <line x1="170" y1="270" x2="110" y2="270" stroke={highlightColor} strokeWidth="1" />
                        <text x="110" y="265" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">AMBER STORAGE</text>

                        <line x1="200" y1="280" x2="200" y2="310" stroke={highlightColor} strokeWidth="1" />
                        <text x="200" y="320" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">FILTERED OUTPUT</text>
                    </svg>
                );
            case 6: // XRD / Optical Spectroscopy
                return (
                    <svg {...svgConfig}>
                        {/* XRD Machine Box */}
                        <rect x="100" y="150" width="200" height="120" rx="8" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <rect x="120" y="170" width="160" height="80" rx="4" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        
                        {/* Sample Stage */}
                        <rect x="190" y="230" width="20" height="20" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <line x1="180" y1="230" x2="220" y2="230" stroke={highlightColor} strokeWidth={3} />
                        
                        {/* X-Ray Source emitting beam */}
                        <rect x="130" y="180" width="30" height="20" rx="2" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <path d="M 160 190 L 195 230" fill="none" stroke={highlightColor} strokeWidth={2} strokeDasharray="3 3" />
                        
                        {/* X-Ray Detector receiving beam */}
                        <rect x="240" y="180" width="30" height="20" rx="2" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <path d="M 205 230 L 240 190" fill="none" stroke={highlightColor} strokeWidth={2} strokeDasharray="3 3" />
                        
                        {/* Computer Screen rendering distinct peaks */}
                        <rect x="150" y="30" width="100" height="80" rx="4" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <rect x="190" y="110" width="20" height="40" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                        <line x1="170" y1="150" x2="230" y2="150" stroke={strokeColor} strokeWidth={strokeWidth} />
                        
                        {/* The math peaks */}
                        <path d="M 160 90 L 180 90 L 185 50 L 190 90 L 205 90 L 210 60 L 215 90 L 240 90" fill="none" stroke={highlightColor} strokeWidth={2} />
                        
                        {/* Airline Labels */}
                        <line x1="130" y1="190" x2="70" y2="150" stroke={highlightColor} strokeWidth="1" />
                        <text x="70" y="145" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">X-RAY EMITTER</text>

                        <line x1="200" y1="230" x2="200" y2="280" stroke={highlightColor} strokeWidth="1" />
                        <text x="200" y="290" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">PRINTED SAMPLE</text>

                        <line x1="270" y1="190" x2="330" y2="150" stroke={highlightColor} strokeWidth="1" />
                        <text x="330" y="145" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">PHOTON DETECTOR</text>

                        <line x1="250" y1="70" x2="300" y2="70" stroke={highlightColor} strokeWidth="1" />
                        <text x="300" y="65" fill={highlightColor} fontSize="10" fontWeight="bold" textAnchor="middle">LATTICE DIFFRACTION</text>
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ marginBottom: '4rem', padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: `1px solid ${DASHBOARD_THEME.colors.glass.border}` }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <span style={{ color: DASHBOARD_THEME.colors.accents.cyan.base }}>✈️</span> Wet-Lab Synthesizer Protocol
                </h2>
                <p style={{ color: DASHBOARD_THEME.colors.text.secondary, maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Safety instruction graphic for the formulation of Liquid Quantum Dots. Review the equipment schematics and standard operating procedures (SOP) before initiating the reaction.
                </p>
            </div>

            {/* Interactive Step Navigation */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '0.5rem', 
                flexWrap: 'wrap',
                padding: '1rem 0',
                marginBottom: '2rem',
                borderBottom: `2px solid ${DASHBOARD_THEME.colors.glass.border}`,
                paddingBottom: '2rem'
            }}>
                {steps.map((step) => {
                    const isActive = step.id === activeStep;
                    return (
                        <button 
                            key={step.id} 
                            onClick={() => setActiveStep(step.id)}
                            style={{ 
                                background: isActive ? step.color : 'transparent',
                                color: isActive ? '#fff' : DASHBOARD_THEME.colors.text.secondary,
                                border: `2px solid ${isActive ? step.color : DASHBOARD_THEME.colors.glass.border}`,
                                padding: '0.75rem 1.5rem',
                                borderRadius: '99px',
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span>{step.id}.</span> {step.title}
                        </button>
                    );
                })}
            </div>

            {/* SOP Detailed Execution Panel - AIRLINE STYLE */}
            {currentStepData && (
                <div style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: `2px solid ${currentStepData.color}40`,
                    boxShadow: `0 20px 50px ${currentStepData.color}15`,
                    display: 'flex',
                    overflow: 'hidden',
                    minHeight: '400px'
                }}>
                    
                    {/* LEFT PANEL: SVG EQUIPMENT LINE ART */}
                    <div style={{ 
                        flex: '0 0 45%', 
                        background: `${currentStepData.color}05`, 
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRight: `2px solid ${currentStepData.color}40`,
                        position: 'relative'
                    }}>
                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', color: currentStepData.color, fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                            HARDWARE SCHEMATIC
                        </div>
                        <h3 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>
                            {currentStepData.equipment}
                        </h3>
                        
                        <div style={{ width: '100%', maxWidth: '350px' }}>
                            {renderEquipmentSVG(currentStepData.id, currentStepData.color)}
                        </div>
                    </div>

                    {/* RIGHT PANEL: SOP CHECKLIST */}
                    <div style={{ flex: 1, padding: '3rem', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '4px', background: currentStepData.color }} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '2.5rem' }}>{currentStepData.icon}</div>
                            <div>
                                <div style={{ color: DASHBOARD_THEME.colors.text.secondary, fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                                    PROTOCOL
                                </div>
                                <h3 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                                    {currentStepData.title.toUpperCase()}
                                </h3>
                            </div>
                        </div>
                            
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {currentStepData.sop.map((instruction, idx) => (
                                <div key={idx} style={{ 
                                    display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
                                    padding: '1rem',
                                    background: `${currentStepData.color}05`,
                                    borderRadius: '12px',
                                    border: `1px solid ${currentStepData.color}20`
                                }}>
                                    <div style={{ 
                                        width: '28px', height: '28px', 
                                        borderRadius: '50%', 
                                        background: currentStepData.color,
                                        color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem', fontWeight: 900,
                                        flexShrink: 0,
                                        boxShadow: `0 4px 10px ${currentStepData.color}50`
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.05rem', lineHeight: 1.6 }}>
                                        {instruction.split(/([A-Z0-9-°]{2,}|[0-9]+(?:\.[0-9]+)?[a-zA-Zμ]+)/g).map((part, pIdx) => {
                                            if (part.match(/^[A-Z0-9-°]{2,}$/) || part.match(/^[0-9]+(?:\.[0-9]+)?[a-zA-Zμ]+$/) || part.match(/^[0-9]+°C$/)) {
                                                return <strong key={pIdx} style={{ color: currentStepData.color, background: `${currentStepData.color}15`, padding: '0 0.25rem', borderRadius: '4px' }}>{part}</strong>;
                                            }
                                            return <span key={pIdx}>{part}</span>;
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {/* Personnel Profile Section */}
            <div style={{
                marginTop: '4rem',
                paddingTop: '3rem',
                borderTop: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 2fr)',
                gap: '3rem',
                alignItems: 'start'
            }}>
                <div>
                    <div style={{ color: DASHBOARD_THEME.colors.text.secondary, fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1rem' }}>
                        REQUIRED PERSONNEL PROFILE
                    </div>
                    <h3 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.75rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.2 }}>
                        Quantum Materials Synthesis Engineer
                    </h3>
                    <p style={{ color: DASHBOARD_THEME.colors.text.secondary, fontSize: '1.05rem', lineHeight: 1.6 }}>
                        Responsible for the absolute precision wet-lab formulation of colloidal quantum dots and perovskite nanocrystals. This role demands a convergence of advanced chemical engineering, strict metrological validation, and zero-tolerance execution to secure the raw material supply chain for decentralized acoustic manufacturing.
                    </p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div style={{ color: DASHBOARD_THEME.colors.accents.cyan.base, fontSize: '1.5rem', marginBottom: '0.75rem' }}>⚗️</div>
                        <h4 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Core Competencies</h4>
                        <ul style={{ color: DASHBOARD_THEME.colors.text.secondary, fontSize: '0.9rem', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                            <li style={{ marginBottom: '0.5rem' }}>Colloidal Nanocrystal Nucleation</li>
                            <li style={{ marginBottom: '0.5rem' }}>Schlenk Line & Inert Environment</li>
                            <li style={{ marginBottom: '0.5rem' }}>Ultrasonic Homogenization</li>
                            <li>Sub-second Thermal Precision</li>
                        </ul>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div style={{ color: DASHBOARD_THEME.colors.accents.violet.base, fontSize: '1.5rem', marginBottom: '0.75rem' }}>📐</div>
                        <h4 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Metrology & Validation</h4>
                        <ul style={{ color: DASHBOARD_THEME.colors.text.secondary, fontSize: '0.9rem', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                            <li style={{ marginBottom: '0.5rem' }}>XRD Lattice Analysis</li>
                            <li style={{ marginBottom: '0.5rem' }}>UV-Vis-NIR Spectroscopy</li>
                            <li style={{ marginBottom: '0.5rem' }}>Dynamic Light Scattering (DLS)</li>
                            <li>Cryptographic Batch Signature</li>
                        </ul>
                    </div>
                    
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div style={{ color: DASHBOARD_THEME.colors.accents.amber.base, fontSize: '1.5rem', marginBottom: '0.75rem' }}>🎓</div>
                        <h4 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Academic & Certifications</h4>
                        <ul style={{ color: DASHBOARD_THEME.colors.text.secondary, fontSize: '0.9rem', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                            <li style={{ marginBottom: '0.5rem' }}><strong>Ph.D. or M.S.</strong> in Materials Science, Inorganic Chemistry, or Nanotechnology</li>
                            <li style={{ marginBottom: '0.5rem' }}><strong>ISO Class 5</strong> Cleanroom Operator Certification</li>
                            <li style={{ marginBottom: '0.5rem' }}>Advanced Chemical Handling (HazMat)</li>
                            <li>Laser & Radiation Safety Certified (XRD)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
