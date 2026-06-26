import React, { useMemo, forwardRef, useImperativeHandle } from 'react';
import { CosmicRecursionEngine } from '../../state/logic/CosmicRecursionEngine';
import { SPEED_RANGE } from './CosmicClock';
import { getBodyPosition, getOrbitGeometry } from '../../state/logic/OrbitalPhysics';

// Handle interface for parent access
export interface HarmonicSystemHandle {
    getBodyPosition: (id: string, time: number, overrideScale?: number, overrideScaleFactor?: number) => { x: number, y: number } | null;
}

interface HarmonicSystemRendererProps {
    bodies: any[]; // Using any[] for now to match current loose typing, but should be HarmonicBody[]
    octave: number;
    center: number;
    scaleFactor: number;
    viewTransform: { x: number, y: number, scale: number };
    accumulatedSimTime: number;
    elapsedRealTime: number;
    selectedBody: any;
    setSelectedBody: (body: any) => void;
    hoveredBody: any;
    setHoveredBody: (body: any) => void;
    setSelectionZoomTarget: (zoom: number) => void;
    isAutoZoomingRef: React.MutableRefObject<boolean>;
    animateSpeedTo: (target: number, duration: number) => void;
    showLabels: boolean;
    showEquinox: boolean;
    setSelectedZodiac: (zodiac: any) => void;
    bodyPositionsRef: React.MutableRefObject<Map<string, { x: number, y: number }>>;
    earthPosRef: React.MutableRefObject<{ x: number, y: number } | null>;
    venusPosRef: React.MutableRefObject<{ x: number, y: number } | null>;
    // NEW: Pre-calculated Equinox Data (Axial Tilt + Precession)
    planetaryEquinoxes?: { planet: string; equinoxAngle: number; axialTilt: number }[];
    maxZoom?: number;
}

/**
 * HarmonicSystemRenderer
 * 
 * Unified rendering component for Octaves 1 (Quantum), 2 (Standard), and 3 (Galactic).
 * Handles the visual projection of fractal harmonic bodies.
 */
