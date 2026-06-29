import React, { useMemo } from 'react';
import { J2000_EPOCH } from '../data/solar_system_jpl';

interface ControlSystemRendererProps {
    center: number;
    dataCenter?: number; // NEW: Origin of the input data (e.g. 290), separate from View Center
    scaleFactor: number;
    viewTransform: { x: number, y: number, scale: number };
    simDate: Date;
    selectedBody: any;
    setSelectedBody: (body: any) => void;
    hoveredBody: any;
    setHoveredBody: (body: any) => void;
    showLabels: boolean;
    showEquinox?: boolean; // NEW: Toggle for optimization
    renderMode?: 'legacy' | 'viewport'; // NEW: Virtual Viewport Mode
    // NEW: Pre-calculated State from Engine
    systemState: {
        bodies: {
            name: string;
            x: number;
            y: number;
            z: number;
            color: string;
            id: string;
            radius_km: number;
            originalData: any;
        }[];
        // NEW: Stable reference for Orbit Rendering (Separate from Dynamic positions)
        // This list does not change on every frame, unlike 'bodies'
        staticBodies?: {
            name: string;
            color: string;
            id: string;
        }[];
        orbits: Map<string, string>;
        orbitPoints?: Map<string, {x: number, y: number}[]>; // RAW POINTS for Viewport Mode
    } | null;
    // NEW: Pre-calculated Equinox Data (Axial Tilt + Precession)
    planetaryEquinoxes?: { planet: string; equinoxAngle: number; axialTilt: number }[];
    // NEW: Ref for UI Overlay Tracking (Connecting Lines)
    bodyPositionsRef: React.MutableRefObject<Map<string, { x: number, y: number }>>;
}

/**
 * ControlSystemOrbits
 * 
 * Separated layer for orbit paths to prevent re-rendering on zoom.
 * Uses vector-effect="non-scaling-stroke" to maintain line width.
 */
