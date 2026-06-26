"use client";

import React, { useState, useEffect } from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

// Stages of the factory floor
type FactoryStation = 1 | 2 | 3 | 4 | 5 | 6; 

const STATION_DATA = {
    1: {
        title: "Station 1: Cathode Slurry & Coating",
        equipmentType: "Industrial Mixing & Coating Assembly",
        machine: "Vacuum Planetary Disperser & Slot-Die Coater",
        instruction: "Blend the raw LiFePO4 powder, carbon black, and PVDF binder under a vacuum to prevent oxidation. The dispersed slurry is then precisely coated onto an ultra-thin aluminum foil current collector.",
        actionLabel: "INITIALIZE PLANETARY DISPERSER"
    },
    2: {
        title: "Station 2: Nanorod Synthesis & Injection",
        equipmentType: "High-Frequency Acoustic Disperser",
        machine: "Ultrasonic Homogenizer",
        instruction: "Apply high-frequency ultrasonic waves to the wet slurry. This perfectly disperses the critical 0.1 wt% Gold Nanorods (AuNPs) into the mixture, ensuring zero clumping and even distribution.",
        actionLabel: "ACTIVATE ULTRASONIC INJECTION"
    },
    3: {
        title: "Station 3: Geometric Magnetic Alignment",
        equipmentType: "Superconducting Magnetic Array",
        machine: "Superconducting Helmholtz Coil Rig",
        instruction: "Apply a precisely calculated, multi-axis magnetic field mapped to the Cosmic Compass Level 15 geometry. The floating Gold Nanorods magnetically snap into the fractal lattice pattern just before the slurry is flash-dried.",
        actionLabel: "ENGAGE HELMHOLTZ COILS"
    },
    4: {
        title: "Station 4: Cell Calendering & Stacking",
        equipmentType: "Heavy Industrial Press & Robotics",
        machine: "Roll Calendering Machine & Z-Fold Stacker",
        instruction: "Pass the dried electrodes through massive steel rollers (Calendering) to compress the materials and dramatically increase energy density. The stacker then intricately Z-folds the Anode, Separator, and geometric Cathode into the final prismatic cell block.",
        actionLabel: "BEGIN CALENDERING & STACKING"
    },
    5: {
        title: "Station 5: Faraday Chassis Sealing",
        equipmentType: "Automated Laser & Vacuum Deposition",
        machine: "Laser Welding System & PVD Sputtering Chamber",
        instruction: "A robotic laser welds the heavy steel/copper inner casing completely shut around the cell. The unit is then lowered into a vacuum chamber where pure 24k Gold is vaporized and deposited onto the exterior, creating the flawless, eternal EMP Faraday shield.",
        actionLabel: "SEAL & ELECTROPLATE CHASSIS"
    },
    6: {
        title: "Quality Assurance: EMP Immunity Test",
        equipmentType: "Military-Grade EMP Simulator",
        machine: "High-Altitude Electromagnetic Pulse (HEMP) Simulator",
        instruction: "Subject the completed Auric-Lattice Geometric Matrix to a simulated, massive electromagnetic pulse to verify the integrity of the 24k Gold Faraday shielding and the stability of the inner geometric lattice.",
        actionLabel: "FIRE ELECTRO-MAGNETIC PULSE"
    }
};

