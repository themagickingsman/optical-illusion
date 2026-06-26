import React, { useState } from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

export const BatterySwappingSOP = () => {
    const [activeStep, setActiveStep] = useState(1);

    const steps = [
        {
            id: 1,
            title: "1. Diagnostic Ping",
            color: DASHBOARD_THEME.colors.accents.cyan.base,
            sop: [
                "Initiate hardware diagnostic ping via the Mainframe user interface or synced mobile terminal.",
                "Identify the exact grid coordinate (e.g., C-04) of the degraded or fully discharged 4.5 kWh Hex-Cell.",
                "Verify that the Mainframe load-balancer has completely shunted active chassis current away from the target sector to prevent arc flashing."
            ]
        },
        {
            id: 2,
            title: "2. Ejection Protocol",
            color: DASHBOARD_THEME.colors.accents.amber.base,
            sop: [
                "Depress the flush-mounted mechanical release detent on the target Hex-Cell vertex.",
                "Wait for the audible pneumatic hiss as the active-cooling thermal fins retract from the cell wall.",
                "The cell will autonomously spring-eject 2 centimeters outward, breaking the heavy-duty umbilical contact."
            ]
        },
        {
            id: 3,
            title: "3. Safe Extraction",
            color: DASHBOARD_THEME.colors.accents.rose?.base || '#f43f5e',
            sop: [
                "Grip the integrated titanium carry-handle that deploys upon ejection.",
                "Pull the 4.5L Hex-Cell directly outward along its axial slide rails.",
                "Do not rotate or torque the cell during extraction, as this can damage the high-voltage gold-plated contact pins at the base."
            ]
        },
        {
            id: 4,
            title: "4. Cold Cell Insertion",
            color: DASHBOARD_THEME.colors.accents.emerald.base,
            sop: [
                "Align the primary thermal conduction spines of the new module with the chassis rails.",
                "Slide the Hex-Cell inward until mechanical resistance is met at the umbilical juncture.",
                "Apply firm, even pressure to the faceplate until the mechanical detent audibly clicks, confirming a hard physical lock and re-engaging the thermal fins."
            ]
        }
    ];

    const renderSVGSight = () => {
        const svgConfig = {
            viewBox: "0 0 400 500",
            style: { width: '100%', height: 'auto', display: 'block' }
        };
        
        switch(activeStep) {
            case 1:
                return (
                    <svg {...svgConfig}>
                        <pattern id="gridSOP" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="0.5" opacity="0.1" />
                        </pattern>
                        <rect width="400" height="500" fill="url(#gridSOP)" />
                        
                        <g transform="translate(100, 150) scale(1.2)">
                            {/* Abstracted Hex Grid */}
                            <polygon points="0,-40 34.6,-20 34.6,20 0,40 -34.6,20 -34.6,-20" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="1" />
                            <polygon points="69.2,-40 103.8,-20 103.8,20 69.2,40 34.6,20 34.6,-20" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="1" />
                            
                            {/* Target Cell (Pinged) */}
                            <polygon points="34.6,-80 69.2,-60 69.2,-20 34.6,0 0,-20 0,-60" fill={DASHBOARD_THEME.colors.accents.cyan.base} opacity="0.3" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="3" />
                            <circle cx="34.6" cy="-40" r="15" fill="none" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" strokeDasharray="4 4">
                                <animate attributeName="r" values="10;25;10" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <text x="34.6" y="-35" fill={DASHBOARD_THEME.colors.text.primary} fontSize="14" fontWeight="bold" textAnchor="middle">C-04</text>
                        </g>

                        <line x1="220" y1="100" x2="300" y2="60" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" />
                        <circle cx="220" cy="100" r="4" fill={DASHBOARD_THEME.colors.accents.cyan.base} />
                        <text x="305" y="55" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold">UI GRID PING</text>
                        <text x="305" y="70" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10">SHUNTING ACTIVE VOLTAGE</text>
                    </svg>
                );
            case 2:
                return (
                    <svg {...svgConfig}>
                        <pattern id="gridSOP" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke={DASHBOARD_THEME.colors.accents.amber.base} strokeWidth="0.5" opacity="0.1" /></pattern>
                        <rect width="400" height="500" fill="url(#gridSOP)" />
                        
                        <g transform="translate(200, 200) scale(1.5)">
                            {/* Hex cell top face */}
                            <polygon points="0,-40 34.6,-20 34.6,20 0,40 -34.6,20 -34.6,-20" fill={DASHBOARD_THEME.colors.text.primary} />
                            <circle cx="0" cy="0" r="10" fill={DASHBOARD_THEME.colors.accents.amber.base} />
                            
                            {/* Finger pushing detent */}
                            <path d="M 30 60 C 20 40, 5 15, 0 10" fill="none" stroke={DASHBOARD_THEME.colors.text.secondary} strokeWidth="4" strokeLinecap="round" />
                            <circle cx="30" cy="60" r="8" fill={DASHBOARD_THEME.colors.text.secondary} />
                            
                            {/* Spring eject action */}
                            <path d="M 0 -50 L 0 -80 M -20 -60 L -30 -90 M 20 -60 L 30 -90" stroke={DASHBOARD_THEME.colors.accents.amber.base} strokeWidth="2" strokeDasharray="2 4" />
                        </g>

                        <line x1="200" y1="200" x2="100" y2="100" stroke={DASHBOARD_THEME.colors.accents.amber.base} strokeWidth="2" />
                        <circle cx="200" cy="200" r="4" fill={DASHBOARD_THEME.colors.accents.amber.base} />
                        <text x="95" y="90" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold" textAnchor="end">MECHANICAL DETENT</text>
                        <text x="95" y="105" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10" textAnchor="end">DEPRESS TO RELEASE</text>
                        
                        <line x1="200" y1="50" x2="330" y2="80" stroke={DASHBOARD_THEME.colors.accents.amber.base} strokeWidth="2" />
                        <text x="335" y="75" fill={DASHBOARD_THEME.colors.accents.amber.base} fontSize="12" fontWeight="bold">PNEUMATIC EJECT</text>
                        <text x="335" y="90" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10">2CM STANDOFF POST-RELEASE</text>
                    </svg>
                );
            case 3:
                return (
                    <svg {...svgConfig}>
                        <pattern id="gridSOP" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke={DASHBOARD_THEME.colors.accents.rose?.base || '#f43f5e'} strokeWidth="0.5" opacity="0.1" /></pattern>
                        <rect width="400" height="500" fill="url(#gridSOP)" />

                        <g transform="translate(150, 350)">
                            {/* Hex Cell being pulled out (side profile) */}
                            <path d="M 0 0 L 100 -50 L 100 -250 L 0 -200 Z" fill="none" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" />
                            <path d="M 0 -200 L 50 -225 L 150 -175 L 100 -150 Z" fill={DASHBOARD_THEME.colors.text.primary} opacity="0.1" />
                            <line x1="100" y1="-250" x2="150" y2="-175" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" />
                            <line x1="100" y1="-50" x2="150" y2="25" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" />
                            <line x1="150" y1="-175" x2="150" y2="25" stroke={DASHBOARD_THEME.colors.text.primary} strokeWidth="3" />
                            
                            {/* Carry Handle */}
                            <path d="M -10 -150 C -40 -150, -40 -50, -10 -50" fill="none" stroke={DASHBOARD_THEME.colors.accents.rose?.base || '#f43f5e'} strokeWidth="6" />
                            
                            {/* Slide rails */}
                            <line x1="50" y1="-50" x2="-50" y2="0" stroke={DASHBOARD_THEME.colors.text.secondary} strokeWidth="2" strokeDasharray="5 5" />
                            <line x1="150" y1="-100" x2="50" y2="-50" stroke={DASHBOARD_THEME.colors.text.secondary} strokeWidth="2" strokeDasharray="5 5" />
                        </g>

                        <line x1="130" y1="250" x2="70" y2="150" stroke={DASHBOARD_THEME.colors.accents.rose?.base || '#f43f5e'} strokeWidth="2" />
                        <circle cx="130" cy="250" r="4" fill={DASHBOARD_THEME.colors.accents.rose?.base || '#f43f5e'} />
                        <text x="65" y="140" fill={DASHBOARD_THEME.colors.text.primary} fontSize="12" fontWeight="bold" textAnchor="end">TITANIUM HANDLE</text>
                        <text x="65" y="155" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10" textAnchor="end">GRIP FIRMLY</text>

                        <line x1="200" y1="350" x2="300" y2="400" stroke={DASHBOARD_THEME.colors.accents.rose?.base || '#f43f5e'} strokeWidth="2" />
                        <circle cx="200" cy="350" r="4" fill={DASHBOARD_THEME.colors.accents.rose?.base || '#f43f5e'} />
                        <text x="305" y="400" fill={DASHBOARD_THEME.colors.accents.rose?.base || '#f43f5e'} fontSize="12" fontWeight="bold">AXIAL EXTRACTION</text>
                        <text x="305" y="415" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10">DO NOT ROTATE LOAD</text>
                    </svg>
                );
            case 4:
                return (
                    <svg {...svgConfig}>
                         <pattern id="gridSOP" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke={DASHBOARD_THEME.colors.accents.emerald.base} strokeWidth="0.5" opacity="0.1" /></pattern>
                        <rect width="400" height="500" fill="url(#gridSOP)" />
                        
                        <g transform="translate(200, 250) scale(1.5)">
                            <polygon points="0,-40 34.6,-20 34.6,20 0,40 -34.6,20 -34.6,-20" fill={DASHBOARD_THEME.colors.text.primary} stroke={DASHBOARD_THEME.colors.accents.emerald.base} strokeWidth="2" />
                            <circle cx="0" cy="0" r="15" fill="none" stroke={DASHBOARD_THEME.colors.accents.emerald.base} strokeWidth="3" />
                            <path d="M -15 -10 L 0 5 L 20 -15" fill="none" stroke={DASHBOARD_THEME.colors.background} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            
                            {/* Inward pressure arrows */}
                            <path d="M -50 -50 L -20 -20 M -30 -20 L -20 -20 L -20 -30" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="2" />
                            <path d="M 50 50 L 20 20 M 30 20 L 20 20 L 20 30" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="2" />
                            <path d="M -50 50 L -20 20 M -20 30 L -20 20 L -30 20" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="2" />
                            <path d="M 50 -50 L 20 -20 M 20 -30 L 20 -20 L 30 -20" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="2" />
                        </g>

                        <line x1="200" y1="200" x2="200" y2="100" stroke={DASHBOARD_THEME.colors.accents.emerald.base} strokeWidth="2" />
                        <circle cx="200" cy="200" r="4" fill={DASHBOARD_THEME.colors.accents.emerald.base} />
                        <text x="200" y="80" fill={DASHBOARD_THEME.colors.accents.emerald.base} fontSize="14" fontWeight="bold" textAnchor="middle">CONNECTION SECURED</text>
                        <text x="200" y="95" fill={DASHBOARD_THEME.colors.text.muted} fontSize="10" textAnchor="middle">UMBILICAL CONTACT ESTABLISHED</text>
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{
            background: DASHBOARD_THEME.colors.background,
            borderRadius: '24px',
            border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
            padding: '3rem',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
        }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(400px, 1.5fr)', gap: '4rem', alignItems: 'center' }}>
                
                {/* Visual Schematic Panel */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: `2px solid ${steps[activeStep - 1].color}`,
                    position: 'relative',
                    transition: 'border-color 0.3s ease'
                }}>
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', color: DASHBOARD_THEME.colors.text.muted, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                        AEROSPACE/SOP: HOT-SWAP PROTOCOL
                    </div>
                    {renderSVGSight()}
                </div>

                {/* Interactive Checklist Panel */}
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem', color: DASHBOARD_THEME.colors.text.primary, lineHeight: 1.1 }}>
                        Live Hot-Swapping<br/>Protocol
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '2.5rem' }}>
                        {steps.map((step) => (
                            <button
                                key={step.id}
                                onClick={() => setActiveStep(step.id)}
                                style={{
                                    padding: '0.75rem 0.5rem',
                                    background: activeStep === step.id ? step.color : '#ffffff',
                                    color: activeStep === step.id ? '#ffffff' : DASHBOARD_THEME.colors.text.muted,
                                    border: `1px solid ${activeStep === step.id ? step.color : DASHBOARD_THEME.colors.glass.border}`,
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: activeStep === step.id ? `0 4px 15px ${step.color}40` : 'none'
                                }}
                            >
                                PHASE {step.id}
                            </button>
                        ))}
                    </div>

                    <div style={{ 
                        background: '#ffffff', 
                        padding: '2.5rem', 
                        borderRadius: '16px', 
                        borderLeft: `4px solid ${steps[activeStep - 1].color}`,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: steps[activeStep - 1].color, marginBottom: '1.5rem' }}>
                            {steps[activeStep - 1].title}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {steps[activeStep - 1].sop.map((instruction, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        borderRadius: '50%', 
                                        background: `${steps[activeStep - 1].color}15`, 
                                        color: steps[activeStep - 1].color,
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        flexShrink: 0,
                                        marginTop: '0.1rem'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '1.05rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.6 }}>
                                        {instruction}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