const ControlSystemOrbits = React.memo(({ orbits, orbitPoints, bodies, selectedBodyName, center, renderMode, viewTransform, scaleFactor, dataCenter }: { 
    orbits: Map<string, string>, 
    orbitPoints?: Map<string, {x: number, y: number}[]>,
    bodies: any[], 
    selectedBodyName?: string, 
    center: number,
    renderMode?: 'legacy' | 'viewport',
    viewTransform?: { x: number, y: number, scale: number },
    scaleFactor: number,
    dataCenter: number
}) => {
    // Fallback if dataCenter missing
    const origin = dataCenter ?? center;
    return (
        <g>
            {/* PRIMARY ORBITS (Heliocentric) - Filter out moons (bodies with parentBodyId) */}
            {bodies.filter(b => !b.parentBodyId).map((body: any) => {
                let d = "";

                // MODE: VIEWPORT (Raw Projection)
                if (renderMode === 'viewport' && orbitPoints && viewTransform) {
                     // 1. Calculate Orbit Geometry (Pre-Projection)
                     // Estimate radius from body position (which is on the orbit)
                     // points are in "World Ref" centered at 'origin'
                     const dx = body.x - origin;
                     const dy = body.y - origin;
                     const worldRadius = Math.sqrt(dx*dx + dy*dy);
                     
                     // 2. Project Center & Radius
                     // FIX (2026-02-15): Pivot around 'center' so Zoom doesn't shift the origin
                     // Formula: (WorldPos - Center) * Scale + Center + Pan
                     const screenCenterX = (center - center) * viewTransform.scale + center + viewTransform.x;
                     const screenCenterY = (center - center) * viewTransform.scale + center + viewTransform.y;
                     const screenRadius = worldRadius * viewTransform.scale;

                     // 3. CULLING (Circle-Box Intersection)
                     // Viewport Box: [0, 0] to [Width, Height] (Approx 1920x1080)
                     // We use a safe margin (-500 to 2500)
                     const viewL = -500;
                     const viewR = 2500;
                     const viewT = -500;
                     const viewB = 1500;

                     // Quick AABB Check:
                     // Orbit Box: [cx-r, cx+r]
                     // If Orbit Box is completely outside Viewport Box, Cull.
                     if (screenCenterX + screenRadius < viewL || 
                         screenCenterX - screenRadius > viewR || 
                         screenCenterY + screenRadius < viewT || 
                         screenCenterY - screenRadius > viewB) {
                         return null;
                     }
                     
                     // 4. Special High-Zoom Optimization:
                     // If orbit is MASSIVE (e.g. > 50,000px radius) and we are zoomed in, 
                     // intersecting it implies we are seeing a tiny arc.
                     // The browser still handles this fine, but if we are deeply inside it?
                     // E.g. Zoomed on Sun. Pluto orbit is 100,000px away.
                     // screenCenterX (Sun) is at screen center.
                     // screenRadius (Pluto) is 100,000.
                     // It surrounds us. We SHOULD see it?
                     // No, Pluto orbit is *far away*. Sun is at center. Pluto orbit is around Sun.
                     // If we are at Sun, and zoomed in...
                     // Start: Sun at 500,500. Scale 1. Pluto at 10,000px.
                     // Zoom in (Scale 100). Sun at 500,500. Pluto at 1,000,000px.
                     // We see Sun. Pluto orbit is off-screen!
                     // Culling Logic:
                     // screenCenterX = 500. screenRadius = 1,000,000.
                     // Box: [-999500, 1000500].
                     // Viewport: [0, 2000].
                     // It Overlaps!
                     // So Bounding Box says "Render".
                     // But actually the LINE is at radius 1,000,000.
                     // The HOLE in the middle is empty.
                     // We need to cull if we are INSIDE the orbit?
                     // Inner Radius Check!
                     // If screenRadius > 4000 (larger than viewport diagonal) AND center is on screen...
                     // dist(viewportCenter, screenCenter) < screenRadius - 2000?
                     // Basically: if the circle completely encloses the viewport, we don't see the line.
                     
                     // Safe approximations:
                     // Screen Diagonal ~ 3000px.
                     // Distance from Screen Center (1000, 500) to Orbit Center (screenCenterX, screenCenterY).
                     const vpCx = 1000;
                     const vpCy = 500;
                     const distToCenter = Math.sqrt(Math.pow(screenCenterX - vpCx, 2) + Math.pow(screenCenterY - vpCy, 2));
                     
                     // If orbit surrounds us completely (too big to see edges)
                     // If Distance + ViewportBuffer < Radius
                     // Then Viewport is fully inside.
                     if (screenRadius > 4000 && (distToCenter + 2000) < screenRadius) {
                         return null;
                     }

                     const points = orbitPoints.get(body.name);
                     if (!points || points.length === 0) return null;

                     const projected = points.map(p => {
                         // Pivot Transform: (WorldPos - Center) * Scale + Center + Pan
                         // p.x includes 'center' offset already, so minus center:
                         // (p.x - center) * scale + center + pan
                         // Wait, p.x are raw points relative to center?
                         // In 'getSolarSystemStaticOrbits', points are: x: r * cos, y: r * sin.
                         // So they are RELATIVE to (0,0). They do NOT include center.
                         // Ah! line 17 'bodies' have 'x = center + x'.
                         // But 'orbitPoints' from getSolarSystemStaticOrbits might be relative?
                         // Let's assume orbitPoints are RELATIVE (0,0 based).
                         
                         // Pivot Transform: (WorldPos - Origin) * Scale + Center + Pan
                         // p.x includes 'origin', so we MUST subtract it first.
                         const sx = (p.x - origin) * viewTransform.scale + center + viewTransform.x;
                         const sy = (p.y - origin) * viewTransform.scale + center + viewTransform.y;
                         return `${sx.toFixed(1)},${sy.toFixed(1)}`;
                     });
                     
                     d = `M ${projected.join(" L ")}`;
                } else {
                     // MODE: LEGACY (Scaled Group)
                     d = orbits.get(body.name) || "";
                }

                if (!d) return null;
                
                // Culling Logic
                // Only cull in legacy mode where container size is an issue.
                // In viewport mode, paths are screen-size standard.
                if (renderMode !== 'viewport') {
                    const visualRadius = Math.sqrt(Math.pow(body.x - center, 2) + Math.pow(body.y - center, 2));
                    if (visualRadius > 20000) return null;
                }
                
                const isGhost = body.name.startsWith("ghost_");
                const orbitColor = isGhost ? "rgba(255, 255, 255, 0.6)" : body.color;
                const orbitWidth = 2; // User Request: Fixed 2px width
                const orbitOpacity = isGhost ? 0.6 : 0.5;

                return (
                    <path
                        key={body.name + '_orbit'}
                        d={d}
                        fill="none"
                        stroke={orbitColor}
                        strokeWidth={orbitWidth}
                        opacity={orbitOpacity}
                        vectorEffect={renderMode === 'viewport' ? undefined : "non-scaling-stroke"}
                        style={{ pointerEvents: 'none' }}
                    />
                );
            })}
        </g>
    );
});

