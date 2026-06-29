import React, { memo } from 'react';
import { RenderableBody } from '../../state/science/HarmonicResonanceEngine';
import { SPEED_RANGE } from './CosmicClock';
import { formatRadius, formatRadiusString } from '../../state/logic/formatUnits';

interface CosmicSideMenuProps {
    finalBodies: RenderableBody[];
    octave: number;
    activeOctave?: number; // Added to fix prop mismatch
    activeSubOctave?: number; // Added to fix prop mismatch
    setActiveOctave?: (o: number) => void;
    setActiveSubOctave?: (s: number) => void;
    onCatalogClick?: () => void;
    selectedBody: any;
    setSelectedBody: (b: any) => void;
    setHoveredBody: (b: any) => void;
    setSelectionZoomTarget: (z: number) => void;
    isAutoZoomingRef: React.MutableRefObject<boolean>;
    animateSpeedTo: (speed: number, duration: number) => void;
    maxZoom?: number;
    // Filter states for the key (to force remount/scroll reset if needed)
    showMatches: boolean;
    showPredicted: boolean;
}

export const CosmicSideMenu = memo(({
    finalBodies,
    octave,
    activeOctave,
    activeSubOctave,
    setActiveOctave,
    setActiveSubOctave,
    onCatalogClick,
    selectedBody,
    setSelectedBody,
    setHoveredBody,
    setSelectionZoomTarget,
    isAutoZoomingRef,
    animateSpeedTo,
    maxZoom,
    showMatches,
    showPredicted
}: CosmicSideMenuProps) => {

    // DEBUG: Check render frequency
    console.log('[CosmicSideMenu] Rendered. FinalBodies Length:', finalBodies.length);
    if (selectedBody) console.log('[CosmicSideMenu] Selected Body:', selectedBody);

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '0.5rem',
            transform: 'translateY(-50%)',
            zIndex: 20,
            maxHeight: '80%',
            overflowY: 'auto',
            width: '420px'
        }}>
            {/* 
               Dynamic Key ensures the menu is fully re-drawn when filters change, 
               preventing any visual "stacking" or scroll retention issues.
            */}
            <div 
                key={`${showMatches}-${showPredicted}-${finalBodies.length}`}
                style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}
            >
                {finalBodies.map((body, idx) => {
                    // ═══ SIDEBAR COLOR SYSTEM ═══
                    // Moon → parent planet color mapping (lighter shade)
                    const MOON_PARENT_COLORS: Record<string, string> = {
                        // Earth
                        'Moon': '#93c5fd',       // light blue (Earth-like)
                        // Mars
                        'Phobos': '#fca5a5', 'Deimos': '#fca5a5',   // light red
                        // Jupiter
                        'Io': '#fcd34d', 'Europa': '#fde68a', 'Ganymede': '#fbbf24', 'Callisto': '#f59e0b',
                        'Amalthea': '#fde68a', 'Himalia': '#fcd34d',
                        // Saturn
                        'Mimas': '#d8b4fe', 'Enceladus': '#e9d5ff', 'Tethys': '#c4b5fd', 'Dione': '#d8b4fe',
                        'Rhea': '#c4b5fd', 'Titan': '#a78bfa', 'Hyperion': '#e9d5ff', 'Iapetus': '#c4b5fd',
                        'Phoebe': '#d8b4fe',
                        // Uranus
                        'Miranda': '#67e8f9', 'Ariel': '#a5f3fc', 'Umbriel': '#67e8f9',
                        'Titania': '#22d3ee', 'Oberon': '#a5f3fc',
                        // Neptune
                        'Triton': '#818cf8', 'Nereid': '#a5b4fc', 'Proteus': '#818cf8',
                        // Pluto
                        'Charon': '#d1d5db', 'Nix': '#e5e7eb', 'Hydra': '#d1d5db',
                    };

                    const objType = body.object_type || '';
                    const isMoon = objType === 'Moon';
                    const isPlanet = objType === 'Planet';
                    const isDwarfPlanet = objType === 'Dwarf Planet';
                    const isAutoDiscovered = body.auto_discovered === true;

                    const isNewObject = body.name.startsWith('New Object Found');
                    const isPredicted = body.name.includes('Predicted Orbit');

                    // Dot color: planets=body.color, moons=parent tint, new objects=gold, others=grey
                    let dotColor: string;
                    let nameColor: string;
                    let statusIcon: string;

                    if (isNewObject) {
                        // NEW OBJECT FOUND — highlight with gold/amber
                        dotColor = '#f59e0b';
                        nameColor = '#fbbf24';
                        statusIcon = '✨ ';
                    } else if (isPredicted) {
                        // PREDICTED OBJECT — Explicitly grey out text
                        dotColor = '#475569';
                        nameColor = '#64748b'; // Slate-500
                        statusIcon = ''; 
                    } else if (!isAutoDiscovered) {
                        // Base level objects (1x precision) — use body's own color
                        dotColor = body.color;
                        nameColor = '#ffffff'; // User Request: White for legibility
                        statusIcon = '';
                    } else if (isMoon) {
                        dotColor = MOON_PARENT_COLORS[body.name] || '#94a3b8';
                        nameColor = '#ffffff';
                        statusIcon = '🌑 ';
                    } else if (isPlanet || isDwarfPlanet) {
                        dotColor = body.color;
                        nameColor = '#ffffff';
                        statusIcon = '🔍 ';
                    } else if (objType === 'Star') {
                        dotColor = body.color;
                        nameColor = '#ffffff';
                        statusIcon = '⭐ ';
                    } else if (objType === 'Binary Star') {
                        dotColor = body.color;
                        nameColor = '#ffffff';
                        statusIcon = '⚡ ';
                    } else if (objType === 'Star Cluster') {
                        dotColor = body.color;
                        nameColor = '#ffffff';
                        statusIcon = '🌌 ';
                    } else if (objType === 'Nebula') {
                        dotColor = body.color;
                        nameColor = '#ffffff';
                        statusIcon = '🌫️ ';
                    } else if (objType === 'Supernova Remnant') {
                        dotColor = body.color;
                        nameColor = '#ffffff';
                        statusIcon = '💥 ';
                    } else {
                        // General fallback for all matched objects (Asteroids, etc)
                        dotColor = body.color || '#6b7280';  // Use metadata color for dot
                        nameColor = '#ffffff';               // Force white text for matched names
                        statusIcon = '🪨 ';
                    }

                    // Get constellation for Octave 13 objects (was Octave 3)
                    const constellation = (octave === 3 || octave === 13) && body.meta?.constellation ? body.meta.constellation : undefined;
                    
                    const safeName = body.name || 'Unnamed Object';     
                    let displayName = safeName.split('\n')[0]; 
                    
                    // If it's a predicted orbit with hardcoded AU, strip it so we use dynamic formatting
                    if (displayName.includes('Predicted Orbit')) {
                        // Extract just the index, ignoring the rest
                        const match = displayName.match(/\[(\d+)\]/);
                        if (match) {
                            displayName = `[${match[1]}] Orbit`;
                        } else {
                            displayName = 'Orbit';
                        }
                    }

                    // Let formatRadiusString handle the UI string interpolation
                    const formattedRadiusStr = formatRadiusString(body.meta?.true_radius_au || (body as any).radius_au || 0, octave);
                    const isDistancePc = body.distance_pc !== undefined && body.distance_pc >= 1;
                    const orbitDetails = isDistancePc ? '' : ` [${formattedRadiusStr}]`;

                    const suffix = (constellation ? ` [${constellation}]` : '') + orbitDetails;
                    
                    const isSelected = selectedBody?.id === body.id;
                    const isHovered = false; // We don't have separate hover state per item in this simple map, passed via parent

                    return (
                        <button
                            key={body.id || idx}
                            onClick={(e) => {
                                e.stopPropagation(); 

                                // Just set the state and let the useEffect camera follower handle the smooth animation.
                                setSelectedBody(body);
                                
                                // User Request: Standardize to 25x (was 250x)
                                const targetZoom = 25;
                                setSelectionZoomTarget(targetZoom); 
                                isAutoZoomingRef.current = true; // Engage auto-zoom
                                
                                // Smoothly animate speed to default
                                const range = SPEED_RANGE[octave as keyof typeof SPEED_RANGE];
                                animateSpeedTo(range.default, 600);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderLeft: isSelected 
                                    ? '2px solid #6366f1' 
                                    : '3px solid transparent',
                                padding: '0.15rem 0.5rem',
                                marginLeft: body.object_type === 'Moon' || body.parentBodyId ? '1.2rem' : '0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.15s ease',
                                width: 'fit-content', 
                                pointerEvents: 'auto' 
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderLeftColor = 'rgba(99, 102, 241, 0.5)';
                                // Turn text white on hover
                                const span = e.currentTarget.querySelector('span');
                                if (span) span.style.color = '#fff';
                                setHoveredBody(body);
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderLeftColor = isSelected 
                                    ? '#6366f1' 
                                    : 'transparent';
                                // Slowly fade back to original color
                                const span = e.currentTarget.querySelector('span');
                                if (span) {
                                    span.style.transition = 'color 0.8s ease-out';
                                    span.style.color = isSelected ? '#fff' : nameColor;
                                    // UNTOGGLED OPACITY FIX
                                    if (!isSelected && !isNewObject) {
                                         span.style.opacity = '0.7'; 
                                    } else {
                                         span.style.opacity = '1';
                                    }
                                }
                                setHoveredBody(null);
                            }}
                        >
                            {/* Color dot */}
                            <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: dotColor,
                                boxShadow: isNewObject ? '0 0 6px rgba(245,158,11,0.5)' : isMoon ? `0 0 4px ${dotColor}` : (isAutoDiscovered ? 'none' : `0 0 3px ${dotColor}`),
                                flexShrink: 0,
                                transition: 'all 0.3s ease'
                            }} />
                            {/* Name */}
                            <div style={{ textAlign: 'left' }}>
                                <span style={{
                                    fontSize: '0.9rem', // Decreased 2 sizes from 1.1rem
                                    fontWeight: isSelected ? 800 : 600,
                                    color: isSelected ? '#fff' : nameColor,
                                    opacity: isSelected ? 1 : 0.7, 
                                    transition: 'color 0.8s ease-out, opacity 0.3s ease'
                                }}>
                                    {statusIcon}{displayName}<span style={{ color: '#818cf8', fontSize: '0.75rem' }}>{suffix}</span>
                                </span>
                                {/* Distance subtitle */}
                                <div style={{
                                    fontSize: '0.8rem', // Decreased 3 sizes from 1.1rem
                                    color: '#cbd5e1', // Lighter Slate-300 per user request
                                    marginTop: '1px',
                                    fontWeight: 500, // Slightly bolder for readability
                                    letterSpacing: '0.3px',
                                    opacity: isSelected ? 1 : 0.85 
                                }}>
                                    {body.spectral_type ? `${body.spectral_type}` : ''}
                                    {body.object_type && !body.spectral_type ? `${body.object_type}` : ''}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            

        </div>
    );
}); // End memo