const FactoryFloorPlan = ({ currentStation, stationComplete }: { currentStation: number, stationComplete: Record<number, boolean> }) => {
    // Top-down U-Shape Factory Layout
    // Coords for the U-shape path
    const pathD = "M 50 250 L 50 50 Q 50 20 80 20 L 720 20 Q 750 20 750 50 L 750 250";
    
    // Positions for the 6 stations along the U-shape
    const stations = [
        { id: 1, cx: 50, cy: 200, label: "STATION 1" },
        { id: 2, cx: 50, cy: 80, label: "STATION 2" },
        { id: 3, cx: 300, cy: 20, label: "STATION 3" },
        { id: 4, cx: 500, cy: 20, label: "STATION 4" },
        { id: 5, cx: 750, cy: 80, label: "STATION 5" },
        { id: 6, cx: 750, cy: 200, label: "STATION 6" },
    ];

    // Zone background boxes
    const zones = [
        { x: 10, y: 140, w: 80, h: 100, color: 'rgba(148, 163, 184, 0.1)', title: "ZONE 1: DRY ROOM" },
        { x: 10, y: 0, w: 350, h: 120, color: 'rgba(56, 189, 248, 0.1)', title: "ZONE 2: MAGNETIC CORE" },
        { x: 380, y: 0, w: 200, h: 60, color: 'rgba(251, 191, 36, 0.1)', title: "ZONE 3: PRESS LINE" },
        { x: 700, y: 0, w: 100, h: 250, color: 'rgba(16, 185, 129, 0.1)', title: "ZONE 4: FARADAY FORGE" },
    ];

    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            zIndex: 10
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: DASHBOARD_THEME.colors.accents.cyan.base, fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                    FACILITY BLUEPRINT: U-SHAPED CONTINUOUS FLOW
                </div>
                <div style={{ fontSize: '0.75rem', color: DASHBOARD_THEME.colors.text.muted, display: 'flex', gap: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#10b981'}}></div> Completed</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: DASHBOARD_THEME.colors.accents.cyan.base}}></div> Active</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#475569'}}></div> Pending</span>
                </div>
            </div>

            <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                <svg viewBox="0 0 800 280" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                    {/* Zone Backgrounds */}
                    {zones.map((z, i) => (
                        <g key={`zone-${i}`}>
                            <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={z.color} rx="8" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                            <text x={z.x + 10} y={z.y + 20} fill="rgba(255,255,255,0.3)" fontSize="12" fontWeight="bold">{z.title}</text>
                        </g>
                    ))}

                    {/* Conveyor Belt Path */}
                    <path d={pathD} fill="none" stroke="#334155" strokeWidth="8" strokeOpacity="0.5" />
                    
                    {/* Active Track Overlay (Animated to current station) */}
                    {currentStation > 1 && (
                        <path 
                            d={pathD} 
                            fill="none" 
                            stroke={DASHBOARD_THEME.colors.accents.cyan.base} 
                            strokeWidth="4" 
                            strokeDasharray="4 4"
                            style={{ animation: 'flowAnim 2s linear infinite' }} 
                            strokeDashoffset={1000 - (currentStation * 150)}
                            pathLength="1000"
                        />
                    )}

                    {/* Station Nodes */}
                    {stations.map(st => {
                        const isActive = currentStation === st.id;
                        const isDone = stationComplete[st.id];
                        let color = '#475569'; // default
                        if (isActive) color = DASHBOARD_THEME.colors.accents.cyan.base;
                        if (isDone) color = '#10b981';

                        return (
                            <g key={`st-${st.id}`} transform={`translate(${st.cx}, ${st.cy})`}>
                                {/* Pulse Effect for Active */}
                                {isActive && (
                                    <circle cx="0" cy="0" r="20" fill={color} opacity="0.2" style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                                )}
                                <circle cx="0" cy="0" r="14" fill="#0f172a" stroke={color} strokeWidth="3" />
                                <text x="0" y="4" fill={color} fontSize="12" fontWeight="bold" textAnchor="middle">{st.id}</text>
                                
                                <text 
                                    x={st.cx > 400 ? -25 : 25} 
                                    y="4" 
                                    fill={isActive ? '#fff' : DASHBOARD_THEME.colors.text.muted} 
                                    fontSize="12" 
                                    fontWeight="bold" 
                                    textAnchor={st.cx > 400 ? "end" : "start"}
                                    style={{ filter: isActive ? `drop-shadow(0 0 5px ${color})` : 'none' }}
                                >
                                    {st.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
            
            <style>
            {`
                @keyframes flowAnim {
                    to { stroke-dashoffset: 0; }
                }
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `}
            </style>
        </div>
    );
};

export const AuricBatteryBuilder = () => {
    const [currentStation, setCurrentStation] = useState<FactoryStation>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stationComplete, setStationComplete] = useState<Record<number, boolean>>({});

    const activeData = STATION_DATA[currentStation];

    useEffect(() => {
        if (!isProcessing) return;

        setProgress(0);
        const duration = currentStation === 6 ? 2500 : 2000; // EMP blast takes 2.5s, others 2s
        const intervalTime = 50;
        const steps = duration / intervalTime;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            setProgress((currentStep / steps) * 100);
            if (currentStep >= steps) {
                clearInterval(timer);
                setIsProcessing(false);
                setStationComplete(prev => ({ ...prev, [currentStation]: true }));
            }
        }, intervalTime);

        return () => clearInterval(timer);
    }, [isProcessing, currentStation]);

    const handleRunProcess = () => {
        if (!isProcessing && !stationComplete[currentStation]) {
            setIsProcessing(true);
        }
    };

    const handleNextStation = () => {
        if (currentStation < 6 && stationComplete[currentStation]) {
            setCurrentStation((prev) => (prev + 1) as FactoryStation);
        }
    };

    const handlePrevStation = () => {
        if (currentStation > 1) {
            setCurrentStation((prev) => (prev - 1) as FactoryStation);
        }
    };

    // --- VISUALIZATION RENDERERS ---
    const renderMachineVisual = () => {
        // Base SVG styles
        const svgProps = { viewBox: "0 0 400 300", width: "100%", height: "100%" };
        const isDone = stationComplete[currentStation];
        const p = progress / 100;

        switch (currentStation) {
            case 1: // Planetary Disperser
                return (
                    <svg {...svgProps}>
                        <defs>
                            <linearGradient id="slurryGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1e293b" />
                                <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>
                        </defs>
                        {/* Machine Outline */}
                        <path d="M 100 50 L 300 50 L 320 250 L 80 250 Z" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="2" strokeDasharray="4 4" />
                        <rect x="150" y="20" width="100" height="30" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="2" />
                        
                        {/* Slurry Fluid */}
                        <path d={`M 85 245 L 315 245 L ${315 - 10*p} ${245 - 150*p} Q 200 ${245 - 150*p + Math.sin(p*Math.PI*10)*10} ${85 + 10*p} ${245 - 150*p} Z`} fill="url(#slurryGrad)" opacity="0.8" />
                        
                        {/* Mixing Blades */}
                        <g transform={`translate(200, 150) rotate(${isProcessing ? p * 1440 : 0})`}>
                            <rect x="-10" y="-80" width="20" height="160" fill="none" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" />
                            <circle cx="0" cy="0" r="15" fill={DASHBOARD_THEME.colors.accents.cyan.base} />
                        </g>

                        {/* Coater Output */}
                        {isDone && <rect x="50" y="270" width="300" height="10" fill="#334155" />}
                    </svg>
                );
            case 2: // Ultrasonic Homogenizer & Nanorods
                return (
                    <svg {...svgProps}>
                        {/* Machine Outline */}
                        <rect x="180" y="20" width="40" height="100" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="2" />
                        <path d="M 170 120 L 230 120 L 210 200 L 190 200 Z" fill="none" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" />
                        <rect x="100" y="200" width="200" height="80" fill="#0f172a" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="1" />
                        
                        {/* Ultrasonic Waves */}
                        {isProcessing && Array.from({length: 5}).map((_, i) => (
                            <path key={i} d={`M ${180 - i*20*p} ${220 + i*10} Q 200 ${230 + Math.sin(p*Math.PI*20)*20} ${220 + i*20*p} ${220 + i*10}`} fill="none" stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="2" opacity={1 - p} />
                        ))}

                        {/* Gold Nanorods */}
                        {Array.from({length: 40}).map((_, i) => {
                            const show = isDone || (isProcessing && p > i/40);
                            if (!show) return null;
                            const x = 120 + Math.random() * 160;
                            const y = 220 + Math.random() * 40;
                            const rot = Math.random() * 360;
                            return (
                                <rect key={i} x={x} y={y} width="8" height="2" fill="#fbbf24" transform={`rotate(${rot} ${x} ${y})`} style={{ filter: 'drop-shadow(0 0 2px #fbbf24)' }} />
                            );
                        })}
                    </svg>
                );
            case 3: // Helmholtz Coils & Alignment
                const nodes = [];
                for(let r=0; r<4; r++) {
                    for(let c=0; c<4; c++) {
                        nodes.push({ x: 140 + c*40, y: 90 + r*40 });
                    }
                }
                return (
                    <svg {...svgProps}>
                        {/* Coil Left & Right */}
                        <circle cx="80" cy="150" r="60" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="8" strokeDasharray="10 5" transform={`rotate(${isProcessing ? p*360 : 0} 80 150)`} />
                        <circle cx="320" cy="150" r="60" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="8" strokeDasharray="10 5" transform={`rotate(${isProcessing ? -p*360 : 0} 320 150)`} />
                        
                        {/* Magnetic Field Lines */}
                        {isProcessing && Array.from({length: 7}).map((_, i) => (
                            <line key={i} x1="140" y1={60 + i*30} x2="260" y2={60 + i*30} stroke={DASHBOARD_THEME.colors.accents.cyan.base} strokeWidth="1" strokeDasharray="5 5" opacity={0.5 + Math.sin(p*Math.PI*10)*0.5} />
                        ))}

                        {/* Foil & Lattice */}
                        <rect x="120" y="70" width="160" height="160" fill="#0f172a" />
                        {nodes.map((n, i) => {
                            const isAligned = isDone || (isProcessing && p > 0.5);
                            const xOffset = isAligned ? 0 : (Math.random()-0.5)*20;
                            const yOffset = isAligned ? 0 : (Math.random()-0.5)*20;
                            const rot = isAligned ? 45 : Math.random() * 180;
                            const color = isAligned ? '#fbbf24' : '#94a3b8';
                            return (
                                <g key={i} transform={`translate(${n.x + xOffset}, ${n.y + yOffset}) rotate(${rot})`} style={{ transition: 'all 0.5s', filter: isAligned ? 'drop-shadow(0 0 4px #fbbf24)' : 'none' }}>
                                    <rect x="-10" y="-2" width="20" height="4" fill={color} />
                                    <rect x="-2" y="-10" width="4" height="20" fill={color} />
                                </g>
                            )
                        })}
                    </svg>
                );
            case 4: // Calendering & Stacking
                return (
                    <svg {...svgProps}>
                        {/* Calendering Rollers */}
                        <circle cx="100" cy="100" r="40" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="4" transform={`rotate(${isProcessing ? p*720 : 0} 100 100)`} />
                        <circle cx="100" cy="184" r="40" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="4" transform={`rotate(${isProcessing ? -p*720 : 0} 100 184)`} />
                        
                        {/* Foil passing through */}
                        <path d="M 20 142 L 100 142 L 180 142" fill="none" stroke="#fbbf24" strokeWidth="8" />
                        
                        {/* Z-Fold Stacker */}
                        <rect x="220" y="50" width="120" height="200" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="2" strokeDasharray="4 4" />
                        
                        {/* Stack buildup */}
                        {isProcessing && (
                            <path d={`M 180 142 Q 220 142 240 ${230 - p*150}`} fill="none" stroke="#fbbf24" strokeWidth="4" />
                        )}
                        
                        <g transform="translate(260, 240)">
                            {Array.from({length: 15}).map((_, i) => {
                                const show = isDone || (isProcessing && p > i/15);
                                if (!show) return null;
                                return <rect key={i} x="-30" y={-i*10} width="60" height="8" fill="#fbbf24" rx="2" />;
                            })}
                        </g>
                    </svg>
                );
            case 5: // Faraday Sealing (Laser & PVD)
                return (
                    <svg {...svgProps}>
                        {/* PVD Chamber */}
                        <path d="M 80 40 L 320 40 L 320 280 L 80 280 Z" fill="none" stroke={DASHBOARD_THEME.colors.text.muted} strokeWidth="4" strokeLinejoin="round" />
                        
                        {/* Internal Battery Unit */}
                        <rect x="140" y="100" width="120" height="150" fill="#1e293b" rx="8" />
                        
                        {/* Laser Welding (0-50%) */}
                        {isProcessing && p < 0.5 && (
                            <g>
                                <path d="M 200 40 L 200 100" fill="none" stroke="#ef4444" strokeWidth="3" style={{ opacity: 0.5 + Math.sin(p*Math.PI*40)*0.5 }} />
                                <circle cx={140 + (p*2)*120} cy="100" r="5" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 10px #ef4444)' }} />
                            </g>
                        )}
                        
                        {/* Gold Sputtering (50-100%) */}
                        {isProcessing && p >= 0.5 && (
                            <g>
                                {Array.from({length: 30}).map((_, i) => (
                                    <circle key={i} cx={100 + Math.random()*200} cy={50 + Math.random()*200} r="2" fill="#fbbf24" opacity={Math.random()} />
                                ))}
                            </g>
                        )}

                        {/* Final Gold Plated Unit */}
                        {(isDone || (isProcessing && p >= 0.5)) && (
                            <rect x="136" y="96" width="128" height="158" fill="none" stroke="#fbbf24" strokeWidth={isDone ? "8" : `${(p-0.5)*2 * 8}`} rx="10" style={{ filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.4))' }} />
                        )}
                    </svg>
                );
            case 6: // EMP Simulator
                return (
                    <svg {...svgProps}>
                        {/* The Gold Battery */}
                        <rect x="140" y="80" width="120" height="160" fill="#0f172a" stroke="#fbbf24" strokeWidth="8" rx="8" style={{ filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.6))' }} />
                        <text x="200" y="150" fill="#fbbf24" fontSize="24" fontWeight="bold" textAnchor="middle">100%</text>
                        <text x="200" y="180" fill="#fbbf24" fontSize="12" textAnchor="middle">AURIC SHIELD</text>

                        {/* EMP Blast */}
                        {isProcessing && (
                            <g>
                                {/* Expanding shockwave */}
                                <circle cx="200" cy="150" r={p * 300} fill="none" stroke="#ef4444" strokeWidth={10 * (1-p)} opacity={1-p} />
                                
                                {/* Lightning deflecting */}
                                {Array.from({length: 12}).map((_, i) => {
                                    const angle = Math.random() * Math.PI * 2;
                                    const r1 = 150;
                                    const r2 = 250;
                                    return (
                                        <path 
                                            key={i}
                                            d={`M ${200 + Math.cos(angle)*r1} ${150 + Math.sin(angle)*r1} Q ${200 + Math.cos(angle+0.5)*(r1+r2)/2} ${150 + Math.sin(angle+0.5)*(r1+r2)/2} ${200 + Math.cos(angle)*r2} ${150 + Math.sin(angle)*r2}`}
                                            stroke={Math.random() > 0.5 ? '#ef4444' : '#ffffff'}
                                            strokeWidth="3"
                                            fill="none"
                                            style={{ filter: 'drop-shadow(0 0 10px #ef4444)' }}
                                            opacity={1-p}
                                        />
                                    )
                                })}
                            </g>
                        )}
                        {isDone && (
                            <text x="200" y="280" fill="#10b981" fontSize="16" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0 0 5px #10b981)' }}>TEST PASSED: CORE STABLE</text>
                        )}
                    </svg>
                );
            default: return null;
        }
    };

    return (
        <div style={{
            padding: '2rem',
            background: DASHBOARD_THEME.colors.background,
            borderRadius: '24px',
            border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
            color: DASHBOARD_THEME.colors.text.secondary,
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '700px'
        }}>
            
            {/* EMP Screen Flash Effect */}
            {currentStation === 6 && isProcessing && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.9)',
                    zIndex: 100,
                    pointerEvents: 'none',
                    animation: 'empFlash 2.5s ease-out forwards'
                }} />
            )}
            
            <style>
            {`
                @keyframes empFlash {
                    0% { opacity: 1; }
                    10% { opacity: 0.8; }
                    15% { opacity: 1; background: rgba(56, 189, 248, 0.4); }
                    100% { opacity: 0; }
                }
            `}
            </style>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div>
                    <h2 style={{ 
                        margin: 0, 
                        fontSize: '1.5rem', 
                        fontWeight: 600, 
                        color: DASHBOARD_THEME.colors.text.primary,
                        letterSpacing: '0.05em'
                    }}>
                        AURIC-LATTICE FACTORY FLOOR
                    </h2>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
                        Industrial Manufacturing & Assembly Line
                    </p>
                </div>
                
                {/* Station Progress Tracker */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {[1,2,3,4,5,6].map((st) => (
                        <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                fontSize: '0.8rem', fontWeight: 'bold',
                                background: currentStation === st ? DASHBOARD_THEME.colors.accents.cyan.base : (stationComplete[st] ? '#10b981' : '#e2e8f0'),
                                color: currentStation === st || stationComplete[st] ? '#fff' : '#94a3b8',
                                transition: 'all 0.3s'
                            }}>
                                {st}
                            </div>
                            {st < 6 && <div style={{ width: '20px', height: '2px', background: stationComplete[st] ? '#10b981' : '#e2e8f0' }} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* FACTORY BLUEPRINT / LOGISTICS (Hidden per user request, too small)
            <FactoryFloorPlan currentStation={currentStation} stationComplete={stationComplete} />
            */}

            {/* MAIN FACTORY STAGE SPLIT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '2rem', flex: 1, zIndex: 10 }}>
                
                {/* LEFT: INSTRUCTIONS & CONTROLS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '2rem',
                        border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{ color: DASHBOARD_THEME.colors.accents.cyan.base, fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
                            CURRENT STATION
                        </div>
                        <h3 style={{ margin: '0 0 1.5rem 0', color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.4rem' }}>
                            {activeData.title}
                        </h3>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: DASHBOARD_THEME.colors.text.muted, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Equipment Type</div>
                            <div style={{ padding: '0.5rem 0.75rem', background: '#0f172a', borderRadius: '8px', borderLeft: `4px solid #fbbf24`, color: '#fff', fontWeight: 'bold', marginBottom: '1rem' }}>
                                {activeData.equipmentType}
                            </div>

                            <div style={{ fontSize: '0.85rem', color: DASHBOARD_THEME.colors.text.muted, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Machinery Outline</div>
                            <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px', borderLeft: `4px solid ${DASHBOARD_THEME.colors.accents.cyan.base}`, fontFamily: 'monospace', color: DASHBOARD_THEME.colors.text.secondary }}>
                                {activeData.machine}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.85rem', color: DASHBOARD_THEME.colors.text.muted, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Operational Instructions</div>
                            <p style={{ margin: 0, lineHeight: 1.6, color: DASHBOARD_THEME.colors.text.secondary }}>
                                {activeData.instruction}
                            </p>
                        </div>
                        
                        <div style={{ flex: 1 }} />
                        
                        {/* Process Execution Button */}
                        <div style={{ marginTop: '2rem' }}>
                            {/* Progress bar overlay on button */}
                            <div style={{
                                width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '0.5rem', overflow: 'hidden'
                            }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: currentStation === 6 ? '#ef4444' : DASHBOARD_THEME.colors.accents.cyan.base, transition: 'width 0.1s linear' }} />
                            </div>
                            
                            <button 
                                onClick={handleRunProcess}
                                disabled={isProcessing || stationComplete[currentStation]}
                                style={{
                                    width: '100%',
                                    padding: '1.2rem',
                                    background: stationComplete[currentStation] ? '#10b981' : (currentStation === 6 ? '#ef4444' : DASHBOARD_THEME.colors.accents.cyan.base),
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    cursor: (isProcessing || stationComplete[currentStation]) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    letterSpacing: '0.05em',
                                    boxShadow: stationComplete[currentStation] ? 'none' : '0 4px 14px 0 rgba(8, 145, 178, 0.39)'
                                }}
                            >
                                {stationComplete[currentStation] ? 'PROCESS COMPLETED' : (isProcessing ? 'SYSTEM PROCESSING...' : activeData.actionLabel)}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={handlePrevStation}
                            disabled={currentStation === 1 || isProcessing}
                            style={{ flex: 1, padding: '1rem', background: 'transparent', border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, borderRadius: '8px', color: currentStation === 1 || isProcessing ? DASHBOARD_THEME.colors.text.muted : DASHBOARD_THEME.colors.text.primary, cursor: currentStation === 1 || isProcessing ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            ← PREVIOUS STATION
                        </button>
                        <button 
                            onClick={handleNextStation}
                            disabled={currentStation === 6 || !stationComplete[currentStation] || isProcessing}
                            style={{ flex: 1, padding: '1rem', background: currentStation === 6 || !stationComplete[currentStation] || isProcessing ? '#f1f5f9' : DASHBOARD_THEME.colors.text.primary, border: 'none', borderRadius: '8px', color: currentStation === 6 || !stationComplete[currentStation] || isProcessing ? DASHBOARD_THEME.colors.text.muted : '#fff', cursor: currentStation === 6 || !stationComplete[currentStation] || isProcessing ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            NEXT STATION →
                        </button>
                    </div>

                </div>

                {/* RIGHT: MACHINE VISUALIZER SCHEMATIC */}
                <div style={{
                    background: '#040b16', // Very dark for contrast
                    borderRadius: '16px',
                    border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
                }}>
                    
                    {/* Visualizer Header */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: DASHBOARD_THEME.colors.text.muted, fontSize: '0.8rem', fontFamily: 'monospace' }}>LIVE SCHEMATIC FEED</span>
                        <span style={{ color: isProcessing ? '#fbbf24' : '#10b981', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            ● {isProcessing ? 'ACTIVE' : 'STANDBY'}
                        </span>
                    </div>

                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        {renderMachineVisual()}
                    </div>

                </div>
            </div>
        </div>
    );
};