/**
 * LocalOrbitsRenderer
 * 
 * Renders parent-centric orbits (Moons) using DYNAMIC body positions.
 * Moving this out of the memoized Orbits component ensures it updates 
 * smoothly with the physics loop.
 */
const LocalOrbitsRenderer = React.memo(({ bodies, scaleFactor, viewTransform, renderMode, center, dataCenter }: {
    bodies: {
        name: string;
        x: number;
        y: number;
        color: string;
        id: string;
        originalData: any;
        parentBodyId?: string;
        local_radius_au?: number;
    }[],
    scaleFactor: number,
    viewTransform: { x: number, y: number, scale: number },
    renderMode: string,
    center: number,
    dataCenter: number
}) => {
    const origin = dataCenter ?? center;
    return (
        <g>
            {bodies.filter(b => b.parentBodyId).map((moon: any) => {
                // Resolve Parent from Dynamic List
                const parentId = moon.originalData?.parentBodyId || moon.parentBodyId;
                const parentBody = bodies.find(b => b.id === parentId || b.name === parentId);

                if (!parentBody) return null;

                const localRadiusAU = moon.local_radius_au || (moon.originalData?.local_radius ? moon.originalData.local_radius : 0);
                if (!localRadiusAU) return null;

                // Minimum Visual Radius for Moon Orbits (pixels)
                const MIN_MOON_ORBIT_PX = 15;

                const r = localRadiusAU * (scaleFactor || 290);
                const px = parentBody.x;
                const py = parentBody.y;

                let cx, cy, cr;

                if (renderMode === 'viewport' && viewTransform) {
                    // FIX (2026-02-15): Pivot around 'center'
                    // Formula: (WorldPos - Origin) * Scale + Center + Pan
                    cx = (px - origin) * viewTransform.scale + center + viewTransform.x;
                    cy = (py - origin) * viewTransform.scale + center + viewTransform.y;
                    cr = r * viewTransform.scale;

                    // VISUAL BOOST: Keep orbit visible if zoomed in enough to care
                    if (cr < MIN_MOON_ORBIT_PX && viewTransform.scale > 0.5) { // Relaxed from 5 to 0.5 for visibility
                        cr = MIN_MOON_ORBIT_PX;
                    }
                } else {
                    // Legacy Mode: World Coordinates
                    cx = px;
                    cy = py;
                    cr = r;
                }

                // Culling: Don't render tiny sub-pixel orbits
                if (renderMode === 'viewport' && cr < 2) return null;

                return (
                    <circle
                        key={moon.name + '_local_orbit'}
                        cx={cx}
                        cy={cy}
                        r={cr}
                        fill="none"
                        stroke={moon.color}
                        strokeWidth={1}
                        opacity={0.6}
                        vectorEffect={renderMode === 'viewport' ? undefined : "non-scaling-stroke"}
                        style={{ pointerEvents: 'none' }}
                    />
                );
            })}
        </g>
    );
});

/**
 * ControlSystemRenderer
 * 
 * Direct rendering of the NASA JPL Solar System data.
 * DUMB COMPONENT: Receives calculated state from the Engine.
 */
