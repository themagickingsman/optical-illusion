"use client";

import React, { useState, useRef } from "react";

export type OfficerData = {
    id: string;
    name: string;
    generation: number;
    role: string;
    age: number;
    serviceYears: number;
    maxLifespan: number;
    bondLevel: number;
    avatar: string;
    stats: { combat: number; mining: number; speed: number };
    mutations: string[];
    activeTraits: string[];
    passiveTraits: string[];
};

export const BOND_MATRIX_CREW: OfficerData[] = [
    {
        id: "off_alpha_001", name: "Cpt Adam", generation: 1, role: "Commander", age: 34, serviceYears: 17, maxLifespan: 110, bondLevel: 10,
        avatar: "/game_assets/avatars/v1/cmdr_chad_8bit.png", stats: { combat: 15, mining: 8, speed: 10 }, mutations: ["Enduring Cells"],
        activeTraits: ["Growth", "Oxygen Binding", "Energy"],
        passiveTraits: ["Pathogen", "Immune", "Signaling"]
    },
    {
        id: "off_omega_001", name: "Sci Eve", generation: 1, role: "Science", age: 28, serviceYears: 11, maxLifespan: 125, bondLevel: 8,
        avatar: "/api/avatar?name=eve", stats: { combat: 6, mining: 18, speed: 7 }, mutations: ["Harmonic Sight"],
        activeTraits: ["DNA / RNA", "Neural", "Signaling"],
        passiveTraits: ["Oncogene", "Stress / HSP", "Growth"]
    },
    {
        id: "off_omega_002", name: "Cmdr Tubman", generation: 1, role: "Commander", age: 48, serviceYears: 22, maxLifespan: 110, bondLevel: 15,
        avatar: "/api/avatar?name=harriet", stats: { combat: 22, mining: 5, speed: 12 }, mutations: ["Stellar Endurance"],
        activeTraits: ["Immune", "Energy", "Pathogen"],
        passiveTraits: ["Structural", "DNA / RNA", "Growth"]
    },
    {
        id: "off_alpha_003", name: "Eng Hines", generation: 1, role: "Engineer", age: 39, serviceYears: 15, maxLifespan: 120, bondLevel: 9,
        avatar: "/api/avatar?name=gregory", stats: { combat: 8, mining: 15, speed: 20 }, mutations: [],
        activeTraits: ["Structural", "Neural", "Stress / HSP"],
        passiveTraits: ["Oxygen Binding", "Oncogene", "Signaling"]
    },
    {
        id: "off_omega_004", name: "Sci Scott", generation: 1, role: "Science", age: 36, serviceYears: 10, maxLifespan: 140, bondLevel: 12,
        avatar: "/api/avatar?name=jill", stats: { combat: 4, mining: 25, speed: 5 }, mutations: ["Quantum Empathy"],
        activeTraits: ["Neural", "DNA / RNA", "Immune"],
        passiveTraits: ["Growth", "Oxygen Binding", "Pathogen"]
    },
    {
        id: "off_alien_005", name: "Qck Howard", generation: 1, role: "Quartermaster", age: 42, serviceYears: 12, maxLifespan: 150, bondLevel: 5,
        avatar: "/api/avatar?name=howard", stats: { combat: 10, mining: 10, speed: 10 }, mutations: ["Avian Reflexes"],
        activeTraits: ["Oncogene", "Energy", "Structural"],
        passiveTraits: ["Stress / HSP", "Signaling", "Immune"]
    },
    {
        id: "off_synth_006", name: "K-1", generation: 1, role: "Security", age: 5, serviceYears: 5, maxLifespan: 500, bondLevel: 2,
        avatar: "/api/avatar-local?id=avatar_k1_android_officer_1774594491530.png", stats: { combat: 25, mining: 2, speed: 8 }, mutations: ["Synthetic Frame"],
        activeTraits: ["Structural", "Stress / HSP", "Energy"],
        passiveTraits: ["Pathogen", "Oncogene", "Oxygen Binding"]
    },
    {
        id: "off_wiz_007", name: "Crow", generation: 1, role: "Science", age: 31, serviceYears: 3, maxLifespan: 120, bondLevel: 18,
        avatar: "/api/avatar-local?id=avatar_wiz_scarecrow_officer_1774594510954.png", stats: { combat: 5, mining: 12, speed: 15 }, mutations: ["Cybernetic Patchwork"],
        activeTraits: ["Neural", "Signaling", "DNA / RNA"],
        passiveTraits: ["Growth", "Immune", "Oncogene"]
    },
    {
        id: "off_trk_008", name: "Billy", generation: 1, role: "Commander", age: 38, serviceYears: 14, maxLifespan: 100, bondLevel: 14,
        avatar: "/api/avatar-local?id=avatar_predator_tracker_officer_1774594528155.png", stats: { combat: 20, mining: 15, speed: 18 }, mutations: ["Primal Instincts"],
        activeTraits: ["Growth", "Pathogen", "Immune"],
        passiveTraits: ["Stress / HSP", "Structural", "Oxygen Binding"]
    },
    {
        id: "off_psion_010", name: "Nova", generation: 1, role: "Navigator", age: 104, serviceYears: 80, maxLifespan: 1000, bondLevel: 25,
        avatar: "/api/avatar-local?id=avatar_off_psion_010_1774595743413.png", stats: { combat: 10, mining: 5, speed: 25 }, mutations: ["Psionic Wake"],
        activeTraits: ["DNA / RNA", "Energy", "Signaling"],
        passiveTraits: ["Neural", "Oncogene", "Oxygen Binding"]
    },
    {
        id: "off_rept_011", name: "Rex", generation: 1, role: "Heavy Trooper", age: 54, serviceYears: 20, maxLifespan: 130, bondLevel: 15,
        avatar: "/api/avatar-local?id=avatar_off_rept_011_1774595760340.png", stats: { combat: 30, mining: 20, speed: 2 }, mutations: ["Saurian Plating"],
        activeTraits: ["Structural", "Stress / HSP", "Pathogen"],
        passiveTraits: ["Growth", "Immune", "Energy"]
    },
    {
        id: "off_mech_012", name: "Axel", generation: 1, role: "Mechanic", age: 34, serviceYears: 16, maxLifespan: 100, bondLevel: 12,
        avatar: "/api/avatar-local?id=avatar_off_mech_012_1774595797669.png", stats: { combat: 15, mining: 25, speed: 10 }, mutations: ["Grease Monkey"],
        activeTraits: ["Neural", "Energy", "Oncogene"],
        passiveTraits: ["DNA / RNA", "Signaling", "Stress / HSP"]
    },
    {
        id: "off_v2_013", name: "Valkyrie", generation: 2, role: "Assault Lead", age: 29, serviceYears: 8, maxLifespan: 120, bondLevel: 30,
        avatar: "/game_assets/avatars/v2/Gemini_Generated_Image_211xp3211xp3211x.jpeg", stats: { combat: 35, mining: 5, speed: 15 }, mutations: ["Adrenal Spike"],
        activeTraits: ["Growth", "Oxygen Binding", "Immune"],
        passiveTraits: ["Structural", "Energy", "Pathogen"]
    },
    {
        id: "off_v2_014", name: "Drudge", generation: 2, role: "Deep Miner", age: 41, serviceYears: 20, maxLifespan: 90, bondLevel: 22,
        avatar: "/game_assets/avatars/v2/Gemini_Generated_Image_g01z6pg01z6pg01z.jpeg", stats: { combat: 10, mining: 35, speed: 5 }, mutations: ["Silicon Lungs"],
        activeTraits: ["Structural", "Stress / HSP", "Oncogene"],
        passiveTraits: ["Neural", "DNA / RNA", "Energy"]
    },
    {
        id: "off_v2_015", name: "Zephyr", generation: 2, role: "Recon Pilot", age: 24, serviceYears: 4, maxLifespan: 140, bondLevel: 28,
        avatar: "/game_assets/avatars/v2/Gemini_Generated_Image_gjo9hcgjo9hcgjo9.jpeg", stats: { combat: 12, mining: 8, speed: 30 }, mutations: ["Hollow Bones"],
        activeTraits: ["Signaling", "Neural", "Oxygen Binding"],
        passiveTraits: ["Growth", "Immune", "Stress / HSP"]
    },
    {
        id: "off_v2_016", name: "Goliath", generation: 2, role: "Siege Master", age: 52, serviceYears: 30, maxLifespan: 150, bondLevel: 15,
        avatar: "/game_assets/avatars/v2/Gemini_Generated_Image_he6ghghe6ghghe6g.jpeg", stats: { combat: 45, mining: 10, speed: 2 }, mutations: ["Titan Frame"],
        activeTraits: ["Structural", "Energy", "Oncogene"],
        passiveTraits: ["DNA / RNA", "Growth", "Signaling"]
    },
    {
        id: "off_v2_017", name: "Echo", generation: 2, role: "Infiltrator", age: 31, serviceYears: 12, maxLifespan: 110, bondLevel: 35,
        avatar: "/game_assets/avatars/v2/Gemini_Generated_Image_i7uy7ri7uy7ri7uy.jpeg", stats: { combat: 20, mining: 5, speed: 35 }, mutations: ["Chameleon Skin"],
        activeTraits: ["Neural", "Pathogen", "DNA / RNA"],
        passiveTraits: ["Signaling", "Immune", "Stress / HSP"]
    },
    {
        id: "off_v2_018", name: "Quarry", generation: 2, role: "Extraction Spec", age: 38, serviceYears: 18, maxLifespan: 100, bondLevel: 20,
        avatar: "/game_assets/avatars/v2/Gemini_Generated_Image_qkx7osqkx7osqkx7.jpeg", stats: { combat: 8, mining: 45, speed: 4 }, mutations: ["Crystal Vision"],
        activeTraits: ["Stress / HSP", "Structural", "Energy"],
        passiveTraits: ["Oncogene", "Oxygen Binding", "Neural"]
    },
    {
        id: "off_v2_019", name: "Nexus", generation: 2, role: "Fleet Admiral", age: 60, serviceYears: 40, maxLifespan: 200, bondLevel: 40,
        avatar: "/game_assets/avatars/v2/Gemini_Generated_Image_r2hqhyr2hqhyr2hq.jpeg", stats: { combat: 25, mining: 25, speed: 25 }, mutations: ["Synaptic Link"],
        activeTraits: ["Signaling", "Energy", "DNA / RNA"],
        passiveTraits: ["Neural", "Structural", "Growth"]
    }
];