export const HarmonicSystemRenderer = React.memo(forwardRef<HarmonicSystemHandle, HarmonicSystemRendererProps>(({
    bodies,
    octave,
    center,
    scaleFactor,
    viewTransform,
    accumulatedSimTime,
    elapsedRealTime,
    selectedBody,
    setSelectedBody,
    hoveredBody,
    setHoveredBody,
    setSelectionZoomTarget,
    isAutoZoomingRef,
    animateSpeedTo,
    showLabels,
    showEquinox,
    setSelectedZodiac,
    bodyPositionsRef,
    earthPosRef,
    venusPosRef,
    planetaryEquinoxes = [],
    maxZoom
}, ref) => {

    // OPTIMIZATION: Create Body Map for O(1) Lookups
    // This replaces the O(N) .find() in every frame for every body
    const bodyMap = useMemo(() => {
        const map = new Map<string, any>();
        bodies.forEach(b => map.set(b.id, b));
        return map;
    }, [bodies]);




    
    // HYDRATION FIX: Ensure rendering only happens on client
    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <g>

            {bodies.map(body => {
                // Sun Filter - Use specialized SolarBody component instead
                if (body.name === 'Sun') return null;

                // 1. TIME & MOTION
                // Use ACCUMULATED sim time for smooth animation
                const scaledTime = accumulatedSimTime * (viewTransform.scale > 0 ? 1 : 1); 
                
                // Modulo by orbital period to prevent overflow
                // FIX (2026-02-16): REMOVED redundant modulo here. 
                // getBodyPosition now handles modulo internally for Theta, but needs RAW time for Precession.
                // const periodSec = body.period_sec || 31557600;
                // scaledTime = scaledTime % periodSec;
                
                // VISUAL RADIUS DYNAMICS
                // User Request: "Increase size as we zoom in" (Planets Only)
                // "Put the orbits back they need to be exact" -> implied Nodes/Zones should not grow into giant blobs.
                
                // FIXED (User Request): Always render objects as solid bodies.
                // The previous logic forced "Resonance" and "Node" names to be transparent rings.
                // const isHarmonicZone = body.name.includes("Node") || body.name.includes("Harmony") || body.name.includes("Zone") || body.name.includes("Resonance");
                const isHarmonicZone = false; 
                
                // FIXED (User Request 2026-02-15): "Infinite Mirror" / World-Space Scaling
                // Objects have fixed physical sizes in AU (from useCosmicData).
                // We render them exactly as they would appear in that space.
                // Zoom In -> They get huge (fly past them).
                // Zoom Out -> They get tiny (perspective).
                
                const baseRadius = body.normalized_radius_au || body.visual_radius || CosmicRecursionEngine.UNIFIED_BODY_RADIUS;
                
                // PURE SCALING:
                // Size (px) = Physical Radius (AU) * Scale Factor (px/AU)
                // TUNING (2026-02-16): DYNAMIC MICRO-SCALING (v2)
                // TUNING (2026-02-16): TRUE SCREEN PIXEL SCALING
                // PROBLEM: Parent SVG Group is scaled by `viewTransform.scale` (e.g. 250x).
                // Any static value here gets multiplied by 250 (e.g. 2px -> 500px).
                // SOLUTION: Divide by scale to define size in SCREEN PIXELS.
                
                // Target: Start at ~2px radius (4px dot). Grow slightly to ~5px radius (10px dot) at max zoom.
                const baseScreenRadius = 2.5; 
                const growth = Math.pow(viewTransform.scale, 0.15); // Subtle growth curve
                const screenRadius = baseScreenRadius * growth;
                
                // Apply Inverse Scale to get SVG coordinates
                const size = screenRadius / viewTransform.scale;


                // Min-size clamp for visibility at extreme zoom-out (optional, keeps them as dust motes)
                // const visibleSize = Math.max(size, 1); 
                // User wanted "infinite mirror", so we trust the raw math. If it's sub-pixel, it disappears.


                const isAsteroid = ['Asteroid', 'Trojan', 'Centaur', 'Comet', 'TNO'].includes(body.object_type || body.type || '');
                const bodyColor = body.color || '#94a3b8'; // Use metadata color (User Request)

                // 2. CALCULATE POSITION
                
                // Helper to resolve hierarchy
                // We do a simple lookup. Performance note: For <200 bodies this is fine.
                // For nested moons, we might recurse.


                const pos = getBodyPosition(body, scaledTime, bodyMap, center, scaleFactor, viewTransform.scale);
                const x = pos.x;
                const y = pos.y;

                // STRICT NAN GUARD (Main Render Loop)
                // If position calculation failed (returned NaN), SKIP RENDERING.
                // This prevents the entire React tree from crashing due to invalid SVG attributes.
                if (!Number.isFinite(x) || !Number.isFinite(y)) {
                    // console.warn(`[HarmonicSystemRenderer] Invalid Position for ${body.name}:`, { x, y });
                    return null;
                }

                // 3. VIEWPORT CULLING (Performance Optimization)
                // Project to screen space to check visibility
                // FIX (2026-02-16): Correct projection matching group transform:
                // transform="translate(center+tx, center+ty) scale(s) translate(-center, -center)"
                // Screen = (Local - Center) * Scale + Center + Translate
                const screenX = (x - center) * viewTransform.scale + center + viewTransform.x;
                const screenY = (y - center) * viewTransform.scale + center + viewTransform.y;
                const margin = 500; // Generous margin to prevent pop-in

                // Simple Box Cull - Decoupled for Body vs Orbit
                // We assume container is roughly window size (e.g. 1920x1080), but let's use a safe large box
                // Since we don't have container dims here, use a safe estimate 2000x2000
                const isBodyVisible = !(screenX < -margin || screenX > 2000 + margin || screenY < -margin || screenY > 2000 + margin);
                
                // Capture Earth/Venus positions for resonance trail (Side Effect)
                // MOVED UP: Must update refs even if body is off-screen, otherwise trails break!
                if (body.name === 'Earth' && earthPosRef) earthPosRef.current = { x, y };
                if (body.name === 'Venus' && venusPosRef) venusPosRef.current = { x, y };

                // Store position for sidebar connecting lines (Side Effect)
                if (bodyPositionsRef.current) {
                    bodyPositionsRef.current.set(body.id, { x, y });
                }

                const isSelected = (hoveredBody?.id === body.id) || (selectedBody?.id === body.id);
                // isHarmonicZone defined above for scaling logic
                const zoneColor = "#888888"; // or from theme
                
                // 3. RENDER
                // FIX: Use composite key to FORCE REMOUNT when octave changes to prevent "burn-in" / persistence artifacts
                return (
                    <g key={`${octave}-${body.id}`}>
                        {/* 1. ORBITAL PATH (SVG Ring) - Rendered regardless of body visibility */}
                        {(() => {
                             if (!body.normalized_radius_au || body.normalized_radius_au <= 0) return null;
                             
                             // unified orbit geometry
                             const { semiMajor, semiMinor, focusOffset, ecc } = getOrbitGeometry(body, viewTransform.scale, scaleFactor);

                             // Sanity check for NaNs or Infinite values which can cause render artifacts & crashes
                             if (!Number.isFinite(semiMajor) || !Number.isFinite(semiMinor) || semiMajor <= 0) return null;
                             if (Number.isNaN(focusOffset)) return null;

                             // HIERARCHY FOR ORBITS
                             // If Moon, orbit center is Parent Position (dynamic)
                             // If Planet, orbit center is system Center
                             let orbitCx = center;
                             let orbitCy = center;

                             if (body.parentBodyId) {
                                 if (parent) {
                                     const pPos = getBodyPosition(parent, scaledTime, bodyMap, center, scaleFactor, viewTransform.scale);
                                     orbitCx = pPos.x;
                                     orbitCy = pPos.y;
                                 }
                             }
                             
                             // UPDATE REF FOR CAMERA TRACKING
                             if (bodyPositionsRef.current) {
                                 // Calculate screen position for tracking
                                 // We need the raw world position here?
                                 // Actually getBodyPosition returns world position relative to center.
                                 // Wait, getBodyPosition returns {x, y} which ARE the coordinates used for drawing.
                                 // The renderer draws at cx={x} cy={y}.
                                 // So these are the correct values to store.
                                 bodyPositionsRef.current.set(body.name, { x, y });
                             }
                             
                             // Use modulo time for rotation to prevent jitter at high values
                             // Must match getBodyPosition logic
                             const periodSec = (body.orbital_freq && body.orbital_freq > 0) ? (1 / body.orbital_freq) : (1e99); 
                             const localTime = scaledTime % periodSec;
                             
                             // Precession Rotation (Degrees)
                             const rotationDeg = (scaledTime * (body.precession_rate || 0)) * (180 / Math.PI);

                             return (
                                <ellipse
                                    cx={orbitCx + focusOffset} 
                                    cy={orbitCy}
                                    rx={Number(semiMajor.toFixed(4))}
                                    ry={Number(semiMinor.toFixed(4))}
                                    fill="none"
                                    stroke={isHarmonicZone ? "rgba(255, 255, 255, 0.05)" : (body.is_theoretical ? "rgba(255, 255, 255, 0.15)" : (isAsteroid ? "#64748b" : (body.color || "#444")))}
                                    strokeWidth={isHarmonicZone ? 0.5 : (body.is_theoretical ? 1 : (isAsteroid ? 1 : 2))} // 1px for Asteroids
                                    strokeDasharray={isHarmonicZone ? "2,4" : (body.is_theoretical ? "4, 4" : "none")} // Dotted for theoretical
                                    opacity={isHarmonicZone ? 0.3 : (body.is_theoretical ? 0.5 : (isAsteroid ? 0.6 : 0.2))}
                                    vectorEffect="non-scaling-stroke"
                                    transform={`rotate(${rotationDeg}, ${orbitCx}, ${orbitCy})`}
                                    data-debug-orbit-cx={orbitCx}
                                    data-debug-orbit-cy={orbitCy}
                                    data-debug-focus-offset={focusOffset}
                                />
                             );
                        })()}

                         {/* 2. RESONANCE LINE (Center to Body connection) */}
                         {/* Only for Harmonic Nodes/Zones to visualize the "tuning fork" connection */}
                         {/* DISABLED: User reported persistent lines in high octaves. "Objects aren't supposed to have lines between them". */}
                         {/* {isHarmonicZone && (
                            <line
                                x1={center} y1={center}
                                x2={x} y2={y}
                                stroke={zoneColor}
                                strokeWidth={0.8 / viewTransform.scale}
                                strokeDasharray="2,2"
                                opacity={0.2}
                            />
                         )} */}

                        {isBodyVisible && (
                        <g 
                            onMouseEnter={() => setHoveredBody(body)}
                            onMouseLeave={() => setHoveredBody(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedZodiac(null);
                                const wasSelected = selectedBody?.id === body.id;
                                
                                if (wasSelected) {
                                    setSelectedBody(null);
                                    return;
                                }
                                
                                // SELECTION LOGIC
                                // User Request: Standardize to 25x (was 250x)
                                const targetZoom = 25; 
                                setSelectionZoomTarget(targetZoom); 
                                setSelectedBody(body);
                                isAutoZoomingRef.current = true;
                                
                                // Speed animation
                                // Note: SPEED_RANGE needs to be imported or passed. 
                                const range = SPEED_RANGE[octave as keyof typeof SPEED_RANGE];
                                if (range) animateSpeedTo(range.default, 600);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                             {/* Planet Body - Hide if Theoretical */}
                            {!body.is_theoretical && (
                                <circle
                                    cx={x} cy={y} r={size}
                                    fill={isHarmonicZone ? "transparent" : bodyColor}
                                    stroke={isHarmonicZone ? zoneColor : "none"}
                                    strokeWidth={0} // DEBUG: 0 Stroke to see pure size
                                    opacity={isHarmonicZone ? 0.7 : 0.9}
                                    vectorEffect="non-scaling-stroke"
                                />
                            )}

                             {/* Selection/Action Rings */}
                            {!isHarmonicZone && (
                                <>
                                    <circle 
                                        cx={x} cy={y} 
                                        r={isSelected ? size * 1.5 : size * 1.2} 
                                        fill={bodyColor} 
                                        opacity={0.12} 
                                        // vectorEffect="non-scaling-stroke" // Opacity fill doesn't need scaling fix usually, but keeping geometry consistent
                                    />
                                    
                                    {/* Spin Marker (Visualizes axial rotation) */}
                                    {(() => {
                                        // Use simTime for spin? or scaledTime?
                                        // CosmicClock used simTimeSeconds... let's use scaledTime for consistency
                                        const spinFreq = body.spin_freq || 0;
                                        const spinAngle = (scaledTime * spinFreq * 2 * Math.PI); 
                                        const markerRadius = size * 0.7;
                                        // CLAMP: Prevent massive marker at low zoom
                                        const invScale = 1 / (viewTransform.scale || 0.001);
                                        const clampedInvScale = Math.min(invScale, 100); // Max 100x size
                                        
                                        return (
                                            <circle
                                                cx={x + markerRadius * Math.cos(spinAngle)}
                                                cy={y + markerRadius * Math.sin(spinAngle)}
                                                r={1.5 * clampedInvScale} // Scaled r, but clamped
                                                fill="#fff" opacity={0.8}
                                                // vectorEffect cannot apply to radius 'r', so we must scale manually or use transform
                                                // Using clamped manual scaling
                                            />
                                        );
                                    })()}
                                    
                                    {/* EQUINOX DIRECTION ARROW (True Equinox with Axial Tilt) */}
                                    {showEquinox && !body.name.includes("Sun") && (() => {
                                        // Find pre-calculated equinox data
                                        const eqData = planetaryEquinoxes.find(e => e?.planet.toLowerCase() === body.name.toLowerCase());
                                        const equinoxAngleDeg = eqData ? eqData.equinoxAngle : 0;
                                        
                                        // CLAMP: Prevent massive arrows
                                        const invScale = 1 / (viewTransform.scale || 0.001);
                                        const clampedInvScale = Math.min(invScale, 100); 
                                        
                                        return (
                                            <g transform={`translate(${x}, ${y}) rotate(${equinoxAngleDeg})`}>
                                                <line 
                                                    x1={0} y1={0} 
                                                    x2={35 * clampedInvScale} y2={0} 
                                                    stroke={body.color} 
                                                    strokeWidth={1.5} // Fixed width
                                                    strokeDasharray="4,3"
                                                    opacity={0.8}
                                                    vectorEffect="non-scaling-stroke"
                                                />
                                                {/* Arrowhead */}
                                                <path
                                                    d="M -6 -5 L 0 0 L -6 5"
                                                    transform={`translate(${35 * clampedInvScale}, 0) scale(${1.3 * clampedInvScale})`}
                                                    fill="none"
                                                    stroke={body.color}
                                                    strokeWidth={2}
                                                    vectorEffect="non-scaling-stroke"
                                                />
                                            </g>
                                        );
                                    })()}
                                </>
                            )}

                            {/* Labels */}
                            {(hoveredBody?.id === body.id || selectedBody?.id === body.id || showLabels) && !body.name.includes("Sun") && (() => {
                                 let displayName = isHarmonicZone ? body.name : body.name.toUpperCase();
                                 if (displayName.includes('PREDICTED ORBIT') || displayName.includes('Predicted Orbit')) {
                                     const match = displayName.match(/\[(\d+)\]/);
                                     if (match) {
                                         displayName = `[${match[1]}] ORBIT`;
                                     } else {
                                         displayName = 'ORBIT';
                                     }
                                 }
                                 const constellation = (octave === 3 || octave === 13) && body.meta?.constellation ? body.meta.constellation : undefined;
                                 
                                 return (
                                    <g>
                                    {constellation && (
                                            <text x={x} y={y - (size * 2 + 32/viewTransform.scale)} fill="#fbbf24" fontSize={10/viewTransform.scale} fontWeight={600} textAnchor="middle" opacity={0.9}>
                                                ♈ {constellation.toUpperCase()}
                                            </text>
                                        )}
                                        {(() => {
                                            // Dynamic Text Scaling: 
                                            // SIMPLIFIED (User Request): Removed complex boosting/clamping logic.
                                            // Keeps text at steady ~13px screen size effectively.
                                            
                                            const textInvScale = 1 / (viewTransform.scale || 0.001);
                                            const safeFontSize = 13 * textInvScale; 
                                            
                                            // Calculate Y-Offset
                                            // Body Radius (size/2) is in World Units.
                                            
                                            // Recalculate size locally for label offset using consistent logic
                                            const growthFactor = viewTransform.scale < 1 ? 1 : Math.pow(viewTransform.scale, 0.5);
                                            const baseRadius = body.visual_radius || CosmicRecursionEngine.UNIFIED_BODY_RADIUS;
                                            const bodyVisualRadius = (baseRadius / viewTransform.scale) * growthFactor;

                                            // We add a fixed Screen Pixel buffer (e.g. 10px + 12px for text height).
                                            const screenPixelOffset = 22; 
                                            const worldOffset = screenPixelOffset * textInvScale;
                                            
                                            // Total Y Offset = Body Radius + Text Buffer
                                            const yOffsetMain = bodyVisualRadius + worldOffset;

                                            // Far-Out Visibility: Increase opacity for auto-discovered bodies when zoomed out
                                            const isFarOut = body.auto_discovered;
                                            const nameColor = isHarmonicZone ? zoneColor : (body.name.includes("Tier") ? "#FFD700" : (isFarOut ? (viewTransform.scale < 0.2 ? '#fff' : 'rgba(255,255,255,0.4)') : "#fff"));

                                            return (
                                              <>
                                                <text x={x} y={y - yOffsetMain} 
                                                      fill={nameColor} 
                                                      fontSize={safeFontSize} fontWeight={"700"} textAnchor="middle" 
                                                      style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.8)', pointerEvents: 'none' }}>
                                                    {displayName}
                                                </text>
                                              </>
                                            );
                                        })()}
                                    </g>
                                 );
                            })()}
                        </g>
                        )}
                    </g>
                );
            })}
        </g>
    );
}));