export const ControlSystemRenderer: React.FC<ControlSystemRendererProps> = React.memo(({ 
    center, 
    dataCenter, // NEW: Destructure dataCenter
    scaleFactor, 
    viewTransform, 
    simDate, 
    selectedBody, 
    setSelectedBody, 
    hoveredBody, 
    setHoveredBody,
    showLabels,
    showEquinox = true, 
    systemState,
    planetaryEquinoxes = [],
    bodyPositionsRef,
    renderMode = 'legacy' 
}) => {

    if (!systemState) return null;

    // VALIDATION: Ensure critical props are valid
    const safeSimDate = useMemo(() => {
        if (!simDate || !(simDate instanceof Date) || isNaN(simDate.getTime())) {
            return J2000_EPOCH;
        }
        return simDate;
    }, [simDate]);
    
    // VISUAL OPTIMIZATION: Orbit LOD
    // Hide orbits when zoomed in deep (> 5.0) to save rasterization
    const showOrbit = viewTransform.scale < 500.0; // Increased limit for Moons

    // Use Stable Static Bodies Reference if available, otherwise fallback to dynamic list
    // If staticBodies is used, this component will NOT re-render when positions change
    const orbitBodies = systemState.staticBodies || systemState.bodies;

    return (
        <g>

            
            {/* 0. Render Orbits (Background Layer) */}
            {/* Render all orbits in one memoized group */}
            {showOrbit && (
                <>
                    <ControlSystemOrbits 
                        orbits={systemState.orbits}
                        orbitPoints={systemState.orbitPoints}
                        bodies={orbitBodies} 
                        selectedBodyName={selectedBody?.name} 
                        center={center}
                        renderMode={renderMode}
                        viewTransform={viewTransform}
                        scaleFactor={scaleFactor}
                        dataCenter={dataCenter ?? center}
                    />
                    {/* DYNAMIC LOCAL ORBITS using systemState.bodies */}
                    <LocalOrbitsRenderer
                        bodies={systemState.bodies}
                        scaleFactor={scaleFactor}
                        viewTransform={viewTransform}
                        renderMode={renderMode}
                        center={center}
                        dataCenter={dataCenter ?? center}
                    />
                </>
            )}

            {systemState.bodies.map((body) => {
                let { x, y, color, name, radius_km, originalData } = body;
                // Safely handle missing originalData (Octave 2 bodies)
                const dataRef = originalData || body;
                
                const isSelected = selectedBody?.name === name;
                const isHovered = hoveredBody?.name === name;
                
                // VISUAL BOOST: Moons
                // If this is a moon and we are boosting orbits, we need to boost the body position 
                // to lie ON the boosted orbit ring.
                // Cast body to any to access parentBodyId safely
                const bAny = body as any;
                if (renderMode === 'viewport' && bAny.parentBodyId && viewTransform.scale > 0.5) {
                     const MIN_MOON_ORBIT_PX = 15;
                     
                     // Find Parent
                     const parent = systemState.bodies.find(b => b.id === bAny.parentBodyId || b.name === bAny.parentBodyId);
                     if (parent) {
                         const dx = x - parent.x;
                         const dy = y - parent.y;
                         const worldDist = Math.sqrt(dx*dx + dy*dy);
                         const screenDist = worldDist * viewTransform.scale;
                         
                         // If visually inside the minimum ring, Push it out
                         if (screenDist < MIN_MOON_ORBIT_PX) {
                             const boostFactor = MIN_MOON_ORBIT_PX / Math.max(0.001, screenDist);
                             const newDx = dx * boostFactor; // In World Space? No, Screen Space?
                             // wait, boostFactor is ratio. So applies to world vector too?
                             // screenDist = worldDist * scale.
                             // targetScreenDist = MIN.
                             // targetWorldDist = MIN / scale.
                             // ratio = targetWorldDist / worldDist = (MIN/scale) / worldDist = MIN / (worldDist * scale) = MIN / screenDist.
                             // Yes.
                             
                             // Update x/y to be visually separate
                             // NOTE: This modifies local var x,y, not the state
                             x = parent.x + (dx * boostFactor);
                             y = parent.y + (dy * boostFactor);
                         }
                     }
                }

                // Visual Radius calculation
                // Dynamic Scaling: Grow by sqrt(scale) when zoomed in (>1) to match Harmonic view
                const growthFactor = viewTransform.scale < 1 
                    ? 1 
                    : Math.pow(viewTransform.scale, 0.5);

                const viewportRadius = 4 * growthFactor; 
                const dotRadius = renderMode === 'viewport' 
                    ? viewportRadius 
                    : Math.max(3, (8 / viewTransform.scale) * growthFactor); 
                
                const finalRadius = dotRadius; 

                // CALCULATE SCREEN POSITION
                const origin = dataCenter ?? center;
                let screenX, screenY;
                if (renderMode === 'viewport') {
                    // FIX (2026-02-15): Pivot around 'center', unprojecting from 'origin'
                    // Formula: (WorldPos - Origin) * Scale + Center + Pan
                    screenX = (x - origin) * viewTransform.scale + center + viewTransform.x;
                    screenY = (y - origin) * viewTransform.scale + center + viewTransform.y;
                } else {
                    // Legacy: Position is just World Position (Parent Group handles transform)
                    screenX = viewTransform.x + x * viewTransform.scale; // For culling check only
                    screenY = viewTransform.y + y * viewTransform.scale;
                }

                // VISUAL OPTIMIZATION: Viewport Culling
                // Don't render if off-screen (with generous margin for safety)
                const margin = 500; // Pixels
                if (screenX < -margin || screenX > 2500 || screenY < -margin || screenY > 1500) {
                     return null;
                }

                // UPDATE UI POSITION REF (Main thread side-effect)
                if (bodyPositionsRef.current) {
                    bodyPositionsRef.current.set(name, { x, y });
                }

                return (
                    <g key={name}>
                        {/* Planet Body */}
                        <g 
                            transform={`translate(${renderMode === 'viewport' ? screenX.toFixed(2) : x.toFixed(2)}, ${renderMode === 'viewport' ? screenY.toFixed(2) : y.toFixed(2)})`} 
                            onMouseEnter={() => setHoveredBody({ ...dataRef, id: name })}
                            onMouseLeave={() => setHoveredBody(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBody({ ...dataRef, id: name });
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <circle
                                r={finalRadius}
                                fill={color}
                                stroke="none"
                            />
                            



                            {/* EQUINOX DIRECTION ARROW */}
                            {showEquinox && (() => {
                                const eqData = planetaryEquinoxes.find(e => e?.planet.toLowerCase() === name.toLowerCase());
                                if (!eqData) return null;
                                
                                const equinoxAngleDeg = eqData.equinoxAngle;
                                const length = renderMode === 'viewport' ? 35 : 35 / viewTransform.scale;
                                const arrowScale = renderMode === 'viewport' ? 1.3 : 1.3 / viewTransform.scale;
                                
                                return (
                                    <g opacity={0.8} transform={`rotate(${equinoxAngleDeg})`}> 
                                        <line 
                                            x1={0} y1={0} 
                                            x2={length} y2={0} 
                                            stroke={color} 
                                            strokeWidth={1.5} 
                                            vectorEffect={renderMode === 'viewport' ? undefined : "non-scaling-stroke"}
                                        />
                                        <path
                                            d="M -6 -5 L 0 0 L -6 5"
                                            transform={`translate(${length}, 0) scale(${arrowScale})`}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth={1.5}
                                            vectorEffect={renderMode === 'viewport' ? undefined : "non-scaling-stroke"}
                                        />
                                    </g>
                                );
                            })()}
                            
                            {/* Selection Ring */}
                            {isSelected && (
                                <circle
                                    r={finalRadius * 1.8}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth={1.5}
                                    vectorEffect={renderMode === 'viewport' ? undefined : "non-scaling-stroke"}
                                    opacity={0.8}
                                />
                            )}
                            
                            {/* Label */}
                            {(isSelected || isHovered || showLabels) && (
                                    <text
                                        y={renderMode === 'viewport' 
                                            ? -finalRadius - 12 
                                            : -dotRadius - (12 / viewTransform.scale)}
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize={renderMode === 'viewport' 
                                            ? 11 // Fixed size in Screen Pixels
                                            : (11 / viewTransform.scale)} // Fixed size in World Units
                                        fontWeight="bold"
                                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)', pointerEvents: 'none' }}
                                    >
                                        {(() => {
                                            let displayName = name.toUpperCase();
                                            if (displayName.includes('PREDICTED ORBIT') || displayName.includes('Predicted Orbit')) {
                                                const match = displayName.match(/\[(\d+)\]/);
                                                if (match) {
                                                    displayName = `[${match[1]}] ORBIT`;
                                                } else {
                                                    displayName = 'ORBIT';
                                                }
                                            }
                                            return displayName;
                                        })()}
                                    </text>
                            )}
                        </g>
                    </g>
                );
            })}
        </g>
    );
});