export const SHIP_CLASSES: Record<number, { name: string, level: number, baseStats: { combat: number, mining: number, speed: number, cargo: number, evasion: number } }> = {
    3: { name: 'Scout Class', level: 1, baseStats: { combat: 50, mining: 20, speed: 200, evasion: 150, cargo: 100 } },
    4: { name: 'Frigate Vanguard', level: 2, baseStats: { combat: 100, mining: 50, speed: 150, evasion: 100, cargo: 250 } },
    5: { name: 'Science Vessel', level: 3, baseStats: { combat: 80, mining: 120, speed: 120, evasion: 180, cargo: 300 } },
    6: { name: 'Core Cruiser', level: 4, baseStats: { combat: 250, mining: 80, speed: 100, evasion: 80, cargo: 500 } },
    8: { name: 'Heavy Dreadnought', level: 5, baseStats: { combat: 400, mining: 300, speed: 50, evasion: 30, cargo: 2000 } },
    12: { name: 'Council Flagship', level: 6, baseStats: { combat: 1000, mining: 800, speed: 80, evasion: 100, cargo: 5000 } }
};

export const ConcentricBondNetwork = ({ 
    crew, 
    activeRoster, 
    selectedNode, 
    onSelectNode,
    onSwap,
    onShowRules,
    moldSize,
    setMoldSize,
    onClose
}: { 
    crew: OfficerData[], 
    activeRoster: string[], 
    selectedNode: string | null, 
    onSelectNode: (id: string) => void,
    onSwap: (targetActiveId: string, draggedReserveId: string) => void,
    onShowRules: () => void,
    moldSize: number,
    setMoldSize: (size: number) => void,
    onClose: () => void
}) => {
    const center = { x: 960, y: 540 };
    const innerRadius = 380;

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragPos, setDragPos] = useState<{x: number, y: number} | null>(null);
    const [hoverZoneId, setHoverZoneId] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const activeNodes = activeRoster.map((id, i) => {
        const officer = crew.find(c => c.id === id);
        const angle = (i * (360 / moldSize) - 90) * (Math.PI / 180);
        return {
            ...officer!,
            x: center.x + innerRadius * Math.cos(angle),
            y: center.y + innerRadius * Math.sin(angle),
            isActive: true
        };
    });

    const handlePointerDown = (e: React.PointerEvent, id: string) => {
        if (!svgRef.current) return;
        (e.target as Element).setPointerCapture(e.pointerId);
        setDraggingId(id);
        
        const CTM = svgRef.current.getScreenCTM();
        if (CTM) {
            setDragPos({
                x: (e.clientX - CTM.e) / CTM.a,
                y: (e.clientY - CTM.f) / CTM.d
            });
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggingId || !svgRef.current) return;
        const CTM = svgRef.current.getScreenCTM();
        if (!CTM) return;
        
        const x = (e.clientX - CTM.e) / CTM.a;
        const y = (e.clientY - CTM.f) / CTM.d;
        setDragPos({ x, y });

        let foundZone = null;
        for (const target of activeNodes) {
             const dx = target.x - x;
             const dy = target.y - y;
             if (Math.sqrt(dx*dx + dy*dy) < 140) {
                 foundZone = target.id;
                 break;
             }
        }
        setHoverZoneId(foundZone);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (draggingId && hoverZoneId) {
            onSwap(hoverZoneId, draggingId);
        }
        setDraggingId(null);
        setDragPos(null);
        setHoverZoneId(null);
    };

    const edges: any[] = [];
    for (let i = 0; i < activeNodes.length; i++) {
        for (let j = i + 1; j < activeNodes.length; j++) {
            let sharedTraits = 0;
            const allI = [...(activeNodes[i].activeTraits || []), ...(activeNodes[i].passiveTraits || [])];
            const allJ = [...(activeNodes[j].activeTraits || []), ...(activeNodes[j].passiveTraits || [])];
            allI.forEach(t => { if (allJ.includes(t)) sharedTraits++; });
            if (sharedTraits > 0) edges.push({ source: activeNodes[i], target: activeNodes[j], strength: sharedTraits });
        }
    }

    const formations = [
        { size: 3, label: 'Triangle' },
        { size: 4, label: 'Square' },
        { size: 5, label: 'Pentagram' },
        { size: 6, label: 'Hexagon' },
        { size: 8, label: 'Cube' },
        { size: 12, label: 'Dodecahedron' }
    ];

    const getPrimaryStatBadge = (stats?: { combat: number; mining: number; speed: number }) => {
        if (!stats) return null;
        const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
        const max = sorted[0];
        if (max[0] === 'combat') return { label: 'ATK', val: max[1], color: '#f43f5e' };
        if (max[0] === 'mining') return { label: 'MIN', val: max[1], color: '#eab308' };
        return { label: 'SPD', val: max[1], color: '#38bdf8' };
    };

    // Compute Modifiers
    const shipClass = SHIP_CLASSES[moldSize];
    const crewCombat = activeNodes.reduce((sum, n) => sum + (n.stats?.combat || 0), 0);
    const crewMining = activeNodes.reduce((sum, n) => sum + (n.stats?.mining || 0), 0);
    const crewSpeed = activeNodes.reduce((sum, n) => sum + (n.stats?.speed || 0), 0);
    const strongBonds = edges.filter(e => e.strength > 1).length;
    const synergyPct = strongBonds * 5; // +5% total output per strong structural bond
    const multi = 1 + (synergyPct / 100);

    return (
        <div 
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#020c10', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid rgba(20,184,166,0.18)', backgroundColor: '#050f14' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        ← EXIT DECK BUILDER
                    </button>
                    <h3 style={{ margin: '0', color: '#5eead4', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.2rem', fontWeight: 800 }}>Concentric Astrolabe</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {formations.map(f => (
                            <button key={f.size} onClick={() => setMoldSize(f.size)} style={{ background: moldSize === f.size ? '#14b8a6' : 'transparent', color: moldSize === f.size ? '#000' : '#14b8a6', border: '1px solid #14b8a6', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                {f.label} ({f.size})
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={onShowRules} style={{ background: '#e879f9', color: '#000', border: 'none', borderRadius: '4px', padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 10px rgba(232, 121, 249, 0.4)' }}>
                    DESIGN RULES
                </button>
            </div>
            
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                
                {/* LEFT PANEL: OFFICERS (3 COLUMNS) */}
                <div style={{ width: '460px', padding: '1.5rem', backgroundColor: '#050f14', borderRight: '1px solid rgba(20,184,166,0.18)', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', justifyItems: 'center' }}>
                        {crew.map(node => {
                            const isSlotted = activeRoster.includes(node.id);
                            const isDragging = draggingId === node.id;
                            const badge = getPrimaryStatBadge(node.stats);
                            
                            return (
                                <div 
                                    key={`html-wrap-${node.id}`} 
                                    style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        gap: '0.8rem', 
                                        opacity: isSlotted ? 0.3 : (isDragging ? 0 : 1) 
                                    }}
                                >
                                    <div 
                                        onPointerDown={isSlotted ? undefined : (e) => handlePointerDown(e, node.id)}
                                        style={{ 
                                            width: '120px', 
                                            height: '120px',
                                            borderRadius: '50%',
                                            border: `4px solid ${isSlotted ? '#475569' : '#fbbf24'}`,
                                            backgroundImage: `url(${node.avatar})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            boxShadow: isSlotted ? 'none' : '0 0 20px rgba(251,191,36,0.2)',
                                            position: 'relative',
                                            cursor: isSlotted ? 'not-allowed' : 'grab',
                                            flexShrink: 0,
                                            touchAction: 'none'
                                        }}
                                    >
                                        {badge && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-14px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: '#0f172a',
                                                border: `2px solid ${badge.color}`,
                                                color: badge.color,
                                                borderRadius: '16px',
                                                padding: '4px 16px',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                +{badge.val} {badge.label}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textAlign: 'center' }}>
                                        {node.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT PANEL: ASTROLABE + BOTTOM STATS HUD */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#020c10', minWidth: 0 }}>
                    
                    {/* ASTROLABE SVG */}
                    <div style={{ flex: 1, position: 'relative', minHeight: '50vh', zIndex: 10 }}>
                        <svg 
                            ref={svgRef}
                            width="100%" 
                            height="100%"
                            viewBox="0 0 1920 1080"
                            preserveAspectRatio="xMidYMid slice"
                            style={{ display: 'block', touchAction: 'none', overflow: 'visible' }}
                        >
                            <defs>
                                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                                </radialGradient>
                                <clipPath id="circleClip">
                                    <circle cx="0" cy="0" r="120" />
                                </clipPath>
                                <clipPath id="circleClipDrag">
                                    <circle cx="0" cy="0" r="140" />
                                </clipPath>
                                <clipPath id="circleClipGhost">
                                    <circle cx="0" cy="0" r="80" />
                                </clipPath>
                            </defs>

                            <circle cx={center.x} cy={center.y} r={innerRadius} fill="none" stroke="#1e293b" strokeWidth="6" strokeDasharray="15 20" />

                            {edges.map((edge, idx) => {
                                const isStrong = edge.strength > 1;
                                let stroke = isStrong ? '#e879f9' : '#14b8a6';
                                let opacity = isStrong ? 0.6 : 0.3;
                                let isActive = false;

                                if (selectedNode && (edge.source.id === selectedNode || edge.target.id === selectedNode)) {
                                    stroke = '#4ade80'; opacity = 0.9; isActive = true;
                                } else if (selectedNode) {
                                    opacity = 0.05;
                                }

                                return (
                                    <line key={`edge-${idx}`} x1={edge.source.x} y1={edge.source.y} x2={edge.target.x} y2={edge.target.y} stroke={stroke} strokeWidth={isStrong || isActive ? 12 : 4} opacity={opacity} strokeDasharray={isStrong && !isActive ? "none" : (isActive ? "none" : "12 10")} style={{ transition: 'all 0.3s ease' }} />
                                );
                            })}

                            {/* Draw Active Formation Slots */}
                            {activeNodes.map(node => {
                                const isDragging = draggingId === node.id;
                                const isHoveredZone = hoverZoneId === node.id;
                                const badge = getPrimaryStatBadge(node.stats);
                                return (
                                    <g 
                                        key={`active-${node.id}`} 
                                        transform={`translate(${node.x},${node.y})`} 
                                        onPointerDown={(e) => handlePointerDown(e, node.id)}
                                        style={{ cursor: 'grab' }}
                                    >
                                        {isHoveredZone && <circle r="180" fill="#e879f9" opacity="0.3" style={{ animation: 'spin 5s linear infinite' }} />}
                                        
                                        <g opacity={isDragging ? 0 : 1}>
                                            <circle r="150" fill="url(#nodeGlow)" />
                                            <circle r="120" fill="#0f172a" stroke="#1e293b" strokeWidth="6" />
                                            <image href={node.avatar} x="-120" y="-120" width="240" height="240" clipPath="url(#circleClip)" opacity={0.9} />
                                            <circle r="120" fill="none" stroke="#14b8a6" strokeWidth="6" opacity={0.5} />
                                            {badge && (
                                                <g transform="translate(0, 140)">
                                                    <rect x="-90" y="-20" width="180" height="40" rx="20" fill="#0f172a" stroke={badge.color} strokeWidth="3" />
                                                    <text x="0" y="6" fill={badge.color} fontSize="20" fontWeight="bold" textAnchor="middle">+{badge.val} {badge.label}</text>
                                                </g>
                                            )}
                                            <text x="0" y="-140" fill="#e2e8f0" fontSize="24" fontWeight="bold" textAnchor="middle" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8)' }}>
                                                {node.name}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}

                            <g transform={`translate(${center.x}, ${center.y})`} style={{ cursor: 'pointer' }}>
                                <circle r="100" fill="#3b0764" stroke="#c026d3" strokeWidth="6" />
                                <text x="0" y="-8" fill="#e879f9" fontSize="28" fontWeight="bold" textAnchor="middle">ASSIGN</text>
                                <text x="0" y="24" fill="#fbbf24" fontSize="22" textAnchor="middle">FLEET</text>
                            </g>

                            {/* Elastic Dragged Element */}
                            {draggingId && dragPos && (
                                <g transform={`translate(${dragPos.x}, ${dragPos.y}) scale(1.15)`} style={{ pointerEvents: 'none', filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.8))' }}>
                                    <circle r="100" fill="url(#nodeGlow)" />
                                    <image href={crew.find(c => c.id === draggingId)?.avatar} x="-80" y="-80" width="160" height="160" clipPath="url(#circleClipGhost)" />
                                    <circle r="80" fill="none" stroke="#4ade80" strokeWidth="6" />
                                </g>
                            )}
                        </svg>

                        {/* Hovering Stat Legend */}
                        <div style={{ 
                            position: 'absolute', top: '50%', left: '2rem', transform: 'translateY(-50%)', 
                            display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(2,12,16,0.85)', 
                            padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(30,41,59,0.6)', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 20, backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#f43f5e', fontWeight: 'bold', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }} /> RED = COMBAT
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#eab308', fontWeight: 'bold', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#eab308', boxShadow: '0 0 8px #eab308' }} /> YELLOW = MINING
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#38bdf8', fontWeight: 'bold', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} /> BLUE = SPEED
                            </div>
                        </div>

                    </div>

                    {/* BOTTOM PANEL: STATE/STATS HUD (Horizontal Stack) */}
                    <div style={{ 
                        flexShrink: 0, padding: '2rem 3rem', 
                        borderTop: '1px solid rgba(20,184,166,0.18)', 
                        background: 'linear-gradient(to top, rgba(2,12,16,1) 80%, rgba(2,12,16,0.8))',
                        display: 'flex', gap: '3rem', alignItems: 'center',
                        zIndex: 5
                    }}>
                        
                        {/* Title & Constraints */}
                        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Level {shipClass.level} Mold</div>
                                <h2 style={{ color: '#38bdf8', margin: 0, fontSize: '1.6rem' }}>{shipClass.name}</h2>
                                <div style={{ marginTop: '0.4rem', color: '#e879f9', fontWeight: 'bold', fontSize: '0.85rem' }}>+{synergyPct}% Structural Resonance</div>
                            </div>
                            
                            <div style={{ background: 'rgba(15,23,42,0.6)', padding: '0.8rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Utility Chassis Constraints</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
                                    <span>Cargo: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{shipClass.baseStats.cargo}k</span></span>
                                    <span>Evade: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{shipClass.baseStats.evasion}</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Stat Bars Horizontal Distribution */}
                        <div style={{ flex: 1, display: 'flex', gap: '2rem' }}>
                            {[
                                { id: 'combat', label: 'Combat Output', base: shipClass.baseStats.combat, crew: crewCombat, color: '#f43f5e' },
                                { id: 'mining', label: 'Mining Efficiency', base: shipClass.baseStats.mining, crew: crewMining, color: '#eab308' },
                                { id: 'speed',  label: 'Thrust / Speed', base: shipClass.baseStats.speed, crew: crewSpeed, color: '#38bdf8' }
                            ].map(stat => {
                                const total = Math.floor((stat.base + stat.crew) * multi);
                                const maxScale = Math.max(stat.base * 2.5, 100);
                                const basePct = Math.min(100, (stat.base / maxScale) * 100);
                                const crewPct = Math.min(100 - basePct, ((stat.crew) / maxScale) * 100);
                                const multiPct = Math.min(100 - basePct - crewPct, (((stat.base + stat.crew) * (multi - 1)) / maxScale) * 100);

                                return (
                                    <div key={stat.id} style={{ flex: 1, borderTop: `2px solid ${stat.color}40`, paddingTop: '0.8rem', background: 'rgba(5,15,20,0.4)', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', alignItems: 'flex-end' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>{stat.label}</span>
                                            <span style={{ color: '#f8fafc', fontSize: '1.4rem', fontFamily: 'monospace', lineHeight: 1 }}>{total}</span>
                                        </div>
                                        
                                        <div style={{ height: '10px', background: '#020c10', borderRadius: '5px', display: 'flex', overflow: 'hidden', border: '1px solid #1e293b' }}>
                                            <div style={{ width: `${basePct}%`, background: stat.color, opacity: 0.4 }} title="Base Ship Capability" />
                                            <div style={{ width: `${crewPct}%`, background: stat.color, opacity: 0.9 }} title="Crew Trait Bonus" />
                                            <div style={{ width: `${multiPct}%`, background: '#e879f9' }} title="Structural Synergy Multiplier" />
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.75rem' }}>
                                            <span style={{ color: stat.color, opacity: 0.7 }}>Base: {stat.base}</span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ color: stat.color }}>Crew: +{stat.crew}</span>
                                                {multi > 1 && <span style={{ color: '#e879f9' }}>Res: +{Math.floor((stat.base + stat.crew) * (multi - 1))}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Resonant Bonds Info */}
                        <div style={{ flex: '0 0 240px', background: '#3b0764', borderRadius: '8px', padding: '1.2rem', border: '1px solid #c026d3', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ color: '#e879f9', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.6rem' }}>Resonant Bonds Active: {strongBonds}</div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.5 }}>
                                Strong linkages grant a 5% exponential multiplier to ships. Re-arrange crew to maximize DNA linkages.
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
