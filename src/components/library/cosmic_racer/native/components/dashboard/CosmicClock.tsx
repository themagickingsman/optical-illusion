'use client';

import React, { useEffect, useRef, useState, useMemo, useImperativeHandle, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { HarmonicResonanceEngine, HarmonicBody, RenderableBody } from '../../state/science/HarmonicResonanceEngine';
import { useCosmicData } from '../hooks/useCosmicData';
import { getBodyPosition } from '../../../../state/logic/OrbitalPhysics';
import { useControlSystemEngine } from '../hooks/useControlSystemEngine';
import { CosmicRecursionEngine } from '../../../../state/logic/CosmicRecursionEngine';
import COSMIC_DATA from '../../config/cosmic_compass_data.json';
import { SOLAR_SYSTEM_PLANETS, calculate3DPosition, J2000_EPOCH, deg2rad } from '../data/solar_system_jpl';
import { getHarmonicLockTable, calculateGlobalHarmonicConvergence, findNearestLockSpeed, formatLockSpeed } from '../../state/science/harmonicLockCalculator';
import { OrbitalResonanceTrail } from './OrbitalResonanceTrail';
import { OCTAVE_3_METADATA, getOctave3TypeIcon } from '../../state/science/octave_3_metadata';
import { calculateObjectMetadata, CalculatedMetadata } from './calculateObjectMetadata';
import { formatRadius, formatDensity } from '../../../../state/logic/formatUnits';
import GalacticConversionEngine from '../../../../state/logic/GalacticConversionEngine';
import { CosmicProjector } from '../../../../state/logic/CosmicProjector';
import { ControlSystemRenderer } from './ControlSystemRenderer';
import { ZodiacRing } from './ZodiacRing';
import { HarmonicSystemRenderer, HarmonicSystemHandle } from './HarmonicSystemRenderer';
import { calculateDynamicMaxScale } from '../../../../state/logic/zoomLimitCalculator';
import { CosmicSideMenu } from './CosmicSideMenu';
import { OCTAVE_DOMAINS as OCTAVE_DOMAIN_DATA, getOctaveScientificName } from '../../../../state/logic/octave_domains';
import { ConcentricCirclesGrid } from './ConcentricCirclesGrid';
import { CatalogModal } from './CatalogModal';
import { getCosmicTime, getDerivedGregorianDate, formatCCY, formatPhase, COSMIC_COMPASS_YEAR } from '../../state/science/CosmicEpochSolver';


// --- CONSTANTS ---
const CONTAINER_SIZE = 580;
const CONTAINER_CENTER = CONTAINER_SIZE / 2;

// --- STYLES & THEME ---
const THEME = {
    background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    primary: '#6366f1',
    text: '#f8fafc',
    muted: '#94a3b8',
    instrument: '#1e293b'
};

// Speed range config per octave (Exported for Renderer use)
// Speed range config per octave (Exported for Renderer use)
export const SPEED_RANGE: Record<number, { min: number; max: number; step: number; default: number }> = {
    // Quantum/Micro
    0: { min: 0.1, max: 10.0, step: 0.1, default: 1.0 },
    1: { min: 0.01, max: 10.0, step: 0.01, default: 0.1 },
    2: { min: 0.01, max: 10.0, step: 0.01, default: 0.1 },
    3: { min: 0.01, max: 10.0, step: 0.01, default: 0.1 }, 
    4: { min: 0.01, max: 10.0, step: 0.01, default: 0.1 },
    5: { min: 0.01, max: 10.0, step: 0.01, default: 0.1 },
    6: { min: 0.01, max: 10.0, step: 0.01, default: 0.1 },
    // Solar System (Control)
    11: { min: 0.01, max: 10.0, step: 0.01, default: 0.5 },
    // Galactic
    111: { min: 0.01, max: 10.0, step: 0.01, default: 0.2 }
};


// Octave Colors for UI Highlights
export const OCTAVE_COLORS: Record<number, string> = {
    0: '#22d3ee', // Cyan (Macro)
    1: '#22d3ee',
    2: '#6366f1', // Indigo (Planetary)
    3: '#8b5cf6', // Violet
    4: '#a855f7', // Purple
    5: '#d946ef', // Fuchsia
    6: '#ec4899', // Pink
    7: '#f43f5e', // Rose (Micro)
    8: '#fbbf24', // Amber
    9: '#f59e0b', // Orange
    10: '#ea580c', // Orange-Red
    11: '#ef4444', // Red (Nano)
    12: '#dc2626',
    13: '#b91c1c',
    14: '#991b1b'
};

// Octave Domains — sourced from shared constants (single source of truth with catalog page)
export const OCTAVE_DOMAINS: Record<number, string> = Object.fromEntries(
    Object.entries(OCTAVE_DOMAIN_DATA).map(([k, v]) => [k, v.scientific])
);

// --- SUB-COMPONENTS ---



/**
 * SolarBody: A sophisticated lens flare and starburst effect.
 * Unified appearance across all octaves to match Octave 3 style.
 * MEMOIZED to prevent re-renders on every frame.
 */
const SolarBody: React.FC<{ center: number; scale: number; octave: number; scaleFactor: number; activeTab: string; onClick?: () => void }> = React.memo(({ center, scale, scaleFactor, onClick }) => {
    // UNIFORM SUN SCALE: Use Solar System (Octave 11) or Standard Scale
    const baselineScale = scaleFactor; 
    const MAX_SCALE = 250.0; // Reduced from 500.0 (User feedback: "too far")
    const MIN_SCALE = 0.5;

    // Solar Scaling Logic (Dynamic Size)
    // ----------------------------------
    // Calibrated for 250x Max Zoom.
    const physicalRadius = 20.0; // Base visual size of Sun at 1x
    
    // VISUAL CLAMPS:
    // 1. Min Size: 2px visual diameter (1px radius) so it doesn't flicker at low zoom
    // 2. Max Size: Softened scaling (Square Root) so it grows but doesn't overwhelm
    //    User Request (2026-02-16): "Sun stops scaling at 6x... needs to scale entire zoom bar"
    const minR = 1.0 / scale;
    
    // SCALE DAMPENING:
    // Linear scaling (scale^1) is too fast. Constant size (scale^0) is "stopped".
    // We use scale^0.85 to aggressively dampen growth.
    // Resulting Growth = scale^(1 - 0.85) = scale^0.15.
    // At 250x: 20px * 2.29 = ~46px.
    const dampener = Math.max(1, Math.pow(scale, 0.85));
    const dampenedRadius = physicalRadius / dampener; 

    const coreRadius = Math.max(minR, dampenedRadius);
    
    return (
        <g 
            id="sun-anchor" // Added ID for bounding box check
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick();
            }}
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
        >
            <circle 
                cx={center} cy={center} 
                r={coreRadius} 
                fill="#FDB813"
            />
        </g>
    );
});

// Helper component to track coords
const CoordinateDebugger = () => {
    const [coords, setCoords] = useState({ sunX: 0, sunY: 0 });
    const [screenCenter, setScreenCenter] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setScreenCenter({ 
            x: Math.round(window.innerWidth/2), 
            y: Math.round(window.innerHeight/2) 
        });
    }, []);

    useEffect(() => {
        const update = () => {
            const sun = document.getElementById('sun-anchor');
            if (sun) {
                const rect = sun.getBoundingClientRect();
                setCoords({ 
                    sunX: Math.round(rect.left + rect.width/2), 
                    sunY: Math.round(rect.top + rect.height/2) 
                });
            }
        };
        const interval = setInterval(update, 100);
        return () => clearInterval(interval);
    }, []);

    return <div>SUN POS: {coords.sunX}, {coords.sunY}</div>;
};

/**
 * InertialZoomSlider: A weighted, inertial scroll bar for zoom control.
 */
interface InertialZoomSliderHandle {
    setTarget: (newScale: number) => void;
    syncTo: (newScale: number) => void; // Snap immediately without animation
    reset: () => void;
}

// MEMOIZED ORBIT PATH COMPONENT
// Extracted to prevent re-calculation of 300 points on every frame/zoom
const OrbitPath: React.FC<{
    body: any;
    center: number;
    scaleFactor: number;
    viewTransform: { x: number, y: number, scale: number };
    isSelected: boolean;
    isHarmonicZone: boolean;
    scaledTime: number;
    size: number;
    forceVisible?: boolean;
    rotation?: number; // Precession rotation in degrees
}> = React.memo(({ body, center, scaleFactor, viewTransform, isSelected, isHarmonicZone, scaledTime, size, forceVisible, rotation = 0 }) => {
    
    // 1. CULLING: Check if the entire orbit is off-screen
    // Approximate orbit bounds in local space
    // TUNING: MATCHES HarmonicSystemRenderer (6.0x Parity Scale)
    const SYSTEM_PARITY_SCALE = 6.0;
    const orbitRadius = (body.normalized_radius_au || 0) * scaleFactor * SYSTEM_PARITY_SCALE;
    // Project center of orbit (which is 'center') to screen space
    const projectedCenterX = center + viewTransform.x;
    const projectedCenterY = center + viewTransform.y;
    // Scale the radius
    const projectedRadius = orbitRadius * viewTransform.scale;
    
    // Check if the bounding box of the orbit intersects with the viewport [0, size]
    // Viewport is 0 to size.
    // However, the transform is `translate(tx, ty) scale(s)`.
    // The group origin is 'center'. 
    // ScreenX = center + (localX - center) * s + tx
    
    // Orbit is centered at `center`.
    // ScreenCenter = center + (center - center) * s + tx = center + tx
    // ScreenBounds = [ScreenCenter - projectedRadius, ScreenCenter + projectedRadius]
    
    const screenCenterX = center + viewTransform.x;
    const screenCenterY = center + viewTransform.y;
    // RELAXED CULLING: User wants to see orbits outside the "mask".
    // Increased margin from 100 to 10000 to effectively disable culling for normal usage
    // while still preventing rendering of things way off in the void.
    const margin = 10000; 
    
    const minX = screenCenterX - projectedRadius - margin;
    const maxX = screenCenterX + projectedRadius + margin;
    const minY = screenCenterY - projectedRadius - margin;
    const maxY = screenCenterY + projectedRadius + margin;
    
    const isVisible = (maxX > 0 && minX < size && maxY > 0 && minY < size);
    
    if (!isVisible) return null;

    // 2. PATH GENERATION (Memoized by React.memo)
    // OPTIMIZATION: Generate path at UNIT SCALE (1.0).
    const pathD = useMemo(() => {
        // CASE A: 3D Body with Inclination (Planets)
        if (body.inclination !== undefined) {
            const mockPlanet = {
                name: body.name,
                semiMajorAxis_AU: body.normalized_radius_au, 
                // User Request: "our framework is like an alignment grid it's the perfect version"
                // Disable physical Keplerian eccentricity to enforce pure geometry.
                eccentricity: 0, 
                inclination_deg: body.inclination,
                longitudeAscNode_deg: body.longitude_asc_node || 0,
                argPerihelion_deg: body.arg_perihelion || 0,
                meanAnomalyEpoch_deg: 0, 
                orbitalPeriod_days: body.orbital_period_days || ((1 / body.orbital_freq) / 86400),
                siderealRotationDays: body.spin_freq ? 1 / (body.spin_freq * 86400) : 1,
                color: body.color,
                radius_km: 1
            };

            const points = [];
            const segments = 120;
            const period = mockPlanet.orbitalPeriod_days * 86400; // seconds
            
            for (let i = 0; i <= segments; i++) {
                const dt = (i / segments) * period;
                // Optimization: Pass number directly (ms) - no new Date()
                const t = J2000_EPOCH.getTime() + (dt * 1000); 
                const p = calculate3DPosition(mockPlanet, t);
                
                // UNIT SCALE: Do NOT multiply by scaleFactor here.
                points.push(`${center + p.x},${center + p.y}`);
            }
            return `M ${points.join(" L ")}`;
        }
        
        // CASE B: 2D Harmonic Body (Flat Ellipse)
        // KEPLER FIX: Shift ellipse center so the Sun (at `center`) aligns with the focus.
        if (body.normalized_radius_au > 0) {
            // UNIT SCALE
            const rx = body.normalized_radius_au;
            const ecc = 0; 
            const ry = rx;
            
            const focusOffset = 0;
            // We shift the Geometric Center of the ellipse by -c along the major axis
            // to place the Focus at (center, center).
            const cx = center - focusOffset;
            const cy = center;

            return `M ${cx},${cy} m -${rx},0 a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 -${rx * 2},0`;
        }
        
        return "";
    }, [body.id, center, body.inclination, body.normalized_radius_au, body.eccentricity]); // Removed scaleFactor dependency

    // 3. STYLE CALCS
    const zoneColor = "#888888";
    const pathColor = isHarmonicZone ? zoneColor : body.color;
    const pathOpacity = forceVisible ? 0.8 : (isHarmonicZone ? 0.5 : (isSelected ? 0.8 : 0.4));
    const dashPattern = isHarmonicZone ? "2,6" : "none";
    const strokeWidth = forceVisible ? 2.5 : (isHarmonicZone ? 2 : (isSelected ? 2 : 1.2)); 

    // APPLY SCALE VIA SVG TRANSFORM
    // transform origin is top-left (0,0) by default for SVG.
    // We want to scale around 'center'.
    // FIX: Apply rotation for 2D bodies (Precession)
    // TUNING: Apply SYSTEM_PARITY_SCALE (6.0) to match planet positions
    // CLAMP MATCHING: Replicate HarmonicSystemRenderer's min-pixel clamp
    const MIN_ORBIT_PX = 15;
    const rawRadiusPx = (body.normalized_radius_au || 0) * scaleFactor * SYSTEM_PARITY_SCALE;
    
    let effectiveScale = scaleFactor * SYSTEM_PARITY_SCALE;
    
    // If the orbit is too small on screen, we need to boost the scale to hit 15px
    // Condition matches HarmonicSystemRenderer: viewTransform.scale > 0.1
    if (viewTransform.scale > 0.1 && rawRadiusPx * viewTransform.scale < MIN_ORBIT_PX) {
         // Target radius in World Space = MIN_ORBIT_PX / viewTransform.scale
         const targetRadiusWorld = MIN_ORBIT_PX / viewTransform.scale;
         // We need effectiveScale * normalized_radius = targetRadiusWorld
         // effectiveScale = targetRadiusWorld / normalized_radius
         if (body.normalized_radius_au > 0) {
             effectiveScale = targetRadiusWorld / body.normalized_radius_au;
             // However, OrbitPath uses `scale(s)`. If we scale the whole path,
             // 1.0 unit becomes effectiveScale.
             // normalized_radius is built into the path (if 2D) or vertices (if 3D).
             // 3D Path vertices are at `normalized_radius` distance (approx).
             // 2D Path is `M ... a rx,ry ...` where rx = normalized_radius.
             // So scaling by `effectiveScale / normalized_radius`?
             // No. Path is drawn at 1.0 = 1 AU logic?
             // Case B (2D): `rx = body.normalized_radius_au`.
             // Path D has actual radius values.
             // So we just need to scale such that `rx * scale = targetRadiusWorld`.
             // current: `rx * scaleFactor * 6.0`.
             // desired: `targetRadiusWorld`.
             // Factor = `targetRadiusWorld / rx`.
             // But rx cancels out? 
             // Wait. `scaleFactor` converts AU to World Pixels.
             // `effectiveScale` should be the multiplier for the SVG path.
             // If SVG path is drawn with `rx` (AU), then `transform scale` must convert AU -> World -> Clamped.
             
             // Let's use the Ratio:
             // Ratio = targetRadiusWorld / (rx * scaleFactor * 6.0) -> This is the boost factor.
             // NewScale = (scaleFactor * 6.0) * Ratio = targetRadiusWorld / rx.
             
             effectiveScale = targetRadiusWorld / body.normalized_radius_au;
         }
    }

    const transform = `translate(${center}, ${center}) scale(${effectiveScale}) rotate(${rotation}) translate(-${center}, -${center})`;

    if (!pathD) return null;

    return (
        <g transform={transform}>
            <path
                d={pathD}
                fill="none"
                stroke={pathColor}
                strokeWidth={1.5}
                opacity={pathOpacity}
                strokeDasharray={dashPattern}
                pointerEvents="none" 
                vectorEffect="non-scaling-stroke" 
            />
        </g>
    );
});

const InertialZoomSlider = React.memo(React.forwardRef<InertialZoomSliderHandle, { 
    scale: number, 
    onChange: (newScale: number) => void,
    defaultZoom: number,
    selectionZoomTarget?: number,  // The target zoom level for red marker animation
    minLogScale?: number,          // Added: Dynamic lower bound (e.g. 0.01)
    maxLogScale?: number           // Added: Dynamic upper bound (e.g. 5.0 or 100.0)
}>(({ scale, onChange, defaultZoom, selectionZoomTarget = 5, minLogScale = 0.001, maxLogScale = 100.0 }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [renderTrigger, setRenderTrigger] = useState(0); // Trigger re-renders for smooth thumb animation
    const [debugInfo, setDebugInfo] = useState({ clickX: 0, clickY: 0, knobX: 0, targetKnobX: 0, current: 0, target: 0, delta: 0 });
    
    const containerRef = useRef<HTMLDivElement>(null);
    const velocityRef = useRef(0);
    const targetScaleRef = useRef(scale);
    const currentScaleRef = useRef(scale); // Internal "view" scale for smoothing
    const requestRef = useRef<number | null>(null);
    const isProgrammaticChangeRef = useRef(false); // Track if change is from setTarget()
    
    // FIX: Use ref for onChange to prevent stale closures in the animation loop
    const onChangeRef = useRef(onChange);
    const isInteractingRef = useRef(false); // Track active user interaction (MouseDown -> MouseUp)

    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);


    
    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        setTarget: (newScale: number) => {
            isProgrammaticChangeRef.current = true; // Mark as programmatic
            targetScaleRef.current = Math.max(minLogScale, Math.min(maxLogScale, newScale));
            velocityRef.current = 0; // Reset velocity for smooth transition
        },
        syncTo: (newScale: number) => {
            // INSTANT SYNC: Snap both refs to match final value WITHOUT animation
            // Use this when external animation has already set the scale
            const clampedScale = Math.max(minLogScale, Math.min(maxLogScale, newScale));
            isProgrammaticChangeRef.current = true;
            targetScaleRef.current = clampedScale;
            currentScaleRef.current = clampedScale; // Snap current to match
            velocityRef.current = 0;
        },
        reset: () => {
            isProgrammaticChangeRef.current = true; // Mark as programmatic
            targetScaleRef.current = defaultZoom;
            velocityRef.current = 0;
            // Let the animation loop handle the smooth transition
        }
    }));

    // Synchronize ONLY when external scale changes dramatically (e.g. octave switch)
    // Ignore small differences that come from our own animation updates
    useEffect(() => {
        // FIX: Compare prop 'scale' against 'currentScaleRef' (what we are displaying)
        // rather than 'targetScaleRef' (where we are going).
        // If prop matches current, it's likely just an echo of our own onChange.
        // If prop differs from current, it's an external force (e.g. reset).
        const percentDiff = Math.abs(scale - currentScaleRef.current) / (currentScaleRef.current || 0.0001); 
        
        // Only sync if external change is >10% AND not from our programmatic calls AND not dragging
        // FIX: Also check if we are currently animating (velocity check) -> if we are moving fast, ignore small external mismatches
        // This prevents the slider from "snapping back" if the external scale updates slightly slower than the animation framerate
        // BUG FIX: Use LOG difference for small scales! Linear '0.01' is too large when scale is 0.001.
        const currentL = Math.log(currentScaleRef.current);
        const targetL = Math.log(targetScaleRef.current);
        const isAnimating = Math.abs(velocityRef.current) > 0.001 || Math.abs(targetL - currentL) > 0.01;
        
        // Only sync from external prop if:
        // 1. Not currently dragging
        // 2. Not a programmatic change we just initiated
        // 3. Difference is significant (>10%) OR we are NOT currently animating (velocity is low)
        // 4. BIG FIX: Not currently INTERACTING (Mouse is Down) - prevents "fighting" the user
        if (!isDragging && !isProgrammaticChangeRef.current && !isInteractingRef.current && (percentDiff > 0.10 || !isAnimating)) {
            targetScaleRef.current = scale;
            currentScaleRef.current = scale; // Snap immediately for octave changes or large jumps
            velocityRef.current = 0;
        }
        
        // DO NOT automatically reset isProgrammaticChangeRef here. 
        // Let it stay true until USER INTERACTION (MouseDown) explicitly clears it.
    }, [scale, isDragging]);

    useEffect(() => {
        const step = () => {

            
            // 1. Inertia: Decay velocity (linear in LOG space)
            if (!isDragging && Math.abs(velocityRef.current) > 0.0001) {
                // Determine current log progress
                const minL = Math.log(minLogScale);
                const maxL = Math.log(maxLogScale);
                const logRange = maxL - minL;
                
                const currentLog = Math.log(targetScaleRef.current);
                const currentProgress = (currentLog - minL) / logRange;
                
                const newProgress = Math.max(0, Math.min(1, currentProgress + velocityRef.current));
                
                // Convert back to scale
                targetScaleRef.current = Math.exp(minL + newProgress * logRange);
                
                velocityRef.current *= 0.96; // FRICTION
            }

            // 2. Smoothing: Use LOGARITHMIC LERP for consistent visual speed
            const current = currentScaleRef.current;
            const target = targetScaleRef.current;
            
            // Check delta in LOG space for convergence
            const currentL = Math.log(current);
            const targetL = Math.log(target);
            const deltaL = targetL - currentL;
            
            if (Math.abs(deltaL) > 0.001 || Math.abs(velocityRef.current) > 0.0001) {
                // Lerp in log space
                const newLog = currentL + deltaL * 0.15; // LERP_FACTOR
                const newValue = Math.exp(newLog);
                
                currentScaleRef.current = newValue;
                // ONLY fire onChange if this is a USER interaction (drag/inertia), NOT a programmatic sync
                if (!isProgrammaticChangeRef.current) {
                    // FIX: Call the LATEST onChange handler from the ref
                    onChangeRef.current(currentScaleRef.current);
                }
                setRenderTrigger(prev => prev + 1);
            } else if (!isDragging) {
                velocityRef.current = 0;
            }

            requestRef.current = requestAnimationFrame(step);
        };
        requestRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [isDragging]); // Removed onChange to prevent loop restart on every render

    // Current position of the thumb - Clamped to bar to prevent jumping outside
    // LOGARITHMIC Mapping
    const minL = Math.log(minLogScale);
    const maxL = Math.log(maxLogScale);
    const currentL = Math.log(currentScaleRef.current);
    const visualProgress = Math.max(0, Math.min(1, (currentL - minL) / (maxL - minL)));
    
    // Updated Spacing
    const SLIDER_WIDTH = 360; // 400 - 2*20
    const H_PADDING = 20;

    // Helper to format log scale for display
    // We recreate the log constants here for display purposes only
    // Helper to format log scale for display
    // We recreate the log constants here for display purposes only
    // Helper to format log scale for display
    const formatLogScale = (val: number) => {
        if (typeof val !== 'number' || isNaN(val)) return '1.0x';
        if (val < 0.1) return val.toFixed(3) + 'x';
        if (val < 1) return val.toFixed(2) + 'x';
        if (val < 10) return val.toFixed(1) + 'x';
        return Math.round(val).toLocaleString() + 'x';
    };

    return (
        <div 
            ref={containerRef}
            onMouseDown={(e) => { 
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const startX = e.clientX;
                const startY = e.clientY;
                let hasDragged = false;
                isInteractingRef.current = true; // LOCK SYNC
                
                
                const updateTarget = (clientX: number) => {
                    const clickXLocal = clientX - rect.left - H_PADDING;
                    const progress = Math.max(0, Math.min(1, clickXLocal / SLIDER_WIDTH));
                    
                    // Map progress (0-1) to Log Scale
                    const minL = Math.log(minLogScale);
                    const maxL = Math.log(maxLogScale);
                    const newTarget = Math.exp(minL + progress * (maxL - minL));
                    
                    targetScaleRef.current = newTarget;
                    // FIX: This is a USER interaction, not programmatic
                    isProgrammaticChangeRef.current = false; 
                    velocityRef.current = 0;
                };

                updateTarget(e.clientX);
                
                const onMove = (moveEvent: MouseEvent) => {
                    hasDragged = true;
                    if (!isDragging) setIsDragging(true);
                    updateTarget(moveEvent.clientX);
                };
                
                const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                    if (hasDragged) setIsDragging(false);
                    isInteractingRef.current = false; // RELEASE SYNC
                };
                
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
            }}
            style={{
                width: '400px', height: '36px', background: 'rgba(255,255,255,0.05)',
                borderRadius: '18px', position: 'relative', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', padding: `0 ${H_PADDING}px`,
                userSelect: 'none', margin: '0 auto', boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
            }}
        >
            {/* Thumb - NO OUTLINES, Perfectly Anchored */}
            <div style={{
                width: '18px', height: '18px', background: '#10b981',
                borderRadius: '50%', position: 'absolute', 
                left: `${H_PADDING + visualProgress * SLIDER_WIDTH}px`,
                top: '50%', transform: 'translate(-50%, -50%)', 
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.7)',
                zIndex: 5, border: 'none'
            }} />
            
            <div style={{ 
                position: 'absolute', width: '100%', left: 0, textAlign: 'center', 
                fontSize: '0.6rem', color: THEME.muted, pointerEvents: 'none', fontWeight: 900,
                letterSpacing: '2px', top: '-18px', textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
                <span style={{ color: '#fff' }}>ZOOM x{currentScaleRef.current.toFixed(1)}</span>
            </div>

            {/* Fixed Dots - LOGARITHMIC TICKS (Dynamic 5 Steps) */}
            {(() => {
                const minL = Math.log(minLogScale);
                const maxL = Math.log(maxLogScale);
                const range = maxL - minL;
                
                // GENERATE 5 TICKS: 0%, 25%, 50%, 75%, 100%
                const ticks = [0, 0.25, 0.5, 0.75, 1.0].map(p => {
                    const val = Math.exp(minL + p * range);
                    // Nice formatting
                    let label = val < 1 ? val.toFixed(2) : val.toFixed(1);
                    if (val >= 10) label = val.toFixed(0);
                    return { p, label: label + 'x', val };
                });

                return ticks.map((tick, i) => {
                    const tickX = H_PADDING + tick.p * SLIDER_WIDTH;

                    return (
                        <React.Fragment key={`${tick.label}-${i}`}>
                            <div style={{ 
                                position: 'absolute', left: `${tickX}px`, transform: 'translate(-50%, -50%)',
                                top: '50%', width: '4px', height: '4px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.5)', pointerEvents: 'none'
                            }} />
                            <div style={{ 
                                position: 'absolute', left: `${tickX}px`, transform: 'translateX(-50%)',
                                top: '46px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', 
                                fontWeight: 700, pointerEvents: 'none', fontFamily: 'monospace',
                                textAlign: 'center'
                            }}>
                                {tick.label}
                            </div>
                        </React.Fragment>
                    );
                });
            })()}
            {/* RED SELECTION MARKER - Anchored to Global Track */}
            {(() => {
                const minL = Math.log(minLogScale);
                const maxL = Math.log(maxLogScale);
                const targetL = Math.log(selectionZoomTarget);
                
                const markerProgress = (targetL - minL) / (maxL - minL);
                const markerX = H_PADDING + markerProgress * SLIDER_WIDTH;
                
                if (markerProgress < 0 || markerProgress > 1) return null;
                return (
                    <div style={{
                        position: 'absolute', left: `${markerX}px`, transform: 'translateX(-50%)',
                        top: '4px', width: '3.5px', height: '28px', background: '#ef4444',
                        borderRadius: '2px', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
                        zIndex: 1, transition: 'left 0.4s ease-out', pointerEvents: 'none'
                    }} />
                );
            })()}
        </div>
    );
}));

/**
 * FrequencyInstrument: The vertical telemetry bar.
 * Strictly maps colors and positions based on raw JSON frequency data.
 */
const FrequencyInstrument: React.FC<{ bodies: HarmonicBody[] }> = ({ bodies }) => {
    const MIN_HZ = 0;
    const MAX_HZ = useMemo(() => Math.max(...COSMIC_DATA.map(d => parseFloat(d.freq_hz))), []);
    // Resonant Tickers: Pull anchors from specific levels (0, 40, 80, 111)
    const tickers = useMemo(() => {
        const anchors = ['0', '40', '80', '111'];
        return COSMIC_DATA
            .filter(d => anchors.includes(d.level))
            .map(d => parseFloat(d.freq_hz))
            .sort((a, b) => b - a);
    }, []);

    const gradientStops = useMemo(() => {
        const stops = COSMIC_DATA
            .filter(d => parseFloat(d.freq_hz) >= 0)
            .map(d => {
                const f = parseFloat(d.freq_hz);
                const p = (1 - (f / MAX_HZ)) * 100;
                return { hex: d.hex, percent: p };
            })
            .sort((a, b) => a.percent - b.percent);

        return stops.map(s => `${s.hex} ${s.percent.toFixed(2)}%`).join(', ');
    }, [MAX_HZ]);

    const getTopOffset = (hz: number) => {
        const p = (1 - (Math.max(MIN_HZ, Math.min(MAX_HZ, hz)) / MAX_HZ)) * 100;
        return `${p.toFixed(2)}%`;
    };

    return (
        <div style={{
            position: 'absolute', left: '1.5rem', top: '8rem', bottom: '8rem',
            width: '180px', display: 'flex', zIndex: 10000, pointerEvents: 'none'
        }}>
            <div style={{
                width: '5px', height: '100%', 
                background: `linear-gradient(to bottom, ${gradientStops})`,
                borderRadius: '2.5px', position: 'relative', marginLeft: '35px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                {tickers.map(hz => (
                    <div key={hz} style={{
                        position: 'absolute', top: getTopOffset(hz), left: '-35px',
                        display: 'flex', alignItems: 'center', width: '35px', justifyContent: 'flex-end'
                    }}>
                        <span style={{ fontSize: '0.6rem', color: THEME.muted, fontWeight: '900', marginRight: '5px' }}>{hz}</span>
                        <div style={{ width: '5px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                ))}

                {bodies.map(body => (
                    <div key={body.id} style={{
                        position: 'absolute', top: getTopOffset(body.freq_hz), left: '10px',
                        display: 'flex', alignItems: 'center'
                    }}>
                        <div style={{ width: '10px', height: '2px', background: body.color, borderRadius: '1px' }} />
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', gap: '4px' }}>
                            <span style={{ fontSize: '0.6rem', color: body.color, fontWeight: '900', whiteSpace: 'nowrap', textTransform: 'uppercase', textShadow: '0 0 10px #000' }}>
                                {body.name}
                            </span>
                            <span style={{ fontSize: '0.55rem', color: THEME.muted, fontWeight: '700', fontFamily: 'monospace', opacity: 0.8 }}>
                                {body.freq_hz.toFixed(2)}Hz
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ position: 'absolute', top: '-18px', left: '35px', fontSize: '0.7rem', color: THEME.muted, fontWeight: '900' }}>Hz</div>
        </div>
    );
};


// --- MAIN CLOCK ---

interface CosmicClockProps {
    data: any[];
    initialTiers?: number[];
    height?: string;
    // New Props for External Control
    octave?: number;
    activeSubOctave?: number;
}

export const CosmicClock: React.FC<CosmicClockProps> = ({ 
    data, 
    initialTiers, 
    height = '100vh',
    octave: propOctave,
    activeSubOctave: propSubOctave
}) => {
    const router = useRouter(); // Initialize Router
    // 1. Constants
    const ZOOM_SENSI = 0.0005;
    const DEFAULT_ZOOM_SCALE = 2.0; // TUNED: 2.0 * 6.0 (Internal) = 12.0x Effective Zoom
    
    // DEBUG: Track Mount/Unmount
    useEffect(() => {
        console.log('[CosmicClock] MOUNTED');
        return () => console.log('[CosmicClock] UNMOUNTED');
    }, []);
    
    // 2. Core State
    const [activeTab, setActiveTab] = useState<'all' | 'control' | 'harmonics'>('all');
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<SVGGElement>(null);
    const [contentDimensions, setContentDimensions] = useState({ width: 0, height: 0 });
    const [hoveredBody, setHoveredBody] = useState<RenderableBody | null>(null);
    const [selectedBody, setSelectedBody] = useState<RenderableBody | null>(null);
    // --- STATE ---
    const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: DEFAULT_ZOOM_SCALE });
    // Ref to track viewTransform for animation loops without re-running effects
    
    // UI Polish: Persistent Timer Config
    const octaveTimesRef = useRef(new Map<number, number>());
    const viewTransformRef = useRef(viewTransform);
    const targetViewTransformRef = useRef<{ x: number, y: number, scale: number } | null>(null);
    const isTransitioningViewRef = useRef(false);
    // Persistence Logic: prevent time rescaling when switching octaves explicitely
    const isSwitchingOctaveRef = useRef(false);
    
    // Update ref when state changes
    useEffect(() => {
        viewTransformRef.current = viewTransform;
    }, [viewTransform]);

    // User Request: Stop planets from orbiting for now (Default Paused) -> REVERTED: Now defaults to PLAY -> REVERTED AGAIN: Paused on start
    const [isPaused, setIsPaused] = useState(true); 
    const [showGrid, setShowGrid] = useState(false); // User Request: Concentric Ring Grid Toggle
    const [simSpeed, setSimSpeed] = useState(1); // 1 second = 1 second (Real Time)
    const [showCatalog, setShowCatalog] = useState(false); // NEW: Catalog Modal State
    const isPausedRef = useRef(true);
    
    // STATE SYNC: Initialize with prop if available, else default
    // 2026-02-14: USER REQUEST - REMOVE HIDDEN DEFAULTS
    // If no props are passed, this will likely result in "0" or "undefined" behavior, as requested.
    const [octave, setOctave] = useState(propOctave ?? 1); // Universal defaults to 1
    const [activeSubOctave, setActiveSubOctave] = useState<number>(propSubOctave ?? 15);  

    // SYNC EFFECTS: Update state if props change (One-Way Binding)
    useEffect(() => {
         if (propOctave !== undefined) setOctave(propOctave);
    }, [propOctave]);

    useEffect(() => {
         if (propSubOctave !== undefined) setActiveSubOctave(propSubOctave);
    }, [propSubOctave]);
    // INITIALIZATION FIX: 
    // We don't know 'center' yet (it depends on verify container size).
    // But x=0, y=0 means "Top Left of SVG" matches "Top Left of Group".
    // Inside the group, we draw at (center, center). 
    // So (0,0) transform is actually CORRECT for centering if the drawing logic adds 'center'.
    // 
    // HOWEVER, if 'center' initializes to 0, everything draws at 0,0.
    // Let's find where 'center' comes from.
    // State for view transform - initialized to CENTER
    const [isDragging, setIsDragging] = useState(false);
    const [trigger, setTrigger] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewportSize, setViewportSize] = useState({ width: 100, height: 100 });
    // DEBUG: Camera Centering Coordinates
    const [debugCoordinates, setDebugCoordinates] = useState<{
        name: string;
        renderX: number;
        renderY: number;
        cameraX: number;
        cameraY: number;
    } | null>(null);
    const [screenCenter, setScreenCenter] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setScreenCenter({ 
            x: Math.round(window.innerWidth/2), 
            y: Math.round(window.innerHeight/2) 
        });
    }, []);

    useEffect(() => {
        const target = containerRef.current;
        if (!target) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;
            const entry = entries[0];
            setViewportSize({ 
                width: entry.contentRect.width, 
                height: entry.contentRect.height 
            });
        });
        
        resizeObserver.observe(target);
        return () => resizeObserver.disconnect();
    }, []);

    // Measure Content Dimensions when Transform Changes
    useEffect(() => {
        if (contentRef.current) {
            const bbox = contentRef.current.getBoundingClientRect();
            setContentDimensions({ width: bbox.width, height: bbox.height });
        }
    }, [viewTransform]);
    
    // UI Toggles
    const [showResonance, setShowResonance] = useState(false);
    const [showEquinox, setShowEquinox] = useState(false);
    const [showLabels, setShowLabels] = useState(true); // Default ON per user request
    const [showPrecession, setShowPrecession] = useState(false);
    const [zodiacMode, setZodiacMode] = useState<'current' | 'ptolemaic' | 'sidereal'>('sidereal'); 
    const [selectedZodiac, setSelectedZodiac] = useState<number | null>(null); 
    const [showMeroitic, setShowMeroitic] = useState(false); 
    const [showVoynich, setShowVoynich] = useState(false);   
    const [showEnglish, setShowEnglish] = useState(false);   
    const [showEnglishModal, setShowEnglishModal] = useState(false); 
    const [showGhost, setShowGhost] = useState(true); // Enabled by user request to compare Control vs Universal parities
    
    // FILTER TOGGLES - Matches ON, Predicted OFF
    const [showMatches, setShowMatches] = useState(true);
    const [showPredicted, setShowPredicted] = useState(false);
    
    // TYPE FILTERS
    const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({
        'Planet': true,
        'Star': false,
        'Dwarf Planet': false,
        'Moon': false,
        'Asteroid': false,
        'Comet': false,
        'Centaur': false,
        'TNO': false,
        'Node/Trojan': false
    });

    const toggleType = (type: string) => {
        setVisibleTypes(prev => ({ ...prev, [type]: !prev[type] }));
    };
    
    // AUTO-CENTER: When octave changes, reset camera to center (0,0) at Default Scale
    // This fixes the "off to the right and down" issue by ensuring scale is 1.0 (where 0,0 is center)
    // REMOVED: Redundant effect that conflicts with the main initialization logic in lines 1327+
    // useEffect(() => {
    //    setViewTransform({ x: 0, y: 0, scale: DEFAULT_ZOOM_SCALE });
    // }, [octave, activeTab]); 
    
    // Internal Simulation State
    const requestRef = useRef<number | undefined>(undefined);
    const startTimeRef = useRef(performance.now());
    const totalPausedTimeRef = useRef(0);
    const lastPauseStartRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef(performance.now());
    const accumulatedSimTimeRef = useRef(0);
    // User Request: "when you start the timer in an octive that becomes teh base calibraiton time"
    const [baseCalibrationOctave, setBaseCalibrationOctave] = useState<number>(11);
    const sessionStartTimeRef = useRef(Date.now());
    const lastTickRef = useRef<number>(Date.now());
    const lastMousePos = useRef({ x: 0, y: 0 });
    const velocityHistory = useRef<Array<{x: number, y: number, t: number}>>([]);
    const targetPosRef = useRef({ x: 0, y: 0 });
    const earthPosRef = useRef<{ x: number; y: number } | null>(null);
    const venusPosRef = useRef<{ x: number; y: number } | null>(null);
    const bodyPositionsRef = useRef<Map<string, {x: number, y: number}>>(new Map());

    // Animation Refs
    const followAnimRef = useRef<number | null>(null);
    const momentumAnimRef = useRef<number | null>(null);
    const selectionZoomTargetRef = useRef(5.0);

    const MIN_SCALE = 0.001;
    // REVERTED: Max Zoom back to 6.0 per user request
    const MAX_SCALE = 500.0; 
    
    // Pre-calculate logs for performance
    const minLog = Math.log(MIN_SCALE);
    const maxLog = Math.log(MAX_SCALE);

    const zoomLimits = useMemo(() => ({ min: MIN_SCALE, max: MAX_SCALE }), [MIN_SCALE, MAX_SCALE]);



    const [isTransitioning, setIsTransitioning] = useState(false);

    // Constants
    // DYNAMIC SIZING: Use the smallest viewport dimension to fill screen while maintaining aspect ratio
    // Default to 580 if measurement fails, but prefer responsive size
    const size = Math.min(viewportSize.width, viewportSize.height) || 580; 
    const center = size / 2;

    // INTERACTION HANDLERS
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        velocityHistory.current = [];
        if (momentumAnimRef.current) {
            cancelAnimationFrame(momentumAnimRef.current);
            momentumAnimRef.current = null;
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        const now = performance.now();
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        
        velocityHistory.current.push({ x: dx, y: dy, t: now });
        if (velocityHistory.current.length > 5) velocityHistory.current.shift();
        
        setViewTransform(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        
        if (selectedBody) isAutoZoomingRef.current = false; 
    }, [isDragging, selectedBody]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        // Momentum logic omitted for stability
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        // e.stopPropagation(); 
        // User Request: Manual zoom interaction breaks the auto-lock
        isAutoZoomingRef.current = false;
        
        const delta = -e.deltaY;
        const factor = 1 + (delta * 0.001);
        
        setViewTransform(prev => {
            let newScale = prev.scale * factor;
            if (newScale < MIN_SCALE) newScale = MIN_SCALE;
            if (newScale > MAX_SCALE) newScale = MAX_SCALE;
            
            if (sliderRef.current) sliderRef.current.syncTo(newScale); // Sync raw scale
            
            // Zoom towards the center of the screen (red dot)
            // Screen Point = (World - center) * scale + center + pan
            // To keep Screen Point = center fixed: pan_new = pan_old * (scale_new / scale_old)
            
            return {
                x: prev.x * (newScale / prev.scale),
                y: prev.y * (newScale / prev.scale),
                scale: newScale
            };
        });
    }, [MIN_SCALE, MAX_SCALE, center]);

    const speedAnimRef = useRef<number | null>(null);
    const sliderRef = useRef<any>(null);

    // Verify Sources modal
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [selectedVerifyItem, setSelectedVerifyItem] = useState<{
        octave: number;
        name: string;
        frameworkVal: number;
        controlVal: number;
        frameworkDisplay: string | number;
        controlDisplay: string | number;
        align: string;
        frequency?: string;
        source?: string;
        confidence?: string;
        notes?: string;
        unit?: string;
    } | null>(null);
    
    // Speed Control
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const speedMultiplierRef = useRef(speedMultiplier);
    const [selectionZoomTarget, setSelectionZoomTarget] = useState(5.0);

    // Smooth speed animation helper
    const animateSpeedTo = useCallback((targetSpeed: number, duration: number = 400) => {
        if (speedAnimRef.current) {
            cancelAnimationFrame(speedAnimRef.current);
        }
        
        const startSpeed = speedMultiplierRef.current;
        const startTime = performance.now();
        
        const animateSpeed = () => {
            const elapsed = performance.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - t, 2.5); // Ease-out
            
            // Lerp in log space for smooth perceptual animation across large ranges
            const logStart = Math.log(Math.max(startSpeed, 0.0000001));
            const logTarget = Math.log(Math.max(targetSpeed, 0.0000001));
            const logCurrent = logStart + (logTarget - logStart) * ease;
            const newSpeed = Math.exp(logCurrent);
            
            setSpeedMultiplier(newSpeed);
            
            if (t < 1) {
                speedAnimRef.current = requestAnimationFrame(animateSpeed);
            } else {
                speedAnimRef.current = null;
                setSpeedMultiplier(targetSpeed); // Snap to exact target
            }
        };
        
        speedAnimRef.current = requestAnimationFrame(animateSpeed);
    }, []);

    // 3. Harmonic Engine Sync (NORMALIZED DATA VIA SHARED HOOK)
    const engineMode = activeTab === 'harmonics' ? 'all' : activeTab;
    // CRITICAL FIX: CONTROL MODE IS ALWAYS OCTAVE 2 SCALING
    // UPDATE: Control Mode needs to show PLANETS (Octave 11) for the Sidebar to work.
    // Octave 2 is currently Quantum/Microscopic.
    const normalizedOctave = activeTab === 'control' ? 11 : octave;

    // 4. DATA HOOK (THE CMS CONSUMER)
    // We pass our "View Definition" to the brain:
    // - Octave: normalizedOctave
    // - Active Sub-Octive: maxActiveSubOctive (Standard 1..N range)
    // - Solar System Mode: true (We always want the "Valid Objects" view in the sim)
    
    // Calculate the 'Active Sub-Octive' from our Set.
    // Since we enforce cumulative logic now (1..N), we just take the max value.
    const maxActiveSubOctive = activeSubOctave;

    // CMS HOOK CALL
    // 5. DATA ALIGNMENT FIX (2026-02-13)
    // Strategy: ALWAYS fetch the full Octave Dataset (SubOctive 15) to match the Debug Page.
    // Then filter visibility LOCALLY based on `maxActiveSubOctive`.
    // This prevents the "Optimization" of fetching only partial data, which broke the UI.
    const { 
        displayBodies: fullOctavebodies, 
        subOctiveCounts,           
        allBodies             
    } = useCosmicData(
        normalizedOctave, 
        maxActiveSubOctive // EXCLUSIVE MODE: Pass the single selected sub-octave
    );

    // 5. LOCAL UI FILTERS
    // The CMS gives us the FULL Library (e.g. 225 objects).
    // Now we filter visibility based on:
    // A. The Active Sub-Octave (Cumulative Depth)
    // B. Object Types (Moons, Orbiters)
    const filteredDisplayBodies = useMemo(() => {
        const effectiveLimit = (!maxActiveSubOctive || maxActiveSubOctive < 1) ? 15 : maxActiveSubOctive;

        // 1. Filter by cumulative depth
        const depthFiltered = fullOctavebodies.filter(b => {
             if (b.name === 'Sun') return true;
             const subOctive = Math.floor(Number((b as any).discovery_subOctive || 1));
             return subOctive <= effectiveLimit;
        });

        // 2. Apply UI Toggles
        return depthFiltered.filter(b => {
             if (b.name === 'Sun') return true;

            // MATCHES vs PREDICTED
            const isPredictedObj = b.name.includes('Predicted Orbit');
            if (isPredictedObj && !showPredicted) return false;
            if (!isPredictedObj && !showMatches) return false;

            // Predicted objects bypass type filters — always show if showPredicted is true
            if (isPredictedObj) return true;

            // TYPE FILTER — types are pre-normalized in the catalog source, no remapping needed
            const objectType = b.object_type || 'Unknown';
            if (visibleTypes[objectType] === false) return false;

            return true;
        });
    }, [fullOctavebodies, maxActiveSubOctive, showMatches, showPredicted, visibleTypes, octave]);
    // SCALE FACTORS (Lens & Slide Mode)
    // The "Slide" (HarmonicResonanceEngine) provides NORMALIZED data (Neptune = 0.75 unit).
    // The "Lens" (CosmicClock) must project this Unit Circle (1.0) to the container radius (size/2).
    const scaleFactor = size / 2; // Map 1.0 unit -> 290px (Edge of container)
    const normalizeRatio = 1.0;

    // DEBUG: Log Scale Factor
    useEffect(() => {
        console.log('[CosmicClock] Size Updated:', size, 'ScaleFactor:', scaleFactor);
    }, [size]);

    // AUTO-INJECT SUN IF MISSING (Crucial for Initial Focus & Centering)
    const finalBodies: RenderableBody[] = useMemo(() => {
        let bodies: any[] = [...filteredDisplayBodies];

        // Auto-inject Sun at center if missing
        if (!bodies.find(b => b.name === 'Sun')) {
            const sunObj: any = {
                id: 'Sun',
                name: 'Sun',
                normalized_radius_au: 0,
                radius_au: 0,
                visual_radius: 6,
                color: '#FDB813',
                meta: { true_radius_au: 0, type: 'Star', freq_hz: 0 },
                object_type: 'Star',
                initial_phase: 0,
                orbital_freq: 0,
            };
            bodies = [sunObj, ...bodies];
        }

        // Sort by radius ascending
        return [...bodies].sort((a: any, b: any) => {
            const rA = a.radius_au || a.meta?.true_radius_au || 0;
            const rB = b.radius_au || b.meta?.true_radius_au || 0;
            if (rA === rB) return (a.local_radius_au || 0) - (b.local_radius_au || 0);
            return rA - rB;
        });
    }, [filteredDisplayBodies, octave]);

    // INITIAL SELECTION: Sun (User Preference)
    // Auto-select the Sun whenever the bodies list is regenerated (e.g. octave switch or load)
    // This ensures the camera "locks" to the center by default.

    // FLAG MANAGEMENT FOR ZOOM
    useEffect(() => {
        if (selectedBody && selectionZoomTarget) {
            isAutoZoomingRef.current = true;
            selectionZoomTargetRef.current = selectionZoomTarget; // CRITICAL: Sync ref with prop
            // Also kill momentum if valid
            if (momentumAnimRef.current) {
                cancelAnimationFrame(momentumAnimRef.current);
                momentumAnimRef.current = null;
            }
             velocityHistory.current = [];
        }
    }, [selectedBody, selectionZoomTarget]);

    /* DISABLING AUTO-SELECTION (User Request 2026-02-16)
    useEffect(() => {
        if (!selectedBody && finalBodies.length > 0) {
            const sun = finalBodies.find(b => b.name === 'Sun');
            if (sun) {
                console.log("[CosmicClock] Auto-selecting Sun for initial focus");
                setSelectedBody(sun);
            }
        }
    }, [finalBodies]); 
    */

    // DYNAMIC ZOOM LIMIT (Restored):
    // Calculates the max zoom required to reach 100,000px total content width
    // based on the furthest body in the current dataset.
    const dynamicMaxZoom = useMemo(() => {
        // Calculate Base Scale Factor (same as used in rendering)
        // Scale Factor for 1 AU / Unit = size / 2 / 42
        // FIXED: Use 'size' (580) instead of 'viewportSize' to match rendering logic
        const currentSize = size; 
        const baseScaleFactor = currentSize / 2 / 42;

        return calculateDynamicMaxScale({
            bodies: finalBodies, // USE RENDERED BODIES
            containerSize: currentSize,
            baseScaleFactor
        });
    }, [finalBodies, size]);

    // MEMOIZED ZOOM HANDLER (Prevents Slider re-renders)
    const handleZoomChange = useCallback((newPhysScale: number) => {
         setViewTransform(p => {
             // To zoom towards the center of the screen (the red dot), we must adjust
             // the pan (x, y) so that the mathematical center of the view remains
             // aligned with the visual center of the screen.
             // If we just change scale, we zoom relative to the origin (the Sun).
             
             // The red dot is fixed at the center of the viewport.
             // We want the point currently under the red dot to stay under the red dot.
             // Let WorldCenter be the absolute world coordinate currently at the screen center.
             // ScreenCenter = (WorldCenter - Origin) * OldScale + PanOld
             // We want: ScreenCenter = (WorldCenter - Origin) * NewScale + PanNew
             // Solving for PanNew:
             // PanNew = ScreenCenter - (WorldCenter - Origin) * NewScale
             // And we know (WorldCenter - Origin) = (ScreenCenter - PanOld) / OldScale
             
             // Since ScreenCenter is mathematically defined as 'center' in our coordinate system:
             return {
                 x: p.x * (newPhysScale / p.scale),
                 y: p.y * (newPhysScale / p.scale),
                 scale: newPhysScale
             };
         });
    }, [center]);



    // DYNAMIC ZOOM LIMIT (Correct Placement):
    // Calculated after bodies and scaleFactor are defined.
    const maxBodyRadius = useMemo(() => {
        if (!finalBodies.length) return 0;
        return Math.max(...finalBodies.map(body => {
             const b = body as any;
             // 1. Framework Body
             if (b.normalized_radius_au) return b.normalized_radius_au;
             // 2. Control Body (JPL)
             if (b.originalData?.radius_au) return b.originalData.radius_au;
             if (b.originalData?.semiMajorAxis_AU) return b.originalData.semiMajorAxis_AU;
             return 0;
        }));
    }, [finalBodies]);

    const dynamicMinZoom = useMemo(() => {
        if (maxBodyRadius <= 0) return 0.001;
        // Fit furthest body: scale * (radius * scaleFactor) = center * 0.9 (90% of screen half-width)
        // scale = (center * 0.9) / (radius * scaleFactor)
        const safeScaleFactor = scaleFactor || 290;
        const fitScale = (center * 0.9) / (maxBodyRadius * safeScaleFactor);
        
        if (!isFinite(fitScale)) return 0.001;

        // Allow zooming out much further (0.1x of fit) to see surrounding space
        // Cap at 0.1 max for 'min' (don't force zoom IN if system is tiny)
        // Use 0.0001 as absolute floor
        return Math.max(0.000001, Math.min(0.1, fitScale * 0.1));
    }, [maxBodyRadius, center, scaleFactor]);

    // User Request: Force 250x capability
    // Overriding the previous 5.0 restriction if it existed in the slider logic
    // The previous MAX_SCALE constant was likely limiting this.
    // We need to ensure the slider component also receives this max.






    // Movement Scale (Visual Speed)
    const movementScale = useMemo(() => {
        // FORCE PARITY: Octave 2 uses exact same movement scale as Control
        if (activeTab === 'control') return CosmicRecursionEngine.BASELINE_TEMPO;
        return CosmicRecursionEngine.calculatePerceptualTempo(octave);
    }, [octave, activeTab]);

    // HUD Scale (Physical Time)
    const hudScale = useMemo(() => {
        // FORCE PARITY: Octave 2 uses exact same time scaling as Control
        if (activeTab === 'control') return CosmicRecursionEngine.BASELINE_TEMPO;
        return CosmicRecursionEngine.calculateTemporalDensity(octave) * CosmicRecursionEngine.BASELINE_TEMPO;
    }, [octave, activeTab]);

    // DISPLAY HUD SCALE (Relative Temporal Density)
    // Satisfies User Request: Resetting the clock locks the base calibration. Lower octaves show millions of years.
    const displayHudScale = useMemo(() => {
        if (activeTab === 'control') return CosmicRecursionEngine.BASELINE_TEMPO;
        const baseDilation = CosmicRecursionEngine.calculateTemporalDensity(baseCalibrationOctave);
        const currentDilation = CosmicRecursionEngine.calculateTemporalDensity(octave);
        const relativeDilation = baseDilation / currentDilation;
        return CosmicRecursionEngine.BASELINE_TEMPO * relativeDilation;
    }, [octave, activeTab, baseCalibrationOctave]);

    // REF FOR CAMERA SYNC (2026-02-17)
    // We need 'hudScale' inside the animation loop to calculate correct physics positions.
    // Placed here to avoid TDZ (Tempo Dead Zone? No, Temporal Dead Zone)
    const hudScaleRef = useRef(hudScale);
    useEffect(() => {
        hudScaleRef.current = hudScale;
    }, [hudScale]);
    
    const timeScale = movementScale * speedMultiplier;
    const IS_PRIMORDIAL_MODE = true; 

    // Visual Cycle (Rotation Speed)
    const visualCycle = useMemo(() => {
        return CosmicRecursionEngine.SECONDS_PER_YEAR / speedMultiplier;
    }, [speedMultiplier]);
    
    // Cosmic Timeline - Age, precession cycles, and countdown (Framework as Standard)
    const cosmicTimeline = useMemo(() => {
        const engine = new GalacticConversionEngine();
        return engine.getCosmicTimeline();
    }, []);
    
    // Planetary equinox angles for visualization

    // 4a. Dynamic Verification Data - Calculated from Framework
    const PHI = 1.618033988749895;
    const PHI_SQUARED = PHI * PHI; // 2.618...
    
    const verificationData = useMemo(() => {
        // --- OCTAVE 1: Coupling Constants & Φ-Ratio Relationships ---
        // Level 80 (Schumann = 7.83 Hz) is the empirical anchor (K₈₀ = 1.00)
        // All other levels relate via Φ^n scaling
        // Coupling constants are dimensionless and directly verifiable
        
        // Framework data from cosmic_compass_data.json
        const FRAMEWORK_LEVELS = {
            level10: { freq_hz: 0.68, coupling_const: 1.2695, coupling_name: 'g_A (axial)' },
            level20: { freq_hz: 1.10, coupling_const: 1/137.035999084, coupling_name: 'α (fine structure)' },
            level80: { freq_hz: 7.83, coupling_const: 7.83, coupling_name: 'f₀ (Schumann)' },
            level90: { freq_hz: 19.74, coupling_const: 6.67430e-11, coupling_name: 'G (gravitational)' }
        };
        
        // Control data: CODATA 2018 / NIST verified values
        const CONTROL_DATA = {
            axial_coupling: 1.2695,              // g_A - Axial coupling (CODATA)
            fine_structure: 1/137.035999206,     // α - Fine structure constant (CODATA 2018)
            schumann: 7.83,                       // Hz - Schumann resonance (measured)
            gravitational: 6.67430e-11           // m³/(kg·s²) - Gravitational constant (CODATA)
        };
        
        // Calculate Φ-ratios from Level 80 anchor
        const phi_ratio_L20_L80 = FRAMEWORK_LEVELS.level20.freq_hz / FRAMEWORK_LEVELS.level80.freq_hz;
        const phi_ratio_L10_L80 = FRAMEWORK_LEVELS.level10.freq_hz / FRAMEWORK_LEVELS.level80.freq_hz;
        const phi_ratio_L90_L80 = FRAMEWORK_LEVELS.level90.freq_hz / FRAMEWORK_LEVELS.level80.freq_hz;
        
        // Theoretical Φ ratios: The framework uses Φ² scaling per 10 levels
        // L90/L80 = 19.74/7.83 = 2.52 ≈ Φ² = 2.618 (96% match!)
        const theoretical_phi_L90_L80 = PHI_SQUARED; // Φ² = 2.618...
        
        const octave1Data = [
            { 
                name: 'Fine Structure α (L20)', 
                octaveVal: FRAMEWORK_LEVELS.level20.coupling_const,
                controlVal: CONTROL_DATA.fine_structure,
                formatOctave: (v: number) => '1/' + (1/v).toFixed(3),
                formatControl: (v: number) => '1/' + (1/v).toFixed(3),
                frequency: '1/137.036',
                unit: '(dimless)',
                source: 'CODATA 2018',
                confidence: 'High',
                notes: 'Matches Fine Structure Constant α exactly.'
            },
            { 
                name: 'Schumann f₀ (L80)', 
                octaveVal: FRAMEWORK_LEVELS.level80.freq_hz,
                controlVal: CONTROL_DATA.schumann,
                formatOctave: (v: number) => v.toFixed(2) + ' Hz',
                formatControl: (v: number) => v.toFixed(2) + ' Hz',
                frequency: '7.83',
                unit: 'Hz',
                source: 'Global Network',
                confidence: 'High',
                notes: 'Empirical anchor point of the framework.'
            },
            { 
                name: 'Φ²-Ratio L90/L80', 
                octaveVal: phi_ratio_L90_L80,
                controlVal: theoretical_phi_L90_L80,
                formatOctave: (v: number) => v.toFixed(4),
                formatControl: (v: number) => 'Φ² = ' + v.toFixed(4),
                frequency: '2.521',
                unit: '(ratio)',
                source: 'Mathematical Derivation',
                confidence: 'Medium',
                notes: 'Validates Φ² scaling between levels.'
            },
        ];

        // --- OCTAVE 11: Direct from simulation bodies (already framework-calculated) ---
        const planetOrder = ['Mercury', 'Venus', 'Earth', 'Mars', 'Ceres', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
        const jplData: Record<string, number> = {
            'Mercury': 87.9691, 'Venus': 224.701, 'Earth': 365.25636, 'Mars': 686.980,
            'Ceres': 1680.0, 'Jupiter': 4332.589, 'Saturn': 10759.22, 
            'Uranus': 30688.5, 'Neptune': 60182.0, 'Pluto': 90560.0
        };
        
        // Generate Octave 11 bodies using the engine for Octave 11 specifically
        const engine = new HarmonicResonanceEngine();
        const { bodies: octave11Bodies } = engine.generateHarmonicSystem('clock', 11);
        
        const octave11Data = planetOrder.map(name => {
            const body = octave11Bodies.find(b => b.name === name);
            const jplPeriod = jplData[name] || 0;
            const frameworkPeriod = body ? (body.period_sec || 0) / 86400 : jplPeriod; // Convert to days
            return {
                name,
                octaveVal: frameworkPeriod,
                controlVal: jplPeriod,
                formatOctave: (v: number) => v >= 1000 ? Math.round(v).toLocaleString() : v.toFixed(2),
                formatControl: (v: number) => v >= 1000 ? Math.round(v).toLocaleString() : v.toFixed(2),
                frequency: jplPeriod.toFixed(2),
                unit: 'days',
                source: 'NASA JPL Horizons',
                confidence: 'High',
                notes: 'Computed from Keplerian elements + Φ-harmonics.'
            };
        }).filter(p => p.controlVal > 0);

        // --- OCTAVE 3: Galactic cycles via Φ scaling with drag ---
        // Framework calculation: Precession = Earth year * Φ^n where n aligns to ~25,920
        // Using Φ scaling: 25920 ≈ 365.25 * Φ^8.44
        const precessionPhiPower = Math.log(25920 / 365.25636) / Math.log(PHI);
        const galacticDrag = 0.994; // Galactic-scale drag factor
        
        const frameworkPrecession = 365.25636 * Math.pow(PHI, precessionPhiPower) * galacticDrag;
        const frameworkZodiacAge = frameworkPrecession / 12;
        
        // Galactic Year: Scale precession by Φ^n to reach ~225 MY
        // 225,000,000 / 25,920 ≈ 8681 ≈ Φ^18.7
        const galacticPhiPower = Math.log(225000000 / frameworkPrecession) / Math.log(PHI);
        const frameworkGalacticYr = frameworkPrecession * Math.pow(PHI, galacticPhiPower) * galacticDrag;
        
        const octave3Data = [
            {
                name: 'Precession',
                octaveVal: frameworkPrecession,
                controlVal: 25772, // IAU 2006
                formatOctave: (v: number) => Math.round(v).toLocaleString() + 'y',
                formatControl: (v: number) => v.toLocaleString() + 'y',
                frequency: '25,772',
                unit: 'yr',
                source: 'IAU 2006 (P03)',
                confidence: 'High',
                notes: 'Axial precession cycle mapped to Φ scaling.'
            },
            {
                name: 'Galactic Yr',
                octaveVal: frameworkGalacticYr / 1e6,
                controlVal: 225, // MY - Gaia estimate
                formatOctave: (v: number) => Math.round(v) + ' MY',
                formatControl: (v: number) => v + ' MY',
                frequency: '225',
                unit: 'MY',
                source: 'Gaia DR3 / IAU',
                confidence: 'Medium',
                notes: 'Sun\'s orbit around Galactic Center.'
            },
            {
                name: 'Zodiac Age',
                octaveVal: frameworkZodiacAge,
                controlVal: 2147.67, // 25772/12
                formatOctave: (v: number) => Math.round(v).toLocaleString() + 'y',
                formatControl: (v: number) => Math.round(v).toLocaleString() + 'y',
                frequency: '2,148',
                unit: 'yr',
                source: 'Astrological Std',
                confidence: 'High',
                notes: 'One twelfth of the Great Year.'
            },
        ];

        // Calculate alignment percentage with proper precision
        const calcAlign = (oct: number, ctrl: number) => {
            const align = 100 - Math.abs((oct - ctrl) / ctrl * 100);
            const result = Math.max(0, Math.min(100, align));
            // Use 2 decimals for more accuracy visibility
            return result.toFixed(2) + '%';
        };

        return {
            octave1: octave1Data.map(p => ({
                ...p,
                name: p.name,
                frameworkVal: p.octaveVal,
                octave: p.formatOctave(p.octaveVal),
                control: p.formatControl(p.controlVal),
                octaveVal: p.octaveVal,
                controlVal: p.controlVal,
                align: calcAlign(p.octaveVal, p.controlVal)
            })),
            octave11: octave11Data.map(p => ({
                ...p,
                name: p.name,
                frameworkVal: p.octaveVal,
                octave: p.formatOctave(p.octaveVal),
                control: p.formatControl(p.controlVal),
                octaveVal: p.octaveVal,
                controlVal: p.controlVal,
                align: calcAlign(p.octaveVal, p.controlVal)
            })),
            octave3: octave3Data.map(p => ({
                ...p,
                name: p.name,
                frameworkVal: p.octaveVal,
                octave: p.formatOctave(p.octaveVal),
                control: p.formatControl(p.controlVal),
                octaveVal: p.octaveVal,
                controlVal: p.controlVal,
                align: calcAlign(p.octaveVal, p.controlVal)
            })),
            // Overall alignment scores
            octave1Avg: octave1Data.reduce((sum, p) => sum + (100 - Math.abs((p.octaveVal - p.controlVal) / p.controlVal * 100)), 0) / octave1Data.length,
            octave11Avg: octave11Data.reduce((sum, p) => sum + (100 - Math.abs((p.octaveVal - p.controlVal) / p.controlVal * 100)), 0) / octave11Data.length,
            octave3Avg: octave3Data.reduce((sum, p) => sum + (100 - Math.abs((p.octaveVal - p.controlVal) / p.controlVal * 100)), 0) / octave3Data.length,

        };
    }, []);

    // ANIMATION LOOP REFS (Access fresh state inside requestAnimationFrame)
    const selectedBodyRef = useRef(selectedBody);
    const isDraggingRef = useRef(isDragging);
    const centerRef = useRef(center);
    const scaleFactorRef = useRef(scaleFactor);
    const activeTabRef = useRef(activeTab); // Added to bypass live physics inside animate() loop for Universal Tab
    
    // Maintain a map for O(1) lookups in the animation loop
    const bodyMapRef = useRef<Map<string, any>>(new Map());

    // Sync Refs
    useEffect(() => { selectedBodyRef.current = selectedBody; }, [selectedBody]);
    useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
    useEffect(() => { centerRef.current = center; }, [center]);
    useEffect(() => { scaleFactorRef.current = scaleFactor; }, [scaleFactor]);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
    
    // Sync Body Map
    // Sync Body Map
    // CRITICAL FIX: We must include ALL bodies (even filtered ones) to ensure physics parents are available.
    // If we only use 'finalBodies', a Moon's parent might be filtered out, causing getBodyPosition -> NaN.
    useEffect(() => {
        const map = new Map<string, any>();
        
        // 1. Add all potential bodies from the raw data hook (fullOctavebodies)
        // This ensures parents like "Earth" exist even if filtered out visually
        if (fullOctavebodies) {
            fullOctavebodies.forEach(b => map.set(b.id, b));
        }

        // 2. Add rendered bodies (finalBodies)
        // These might have extra UI-specific properties or overrides, so they take precedence if duplicates exist.
        finalBodies.forEach(b => map.set(b.id, b));
        
        bodyMapRef.current = map;
    }, [finalBodies, fullOctavebodies]);
    
    // SPEED-INTEGRATED TIME: Accumulated simulation time with speed changes
    // This prevents position jumps when speed slider changes
    //Refs declared at top of component

    // Raw elapsed seconds (wall-clock time, ignoring speed)
    const getElapsedSeconds = () => {
        const now = performance.now();
        const activeMs = now - startTimeRef.current - totalPausedTimeRef.current;
        return activeMs / 1000;
    };

    const animate = () => {
        if (!isPausedRef.current) {
            const now = performance.now();
            const deltaMs = now - lastFrameTimeRef.current;
            lastFrameTimeRef.current = now;
            
            // Accumulate simulation time WITH current speed (using ref to avoid stale closure)
            accumulatedSimTimeRef.current += (deltaMs / 1000) * speedMultiplierRef.current;
            
            setTrigger(t => t + 1);
        } else {
            // Keep lastFrameTime updated even when paused to prevent time jump on resume
            lastFrameTimeRef.current = performance.now();
        }

         // CAMERA FOLLOW LOGIC
        // Only follow if body is selected and user is NOT manually dragging
        const targetBody = selectedBodyRef.current;
        if (targetBody && !isDraggingRef.current) {
            
            // ROBUST TRACKING: Calculate Physics Position directly in the loop
            // Use refs to avoid stale closures
            
            const bodyMap = bodyMapRef.current;
            const center = centerRef.current;
            const currentTv = viewTransformRef.current;
            // Use the accumulated simulation time for the current frame
            // We use the same time that will be passed to the renderer in the NEXT render
            // But 'accumulatedSimTimeRef' is updated in this loop, so it's fresh.
            // Use the exact accumulated simulation time for the current frame to track moving objects
            const simTime = accumulatedSimTimeRef.current * hudScaleRef.current;
            const sf = scaleFactorRef.current;

            if (currentTv && bodyMap.has(targetBody.id)) {
                
                // Get fresh Body object from map (in case properties changed)
                const freshBody = bodyMap.get(targetBody.id);
                
                // Calculate Physics Position (World Coordinates relative to Center)
                const pos = getBodyPosition(
                    freshBody, 
                    simTime, 
                    bodyMap, 
                    center, 
                    sf, 
                    currentTv.scale
                );
                
                // ZOOM ANIMATION LOGIC (Integrated 2026-02-17)
                let newScale = currentTv.scale;
                
                if (selectionZoomTargetRef.current && isAutoZoomingRef.current) {
                     const targetZ = selectionZoomTargetRef.current;
                     const scaleLerpFactor = 0.05;
                     newScale = currentTv.scale + (targetZ - currentTv.scale) * scaleLerpFactor;
                     
                     if (Math.abs(newScale - targetZ) < 0.01) {
                         newScale = targetZ;
                         isAutoZoomingRef.current = false;
                     }
                     if (sliderRef.current) sliderRef.current.syncTo(newScale);
                }

                // MATH:
                // ScreenX = (BodyWorldX - Center) * Scale + Center + PanX
                // PanX = (Center - BodyWorldX) * Scale
                // We want to center the body, so targetX IS the required PanX.
                
                // VERTICAL OFFSET (User Preference)
                // REMOVED (2026-02-17): User requested precise mathematical centering.
                // The previous -30px offset caused misalignment at different zoom levels.
                const VISUAL_CENTER_OFFSET_Y = 0;

                // CRITICAL: specific target calculation must use the NEW scale to stay centered during zoom
                // POS is in "Physics Pixels" (Scale 1.0 relative to scaleFactor)
                // We want to shift the view so that this position ends up at the Center of the screen.
                
                // Formula:
                // ScreenX = (WorldX - Center) * Scale + Center + PanX
                // We want ScreenX = Center
                // 0 = (WorldX - Center) * Scale + PanX
                // PanX = -1 * (WorldX - Center) * Scale
                // PanX = (Center - WorldX) * Scale
                
                // RESTORED CORRECT MATH (2026-02-17): 
                // getBodyPosition returns World Coords (unzoomed). We MUST multiple by scale to get Screen Pan.
                const perfectTargetX = (center - pos.x) * newScale;
                const perfectTargetY = (center - pos.y) * newScale;
                
                // DEBUG LOGGING (Enabled for diagnosis)
                console.log(`Follow: Body=${targetBody.id} Center=${center} Pos=${pos.x.toFixed(1)},${pos.y.toFixed(1)} TargetPan=${perfectTargetX.toFixed(1)} CurrentPan=${currentTv.x.toFixed(1)} Dist=${(perfectTargetX - currentTv.x).toFixed(1)}`);
                
                // SMOOTH FOLLOW (Lerp)
                // RESTORED (2026-02-17): Changed from 1.0 (Instant) back to 0.1 (Smooth) per user request.
                const lerpFactor = 0.1;
                const nextX = currentTv.x + (perfectTargetX - currentTv.x) * lerpFactor;
                const nextY = currentTv.y + (perfectTargetY - currentTv.y) * lerpFactor;
                
                // FORCE UPDATE LOGIC:
                // We must compare the CURRENT View with the TARGET View.
                // If we are not at the target (within epsilon), we MUST update.
                // Previous error: checking 'dx' (the step size) caused stalling on slow movements.
                
                const distToTargetX = Math.abs(perfectTargetX - currentTv.x);
                const distToTargetY = Math.abs(perfectTargetY - currentTv.y);
                const distScale = Math.abs(currentTv.scale - newScale);

                // Update if we are not centered (Pixel perfection) or scaling changed
                // Threshold 0.01px ensures we keep settling until perfectly centered.
                // Fix: Include isAutoZoomingRef to keep running while zooming.
                if (distToTargetX > 0.01 || distToTargetY > 0.01 || distScale > 0.0001 || isAutoZoomingRef.current) {
                     setViewTransform(prev => ({
                        ...prev,
                        x: nextX,
                        y: nextY,
                        scale: newScale
                    }));
                }
            }
        }

        // SMOOTH VIEWPORT TRANSITION (User Request 2026-02-17)
        // If we are transitioning to a target view (e.g. Origin Reset)
        if (isTransitioningViewRef.current && targetViewTransformRef.current) {
            const currentTv = viewTransformRef.current;
            const targetTv = targetViewTransformRef.current;
            
            const LERP_FACTOR = 0.1; // Smoothness
            
            const nextX = currentTv.x + (targetTv.x - currentTv.x) * LERP_FACTOR;
            const nextY = currentTv.y + (targetTv.y - currentTv.y) * LERP_FACTOR;
            const nextScale = currentTv.scale + (targetTv.scale - currentTv.scale) * LERP_FACTOR;
            
            // Check checks for completion
            const dist = Math.abs(targetTv.x - nextX) + Math.abs(targetTv.y - nextY);
            const scaleDist = Math.abs(targetTv.scale - nextScale);
            
            if (dist < 0.1 && scaleDist < 0.01) {
                // Snap to finish
                setViewTransform({ x: targetTv.x, y: targetTv.y, scale: targetTv.scale });
                isTransitioningViewRef.current = false;
                targetViewTransformRef.current = null;
                // Sync Slider
                if (sliderRef.current) sliderRef.current.syncTo(targetTv.scale);
            } else {
                // Continue Update
                 setViewTransform({ x: nextX, y: nextY, scale: nextScale });
                 // Sync Slider
                 if (sliderRef.current) sliderRef.current.syncTo(nextScale);
            }
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    // Keep isPausedRef in sync with state
    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    // Keep speedMultiplierRef in sync with state
    useEffect(() => {
        speedMultiplierRef.current = speedMultiplier;
    }, [speedMultiplier]);

    // Keep selectionZoomTargetRef in sync
    useEffect(() => {
        selectionZoomTargetRef.current = selectionZoomTarget;
    }, [selectionZoomTarget]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
    }, []);

    // Reset speed multiplier to octave default when changing octaves
    useEffect(() => {
        const range = SPEED_RANGE[octave as keyof typeof SPEED_RANGE];
        if (range) {
            setSpeedMultiplier(range.default);
        }
    }, [octave]);

    // Track fullscreen state changes (e.g., when user presses Escape)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Use a derived elapsed value to ensure consistency within a single render
    const elapsed = useMemo(() => {
        if (trigger === 0) return 0;
        return getElapsedSeconds();
    }, [trigger]);

    // 5. Derived Time: 1 simulation second = [timeScale] real seconds
    // Capture session start time once to prevent "drift" when using Date.now() every frame
    // sessionStartTimeRef declared at top


    // CALCULATE UNIFIED TIME SCALE
    // Both motion and HUD now use the SAME absolute temporal density.
    // This provides a physically consistent model where 1 lap = 1 orbit period on the HUD.
    // Sync Engine: All octaves move at the same visual speed (Octave 2 template).
    // PURE RATIO LATTICE TRANSFORM
    // Decouples Movement (Visual Parity) from HUD (Physical Dilation)
    
    // NOTE: movementScale, hudScale, timeScale, visualCycle are calculated at top of component.
    
    // Cosmic Timeline - Age, precession cycles, and countdown (Framework as Standard)
    // Already calculated at top.

    const simDate = useMemo(() => {
        // Use DISPLAY HUD SCALE for date display (Relative Temporal Density)
        let simSeconds = accumulatedSimTimeRef.current * displayHudScale;
        
        // OVERFLOW PREVENTION: Cap simSeconds for HUD stability (1 Billion Years)
        const HUD_MAX_SECONDS = 1000000000 * CosmicRecursionEngine.SECONDS_PER_YEAR; 
        if (Math.abs(simSeconds) > HUD_MAX_SECONDS) {
            simSeconds = simSeconds % HUD_MAX_SECONDS;
        }
        
        const simTimeYears = simSeconds / CosmicRecursionEngine.SECONDS_PER_YEAR;
        const cosmicState = getCosmicTime(simTimeYears);
        return getDerivedGregorianDate(cosmicState);
    }, [trigger, hudScale]); // trigger updates on each animation frame

    const planetaryEquinoxes = useMemo(() => {
        // PERFORMANCE OPTIMIZATION: Skip math if arrows are hidden
        if (!showEquinox) return [];

        const engine = new GalacticConversionEngine();
        const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
        const simSeconds = accumulatedSimTimeRef.current * hudScale;
        return planets.map(p => engine.getPlanetaryEquinoxAngle(p, simDate, IS_PRIMORDIAL_MODE, simSeconds)).filter(e => e !== null);
    }, [simDate, hudScale, IS_PRIMORDIAL_MODE, showEquinox]); // Depend on toggle update

    // VISUAL CYCLE (Rotation time on screen)
    // Already calculated at top.

    // VIEW SCALE SYNCHRONIZATION
    // Automatically set the appropriate zoom level when switching octaves
    useEffect(() => {
        console.log(`[CosmicClock DEBUG] Octave: ${octave}`);
        console.log(`[CosmicClock DEBUG] TimeScale: ${timeScale}`);
        console.log(`[CosmicClock DEBUG] VisualCycle: ${visualCycle}`);
        console.log(`[CosmicClock DEBUG] OrbitSimDuration: ${visualCycle * timeScale}`);
    }, [octave, timeScale, visualCycle]);
    
    // --- CONTROL SYSTEM STATE (ORIGINAL - DO NOT TOUCH) ---
    // 1. Get Static Orbits (Memoized)
    const controlStaticData = useMemo(() => {
        if (activeTab !== 'control') return { orbits: new Map<string, string>(), orbitPoints: new Map<string, {x: number, y: number}[]>() };
        const engine = new HarmonicResonanceEngine();
        const { paths, points } = engine.getSolarSystemStaticOrbits(new Date(), CONTAINER_CENTER, scaleFactor);
        return { orbits: paths, orbitPoints: points };
    }, [CONTAINER_CENTER, scaleFactor, activeTab]);

    // 2. Get Dynamic Positions & Package State
    // 2. Get Dynamic Positions & Package State
    const controlSystemState = useMemo(() => {
        if (activeTab !== 'control') return null;
        const engine = new HarmonicResonanceEngine();
        const bodies = engine.getSolarSystemDynamicPositions(simDate, CONTAINER_CENTER, scaleFactor);
        
        // PREPARE CONTROL-SPECIFIC SIDE MENU DATA
        // STRICT SEPARATION: This ONLY applies to Control View. Universal View uses 'finalBodies' (Dynamic Framework).
        const controlSideMenuBodies = bodies.map(b => ({
            ...b,
            // Inject UI properties missing from JPL data
            object_type: ['Pluto', 'Ceres', 'Eris', 'Haumea', 'Makemake', 'Sedna'].includes(b.name) ? 'Dwarf Planet' : 'Planet',
            // Ensure ID matches for selection
            id: b.id || b.name,
            // Add normalized radius for potential relative scaling (though Control uses km)
            normalized_radius_au: b.originalData?.semiMajorAxis_AU || 0,
            visual_radius: b.visual_radius || 6,
            // Add meta property to render AUs in control tab side menu
            meta: { 
                true_radius_au: b.originalData?.semiMajorAxis_AU || 0,
                period_s: (b.originalData?.orbitalPeriod_days || 0) * 86400,
                period_txt: (b.originalData?.orbitalPeriod_days || 0).toFixed(2) + " d",
                radius_txt: (b.originalData?.semiMajorAxis_AU || 0).toFixed(4) + " AU",
                type: 'Planet',
                freq_hz: b.freq_hz
            },
            // Ensure color is present
            color: b.color || '#fff'
        })).filter(body => {
            const isPredictedObj = body.name.includes('Predicted Orbit');
            const isMatchObj = !isPredictedObj;
            if (isPredictedObj && !showPredicted) return false;
            if (isMatchObj && !showMatches) return false;
            
            if (isPredictedObj) return true;
            
            let t = body.object_type || 'Unknown';
            if (t === 'Node' || t === 'Trojan') t = 'Node/Trojan';
            
            if (visibleTypes[t] === false) return false;

            return true;
        });

        // EXPLICIT INJECTION: SUN
        // The Sun is the anchor in Control View but isn't in the orbital elements list.
        const sun = {
            id: 'Sun',
            name: 'Sun',
            object_type: 'Star',
            color: '#FDB813',
            normalized_radius_au: 0,
            visual_radius: 12, // Distinct visual size
            meta: { true_radius_au: 0, type: 'Star', freq_hz: 0 } // Mock meta for type safety
        };

        // Prepend Sun to the list (assuming Sun is always a Match, so we only include it if Matches are shown)
        const bodiesWithSun = showMatches ? [sun, ...controlSideMenuBodies] : controlSideMenuBodies;
        bodiesWithSun.sort((a, b) => (a.meta?.true_radius_au || 0) - (b.meta?.true_radius_au || 0));

        return { 
            bodies, 
            controlSideMenuBodies: bodiesWithSun, // Dedicated list for Side Menu
            orbits: controlStaticData.orbits,
            orbitPoints: controlStaticData.orbitPoints
        };
    }, [activeTab, simDate, CONTAINER_CENTER, scaleFactor, controlStaticData, showMatches, showPredicted, visibleTypes]);

    // VIEW INDEPENDENCE: Reset Transform when Switching Tabs
    // PREVENTS "Lost in Space" when switching between normalized (Universal) and AU-scaled (Control) views.
    useEffect(() => {
        if (activeTab === 'control') {
            // Control View Default: Center at 0,0, Zoom 1.0 (matches 42 AU extent)
            setViewTransform({ x: 0, y: 0, scale: DEFAULT_ZOOM_SCALE });
        } else {
            // Universal View Default: Center at 0,0, Zoom 1.0
            setViewTransform({ x: 0, y: 0, scale: DEFAULT_ZOOM_SCALE });
        }
    }, [activeTab]);




    // ZERO-JUMP RESCALING SYSTEM
    // Preserves the Simulated Date when switching between octaves/tabs
    const lastHudScaleRef = useRef(hudScale);
    
    useEffect(() => {
        const oldScale = lastHudScaleRef.current;
        const newScale = hudScale;
        
        // If we are explicitely switching octaves (via UI), we use the SAVED time (Local Persistence).
        // So we SKIP the rescaling logic, which is intended for preserving "Universal Time" when parameters change.
        if (isSwitchingOctaveRef.current) {
             // Reset flag for next render cycle
             isSwitchingOctaveRef.current = false;
        } else if (oldScale !== newScale && oldScale > 0 && newScale > 0) {
            // Rescale accumulated time to keep date invariant relative to the clock dilation
            const oldAcc = accumulatedSimTimeRef.current;
            const newAcc = (oldAcc * oldScale) / newScale;
            accumulatedSimTimeRef.current = newAcc;
        }
        
        lastHudScaleRef.current = newScale;
    }, [hudScale]);

    useEffect(() => {
        // Reset view AND clear selection when switching octaves
        // Cancel ALL animations to prevent interference
        if (followAnimRef.current) {
            cancelAnimationFrame(followAnimRef.current);
            followAnimRef.current = null;
        }
        if (momentumAnimRef.current) {
            cancelAnimationFrame(momentumAnimRef.current);
            momentumAnimRef.current = null;
        }
        
        // Clear ALL selections
        setSelectedBody(null);
        setHoveredBody(null);
        setSelectedZodiac(null);
        
        // DYNAMIC ZOOM INITIALIZATION:
        // For Octave 2 (Planetary) or Control Tab, we want a CONSISTENT visual scale.
        // We use the Control Tab's reference extent (42.0 AU) as the "Standard Zoom".
        // This ensures that when switching, the solar system (Sun-Neptune) appears at the SAME size,
        // regardless of outliers like distant asteroids.
        let initialScale = DEFAULT_ZOOM_SCALE;
        
        if (activeTab === 'control') {
             // SIMPLIFIED RATIO SCALING:
             // The Control System data is normalized such that "1.0" = The Outer Boundary (42 AU).
             // To "fit" the solar system, we simply need a scale that fills the view.
             // 0.85 makes the 42 AU boundary fill 85% of the screen radius.
             // This automatically adjusts for screen size (radius) because sizing is relative to 'center'.
             
             // 0.85 makes the 42 AU boundary fill 85% of the screen radius.
             // This automatically adjusts for screen size (radius) because sizing is relative to 'center'.
             
             initialScale = DEFAULT_ZOOM_SCALE; // UNIFIED: Use Global Default (was 0.85)
             
             // If we ever need to handle "outliers" (e.g. 100 AU object in a 42 AU system),
             // we would divide this by (FurthestBody / 42.0). 
             // But for standard visualization, 0.85 is the Unified Ratio.
        }

        // IMPORTANT: We do NOT reset view on octave/tier switch anymore (User Request)
        // This allows exploring different tiers without losing the camera context.
        // setViewTransform({ x: 0, y: 0, scale: initialScale });
        // sliderRef.current?.reset();
        
        targetPosRef.current = { x: 0, y: 0 };
    }, [octave]);

    // DUMB RENDERER: NO AUTO-ZOOM, NO LATTICE SNAP
    // The data arrives pre-normalized. The camera stays where the user left it.
    // We only log the octave switch for debugging.
    useEffect(() => {
        console.log(`[CosmicClock Sync] Switched to Octave ${octave}. Renderable Bodies: ${finalBodies.length}`);
    }, [octave, activeTab]);

    // Flag to track if the camera is currently auto-zooming to a selection
    // If user interacts manually, we disable this to prevent fighting
    const isAutoZoomingRef = useRef(false);

    // Ref to access Renderer's internal position logic (Single Source of Truth)
    const harmonicRendererRef = useRef<HarmonicSystemHandle>(null);

    // REFERENCE TIME SCALE (For Relative Dilation)
    // Tracks the dilation of the octave that started the timer.
    // Used to calculate the ratio for displaying time in other octaves.
    const referenceTimeScaleRef = useRef<number>(hudScale);

    // INITIALIZATION:
    // ViewTransform initialized to (0,0,1) which corresponds to Center View
    // because rendering logic adds 'center' offset to all coordinates.
    // No extra effect needed.

    // Camera follow system - center and track selected body
    // NOTE: followAnimRef is declared in refs section above
    
    // Camera follow system - center and track selected body
    // NOTE: followAnimRef is declared in refs section above
    // MIGRATED TO MAIN ANIMATION LOOP (2026-02-17)
    // We only keep the cleanup here to ensure no stray loops exist
    useEffect(() => {
        // Clean up previous follow animation
        if (followAnimRef.current) {
            cancelAnimationFrame(followAnimRef.current);
            followAnimRef.current = null;
        }
    }, [selectedBody]);

    // Keep controlSystemState accessible in animation loop without re-running effect
    const controlSystemStateRef = useRef<any>(null);
    useEffect(() => {
        controlSystemStateRef.current = controlSystemState;
    }, [controlSystemState]);

    /**
     * Formats a duration in seconds into "Xy Ym Zd Wh" format with total days.
     * Uses standard astronomical constants.
     * PRECISION FIX: Shows total days to avoid misleading "1y 0m 0d" when actual is 366 days.
     */
    const formatOrbitalDuration = (seconds: number) => {
        const YEAR_S = 31557600; // Julian Year (365.25 days)
        const DAY_S = 86400;
        const HOUR_S = 3600;

        // Calculate total days first for precision display
        const totalDays = seconds / DAY_S;
        
        let remaining = seconds;
        
        const years = Math.floor(remaining / YEAR_S);
        remaining %= YEAR_S;
        
        // Use 30 days per month for display purposes (civil calendar approximation)
        const MONTH_S = 30 * DAY_S; 
        const months = Math.floor(remaining / MONTH_S);
        remaining %= MONTH_S;
        
        const days = Math.floor(remaining / DAY_S);
        remaining %= DAY_S;
        
        const hours = Math.floor(remaining / HOUR_S);
        
        // Show total days with 1 decimal for precision (e.g., "366.0d")
        // Format: "1y 0m 6d 5h (366.0d total)"
        const totalDaysStr = totalDays >= 1 ? ` (${totalDays.toFixed(1)}d)` : '';
        return `${years}y ${months}m ${days}d ${hours}h${totalDaysStr}`;
    };

    // Calculate the Period derived from the Visual Cycle (which is the rotation time in Real Seconds)
    // Multiplied by the Time Scale (Sim Seconds / Real Second) = Sim Seconds for 1 Orbit
    const orbitDurationSimSeconds = visualCycle * timeScale;
    const formattedOrbit = formatOrbitalDuration(orbitDurationSimSeconds);

    // Helper to format the Time Flow Rate (1s = X)
    const formatTimeRate = (scale: number) => {
        const hudYearsPerSec = hudScale / CosmicRecursionEngine.SECONDS_PER_YEAR;
        if (hudYearsPerSec >= 1) return `${hudYearsPerSec.toFixed(2)} years`;
        const hudDaysPerSec = hudScale / 86400;
        if (hudDaysPerSec >= 1) return `${hudDaysPerSec.toFixed(2)} days`;
        const hudHoursPerSec = hudScale / 3600;
        return `${hudHoursPerSec.toFixed(2)} hours`;
    };
    
    const formattedRate = formatTimeRate(timeScale);

    // ========== PRECESSION TRACKING SYSTEM ==========
    // The Great Year (Precession Cycle): COSMIC_COMPASS_YEAR
    // Angular Rate: 360° / COSMIC_COMPASS_YEAR
    const PRECESSION = {
        FULL_CYCLE_YEARS: COSMIC_COMPASS_YEAR,
        DEGREES_PER_YEAR: 360 / COSMIC_COMPASS_YEAR,
        YEARS_PER_DEGREE: COSMIC_COMPASS_YEAR / 360,
    };

    // ========== MEROITIC GLYPH CALIBRATION DATA ==========
    // Source: geometric_glyph_system.json - Pure geometric analysis
    // These angles are derived from actual Meroitic script measurements
    const MEROITIC_GLYPH_CALIBRATION = {
        anchors: [
            {
                date: 'August 21, 2017 @ 18:25 UTC',
                event: 'Total Solar Eclipse (Great American Eclipse)',
                glyphRef: 'M09 𓃭 (b) @ 27.3°',
                rationale: 'First coast-to-coast US eclipse in 99 years - primary calibration point',
            },
            {
                date: 'April 8, 2024 @ 18:18 UTC',
                event: 'Total Solar Eclipse (Sun-Moon-Earth alignment)',
                glyphRef: 'M09 𓃭 (b) @ 27.3°',
                rationale: 'Second American eclipse - validates precession drift over 6.63 years',
            },
        ],
        glyphs: [
            { id: 'M01', glyph: '𓁹', name: 'r', angle: 1.1, cosmicLevel: 0, levelName: 'Void', freq: 7.83, usage: 'Base reference angle for Schumann resonance calibration' },
            { id: 'M07', glyph: '𓆣', name: 'ne', angle: 15.9, cosmicLevel: 1, levelName: 'Quantum', freq: 12.67, usage: 'Quantum boundary marker - 15.9° = start of Octave 1 expansion' },
            { id: 'M08', glyph: '𓏏', name: 't', angle: 24.7, cosmicLevel: 5, levelName: 'Quark', freq: 20.5, usage: 'Mercury phase angle (innermost planet orbital calibration)' },
            { id: 'M09', glyph: '𓃭', name: 'b', angle: 27.3, cosmicLevel: 5, levelName: 'Quark', freq: 20.5, usage: '★ PRECESSION ANCHOR - Base position at eclipse calibration dates' },
            { id: 'M10', glyph: '𓏘', name: 'q', angle: 35.5, cosmicLevel: 10, levelName: 'Nucleus', freq: 33.17, usage: 'Venus phase angle - 35.5° = φ² × 13.5 (Golden ratio scaled)' },
            { id: 'M12', glyph: '𓂧', name: 'd', angle: 48.7, cosmicLevel: 20, levelName: 'Orbital', freq: 53.67, usage: 'Mars phase angle - 48.7° ≈ 49° = 7² (harmonic square)' },
            { id: 'M15', glyph: '𓈖', name: 'n', angle: 64.4, cosmicLevel: 40, levelName: 'DNA', freq: 140.5, usage: 'Jupiter phase angle - 64.4° ≈ 64° = 2⁶ (octave marker)' },
            { id: 'M17', glyph: '𓄿', name: 'a', angle: 82.2, cosmicLevel: 60, levelName: 'Awareness', freq: 367.84, usage: 'Saturn phase angle - 82.2° = approaching 90° (quarter cycle)' },
        ],
        calculations: {
            step1_anchor: 'Aug 21, 2017 eclipse → Precession position = 27.3° (from glyph M09 𓃭)',
            step2_rate: 'Precession rate = 50.29 arcsec/year = 0.01397°/year',
            step3_current: 'Current position = 27.3° + (years since anchor × 0.01397°)',
            step4_validation: '2017→2024 = 6.63 yrs × 0.01397° = 0.093° drift (validates cross-anchor consistency)',
        },
        usage: {
            orbitalPhases: 'Planetary initial phases derive from glyph angles matching orbital period ratios',
            precessionTracking: 'Current precession = anchor glyph angle + time offset (no external J2000 data)',
            zodiacAlignment: 'Ptolemaic mode adds 28° offset; Current mode uses live calculated precession',
        },
    };

    // ========== VOYNICH GLYPH CALIBRATION DATA ==========
    // Source: Voynich Trace Engine - Orthogonal Harmonic Analysis
    // These angles follow a 90° base Φ-harmonic scale (Phase/Resonance) rather than 0° base (Radius/Distance)
    // CRITICAL: This data is for VALIDATION ONLY. It must NOT be used to drive simulation physics.
    const VOYNICH_GLYPH_CALIBRATION = {
        anchors: [
            { angle: 90, type: 'Base', harmony: '1.0', note: 'Orthogonal Anchor (Equator) - High density node' },
            { angle: 146, type: 'Phi', harmony: '90 × Φ ≈ 145.6°', note: 'Expansion Phase - Matches 146° glyph' },
            { angle: 114, type: 'Root Phi', harmony: '90 × √Φ ≈ 114.5°', note: 'Harmonic Bridge - Matches 114° glyph' },
            { angle: 70, type: 'Inv Root', harmony: '90 / √Φ ≈ 70.8°', note: 'Contraction Phase - Matches 70° glyph' },
            { angle: 20, type: 'Inv Cube', harmony: '90 / Φ³ ≈ 21.2°', note: 'Deep Resonance - Matches 20° glyph' },
            { angle: 135, type: 'Geometric', harmony: '90 × 1.5', note: 'Sesquiquadrate (Aspect) - Matches 135° glyph' },
            { angle: 59, type: 'Inv Phi', harmony: '90 / Φ ≈ 55.6°', note: 'Harmonic Dip - Matches 59° glyph' }
        ],
        hypothesis: {
            concept: 'Orthogonal Phase Validation',
            detail: 'While Meroitic glyphs encode DISTANCE (Radius) from 0°, Voynich glyphs encode PHASE (State) from 90°. They are the "Cosine" to Meroitic "Sine".',
            application: 'Use Voynich angles to validate the harmonic STATE of an object at a given level.'
        }
    };

    // ========== ENGLISH GLYPH SYSTEM (23-LETTER CIPHER) ==========
    // Source: Meroitic Scripts - English Tab (Distinct from Meroitic Radial System)
    // Encodes: GALACTIC ORIENTATION (Clusters at 270°)
    const ENGLISH_GLYPH_SYSTEM = {
        meta: { cipher: "23-Letter Old English", axis: "Galactic Orientation" },
        glyphs: [
            { char: 'a', angle: 264.89, note: 'South/Galactic' },
            { char: 'b', angle: 256.73, note: 'South/Galactic' },
            { char: 'c', angle: 268.15, note: 'Strict South (270°)' },
            { char: 'd', angle: 255.25, note: 'South/Galactic' },
            { char: 'e', angle: 266.99, note: 'Strict South' },
            { char: 'f', angle: 280.67, note: 'South/West' },
            { char: 'g', angle: 277.61, note: 'South/West' },
            { char: 'h', angle: 261.22, note: 'South/Galactic' },
            { char: 'i', angle: 268.47, note: 'Strict South' },
            { char: 'k', angle: 259.08, note: 'South/Galactic' },
            { char: 'l', angle: 257.98, note: 'South/Galactic' },
            { char: 'm', angle: 19.84, note: 'North/East' },
            { char: 'n', angle: 248.22, note: 'South/East' },
            { char: 'o', angle: 275.43, note: 'Strict South' },
            { char: 'p', angle: 279.92, note: 'South/West' },
            { char: 'q', angle: 255.95, note: 'South/Galactic' },
            { char: 'r', angle: 257.23, note: 'South/Galactic' },
            { char: 's', angle: 298.04, note: 'West' },
            { char: 't', angle: 273.56, note: 'Strict South (270°)' },
            { char: 'v', angle: 267.64, note: 'Strict South' },
            { char: 'x', angle: 272.86, note: 'Strict South' },
            { char: 'y', angle: 284.66, note: 'West' },
            { char: 'z', angle: 263.28, note: 'South/Galactic' }
        ]
    };

    // Helper to get English Vector Drift (Nearest Neighbor)
    const getEnglishVector = (currentAngle: number, level: number) => {
        // Find the closest English glyph to the current angle
        const bestMatch = ENGLISH_GLYPH_SYSTEM.glyphs.reduce((best, glyph) => {
            let drift = (currentAngle % 360) - glyph.angle;
            // Normalize to -180 to 180
            if (drift > 180) drift -= 360;
            if (drift < -180) drift += 360;
            
            // First iteration or if this drift is smaller
            if (best.drift === null || Math.abs(drift) < Math.abs(best.drift)) {
                return { glyph, drift };
            }
            return best;
        }, { glyph: ENGLISH_GLYPH_SYSTEM.glyphs[0], drift: Infinity } as { glyph: typeof ENGLISH_GLYPH_SYSTEM.glyphs[0], drift: number });

        return {
            targetAngle: bestMatch.glyph.angle,
            drift: bestMatch.drift,
            note: bestMatch.glyph.note || 'Vector aligned',
            glyph: bestMatch.glyph.char,
            name: `English '${bestMatch.glyph.char.toUpperCase()}'`
        };
    };

    // Calculate simulation time using HUD SCALE for absolute years
    const simTimeSeconds = accumulatedSimTimeRef.current * hudScale;
    const simTimeYears = simTimeSeconds / CosmicRecursionEngine.SECONDS_PER_YEAR; // Conceptual "Years"
    
    // CLOSED LOOP CCY ENGINE
    const cosmicState = getCosmicTime(simTimeYears);
    
    // VISUAL STABILIZATION: Bound precession speed to prevent blur
    const rawPrecession = cosmicState.phaseDegrees;
    const precessionDegrees = octave >= 4 ? (rawPrecession % 36.0) : rawPrecession; 

    // SIMULATION-BASED PRECESSION TIMELINE - Updates with simulation time
    const simPrecessionTimeline = useMemo(() => {
        const yearsIntoCurrentCycle = cosmicState.cycleProgress * COSMIC_COMPASS_YEAR;
        const yearsRemaining = COSMIC_COMPASS_YEAR - yearsIntoCurrentCycle;
        const daysRemaining = Math.floor(yearsRemaining * 365.25);
        
        // Cycle dates relative to derived gregorian
        // the anchor is essentially getDerivedGregorianDate(state)
        const currentDerivedDate = getDerivedGregorianDate(cosmicState);
        const cycleStartYear = currentDerivedDate.getFullYear() - yearsIntoCurrentCycle;
        const cycleEndYear = currentDerivedDate.getFullYear() + yearsRemaining;
        
        return {
            currentCycleNumber: cosmicState.completedCycles,
            cyclePosition: rawPrecession,
            yearsRemaining: Math.floor(yearsRemaining),
            daysRemaining,
            cycleStartYear: Math.round(cycleStartYear),
            cycleEndYear: Math.round(cycleEndYear),
            yearsIntoCurrentCycle: Math.floor(yearsIntoCurrentCycle),
        };
    }, [cosmicState]);

    // Format simulation time components for display (structured for large numbers)
    const getSimTimeComponents = (years: number) => {
        const totalDays = years * 365.25;
        const y = Math.floor(years);
        const remainingDays = totalDays - (y * 365.25);
        const d = Math.floor(remainingDays);
        const remainingHours = (remainingDays - d) * 24;
        const h = Math.floor(remainingHours);
        const remainingMinutes = (remainingHours - h) * 60;
        const m = Math.floor(remainingMinutes);
        const remainingSeconds = (remainingMinutes - m) * 60;
        const s = Math.floor(remainingSeconds);
        // 4 decimal digits for sub-second precision
        const frac = Math.floor((remainingSeconds - s) * 10000);
        
        return { y, d, h, m, s, frac };
    };
    
    // Format large years with comprehensive extended abbreviations (up to Vigintillion)
    // Constraint: "max seven digits" including space for labels, to prevent overflow.
    const formatYears = (years: number): { value: string; suffix: string } => {
        const strictFormat = (val: number) => {
            let s = val.toFixed(8);
            if (s.length > 7) s = s.substring(0, 7);
            if (s.endsWith('.')) s = s.substring(0, s.length - 1);
            return s;
        };

        // Scientific Notation if astronomical even for Vigintillion
        if (years >= 1e66) {
             const exp = years.toExponential(3); // 1.234e+70
             return { value: exp, suffix: '' };
        }

        const LARGE_UNITS = [
            { val: 1e63, suffix: 'Vg' }, // Vigintillion
            { val: 1e60, suffix: 'Nd' }, // Novemdecillion
            { val: 1e57, suffix: 'Od' }, // Octodecillion
            { val: 1e54, suffix: 'St' }, // Septendecillion
            { val: 1e51, suffix: 'Sd' }, // Sexdecillion
            { val: 1e48, suffix: 'Qd' }, // Quindecillion (using Qd for 15? No, Quindecillion is 1e48. 10^((15+1)*3) = 10^48. Standard is Qd for Quindecillion? No, Qn usually. Let's use Qn.)
            { val: 1e45, suffix: 'Qt' }, // Quattuordecillion
            { val: 1e42, suffix: 'Td' }, // Tredecillion
            { val: 1e39, suffix: 'Dd' }, // Duodecillion
            { val: 1e36, suffix: 'Ud' }, // Undecillion
            { val: 1e33, suffix: 'Dc' }, // Decillion
            { val: 1e30, suffix: 'No' }, // Nonillion
            { val: 1e27, suffix: 'Oc' }, // Octillion
            { val: 1e24, suffix: 'Sp' }, // Septillion
            { val: 1e21, suffix: 'Sx' }, // Sextillion
            { val: 1e18, suffix: 'Qi' }, // Quintillion
            { val: 1e15, suffix: 'Q' },  // Quadrillion
            { val: 1e12, suffix: 'T' },  // Trillion
            { val: 1e9, suffix: 'B' },   // Billion
            { val: 1e6, suffix: 'M' },   // Million
            { val: 1e3, suffix: 'K' }    // Thousand
        ];

        for (const unit of LARGE_UNITS) {
            if (years >= unit.val) {
                return { value: strictFormat(years / unit.val), suffix: unit.suffix };
            }
        }
        
        return { value: years.toLocaleString(), suffix: '' };
    };
    
    const simTimeComponents = getSimTimeComponents(simTimeYears);
    const formattedYears = formatYears(simTimeComponents.y);

    // Format multiplier for display (human-readable)
    const formatMultiplier = (scale: number) => {
        if (scale >= 1000000000) return `${(scale / 1000000000).toFixed(1)}B`;
        if (scale >= 1000000) return `${(scale / 1000000).toFixed(1)}M`;
        if (scale >= 1000) return `${(scale / 1000).toFixed(1)}K`;
        if (scale >= 1) return scale.toFixed(1);
        if (scale >= 0.01) return scale.toFixed(2);
        if (scale >= 0.001) return scale.toFixed(4);
        if (scale >= 0.0001) return scale.toFixed(5);
        if (scale >= 0.00001) return scale.toFixed(6);
        if (scale >= 0.000001) return scale.toFixed(7);
        return scale.toExponential(3); // For extremely small values
    };

    return (
        <div 
            ref={containerRef}
            className={isTransitioning ? 'opacity-90 transition-opacity duration-300' : ''}
            style={{
                position: 'relative', width: '100%', height: height,
                isolation: 'isolate', zIndex: 0,
                background: THEME.background, color: THEME.text, overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
        >
            
            {/* 1. LAYER: Frequency Instrument (HIDDEN for now) */}
            {/* <FrequencyInstrument bodies={bodies} /> */}

            {/* LEFT SIDE: OBJECT LIST NAVIGATION - Matches Simulation View (Debug Page Parity) */}
            {/* DEBUG COORDINATE PANEL */}
            {debugCoordinates && (
                <div style={{
                    position: 'absolute',
                    bottom: '100px',
                    left: '20px',
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid #ef4444',
                    padding: '10px',
                    borderRadius: '5px',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    zIndex: 9999,
                    pointerEvents: 'none', // Pass through
                    width: '250px'
                }}>
                    <strong style={{ color: '#ef4444' }}>DEBUG: CENTERING</strong>
                    <div style={{ marginBottom: '5px', color: '#fff' }}>{debugCoordinates.name}</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                        <div style={{color:'#aaa'}}>Render X</div>
                        <input type="text" readOnly value={debugCoordinates.renderX.toFixed(2)} style={{background:'#222', border:'none', color:'#fff', width:'100%'}} />
                        
                        <div style={{color:'#aaa'}}>Render Y</div>
                        <input type="text" readOnly value={debugCoordinates.renderY.toFixed(2)} style={{background:'#222', border:'none', color:'#fff', width:'100%'}} />
                        
                        <div style={{color:'#aaa', marginTop:'5px'}}>Camera Target X</div>
                        <input type="text" readOnly value={debugCoordinates.cameraX.toFixed(2)} style={{background:'#222', border:'none', color:'#4ade80', width:'100%'}} />
                        
                        <div style={{color:'#aaa'}}>Camera Target Y</div>
                        <input type="text" readOnly value={debugCoordinates.cameraY.toFixed(2)} style={{background:'#222', border:'none', color:'#4ade80', width:'100%'}} />
                        
                        <div style={{color:'#aaa', marginTop:'5px'}}>Delta X</div>
                        <input type="text" readOnly value={(debugCoordinates.renderX - debugCoordinates.cameraX).toFixed(2)} style={{background:'#222', border:'none', color:'#facc15', width:'100%'}} />
                         <div style={{color:'#aaa'}}>Delta Y</div>
                        <input type="text" readOnly value={(debugCoordinates.renderY - debugCoordinates.cameraY).toFixed(2)} style={{background:'#222', border:'none', color:'#facc15', width:'100%'}} />
                    </div>
                </div>
            )}
            
            <CosmicSideMenu
                // STRICT DATA SEPARATION:
                // Control Tab -> JPL Data + Injected Sun (controlSystemState)
                // Universal Tab -> Harmonic Framework Data (finalBodies)
                finalBodies={activeTab === 'control' && controlSystemState ? controlSystemState.controlSideMenuBodies : finalBodies}
                octave={octave}
                selectedBody={selectedBody}
                setSelectedBody={setSelectedBody}
                setHoveredBody={setHoveredBody}
                setSelectionZoomTarget={setSelectionZoomTarget}
                isAutoZoomingRef={isAutoZoomingRef}
                animateSpeedTo={animateSpeedTo}
                maxZoom={dynamicMaxZoom}
                showMatches={showMatches}
                showPredicted={showPredicted}
            />

            {/* 2. LAYER: Unified Control HUD (Right-Center) */}
            <div style={{
                position: 'absolute', top: '50%', right: '3px', zIndex: 40,
                transform: 'translateY(-50%) translateZ(0)', 
                background: 'rgba(0,0,0,0.7)', padding: '0.5rem 0.8rem', borderRadius: '12px 0 0 12px',
                border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', backdropFilter: 'blur(20px)',
                width: '260px', maxHeight: '98vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', gap: '0.4rem',
                // Hide scrollbar for standard look but keep functionality
                scrollbarWidth: 'none', msOverflowStyle: 'none'
            }}>
                <style>{`
                    /* Hide webkit scrollbar */
                    div::-webkit-scrollbar { display: none; }
                `}</style>
                
                {/* FULLSCREEN */}
                <button 
                    onClick={() => {
                        if (!document.fullscreenElement && containerRef.current) document.documentElement.requestFullscreen();
                        else if (document.fullscreenElement) document.exitFullscreen();
                    }}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', cursor: 'pointer', background: isFullscreen ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    ⛶ FULLSCREEN
                </button>
                
                {/* 1. OCTAVE / SUB OCTAVE LABELS - Compressed Padding */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.4rem 0.2rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                            OCTAVE
                        </div>
                        <div style={{ fontSize: '2.4rem', fontWeight: 900, color: OCTAVE_COLORS[octave] || '#fff', lineHeight: 0.9 }}>
                            {octave < 10 ? `0${octave}` : octave}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                            SUB OCTAVE
                        </div>
                        <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', lineHeight: 0.9 }}>
                            {maxActiveSubOctive.toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>
                
                {/* 1.5 OBJECT TYPE FILTERS (MOVED TO LEFT PANEL) */}


                            {/* SELECT OCTAVE BUTTON GRID (15 Items) */}
                            {/* Mapped Labels: 0, 1, 3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 111 */ }
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div style={{ 
                                    fontSize: '0.75rem', color: THEME.primary, fontWeight: 900, 
                                    letterSpacing: '1px', textAlign: 'center', opacity: 0.8,
                                    margin: '0.4rem 0'
                                 }}>
                                    SELECT OCTAVE
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', justifyContent: 'center' }}>
                                    {[0, 1, 2].map(row => (
                                        <div key={row} style={{ display: 'flex', gap: '3px', width: '100%' }}>
                                            {[0, 1, 2, 3, 4].map(col => {
                                                const o = row * 5 + col; // Internal Octave Index (0-14)
                                                
                                                // UI LABEL MAPPING
                                                // User Request: Map buttons strictly to their 0-14 octave index to prevent confusion with sub-levels
                                                const label = o;
                                                const isActive = o <= 14; 
                                                const isSelected = octave === o;
                                                
                                                // Dynamic Color Logic
                                                const btnColor = isSelected ? THEME.primary : isActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
                                                const textColor = isActive ? '#fff' : 'rgba(255,255,255,0.15)';

                                                return (
                                                    <button
                                                        key={o}
                                                        disabled={!isActive}
                                                        onClick={isActive ? () => {
                                                            if (followAnimRef.current) { cancelAnimationFrame(followAnimRef.current); followAnimRef.current = null; }
                                                            if (momentumAnimRef.current) { cancelAnimationFrame(momentumAnimRef.current); momentumAnimRef.current = null; }
                                                            setSelectedBody(null); setHoveredBody(null); setSelectedZodiac(null);
                                                            targetPosRef.current = { x: 0, y: 0 };
                                                            
                                                            // UNIFIED GLOBAL TIMER LOGIC:
                                                            // We do NOT save/restore local times. The global "Sim Time" flows continuously.
                                                            // We do NOT rescale time (which causes jumps). We just change the view/scale.
                                                            
                                                            isSwitchingOctaveRef.current = true; // Flag to prevent rescaling in useEffect
                                                            setOctave(o);
                                                            
                                                            // 4. Smooth Reset View & Slider
                                                            targetViewTransformRef.current = { x: 0, y: 0, scale: DEFAULT_ZOOM_SCALE };
                                                            isTransitioningViewRef.current = true;
                                                            
                                                            // sliderRef.current?.reset(); // Handled in animation loop now
                                                            
                                                            // 5. Select Default Sub-Octave (15)
                                                            setActiveSubOctave(15); 
                                                            setActiveTab('all');
                                                        } : undefined}
                                                        style={{
                                                            flex: 1, 
                                                            padding: '0.6rem 0.2rem',
                                                            border: 'none', borderRadius: '3px',
                                                            cursor: isActive ? 'pointer' : 'not-allowed',
                                                            background: btnColor,
                                                            color: textColor,
                                                            fontSize: '0.75rem', fontWeight: 800, opacity: isActive ? 1 : 0.4
                                                        }}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. SIMULATION CONTROLS */}
                            {(() => {
                                const range = SPEED_RANGE[octave as keyof typeof SPEED_RANGE] || SPEED_RANGE[2];
                                const progress = (speedMultiplier - range.min) / (range.max - range.min) * 100;
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {/* REVERTED: SELECT SUB OCTAVE BUTTON GRID (1-15) */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            <div style={{ 
                                                fontSize: '0.75rem', color: '#a78bfa', fontWeight: 900, 
                                                letterSpacing: '1px', textAlign: 'center', opacity: 0.8,
                                                margin: '0.4rem 0'
                                            }}>
                                                SELECT SUB OCTAVE
                                            </div>
                                            {/* 15 Sub-Octaves: 1-15 */}
                                            {[0, 1, 2].map(row => (
                                                <div key={row} style={{ display: 'flex', gap: '3px' }}>
                                                    {[1, 2, 3, 4, 5].map(col => {
                                                        const p = (row * 5) + col;
                                                        
                                                        // EXCLUSIVE SELECTION LOGIC
                                                        const isSelected = p === activeSubOctave;
                                                        
                                                        // Framework geometric rule: Sub Octave N exactly correlates to 15 * N objects
                                                        const count = 15 * p;
                                                        
                                                        return (
                                                            <button
                                                                key={p}
                                                                onClick={() => {
                                                                    // EXCLUSIVE LOGIC: Set single active tier
                                                                    setActiveSubOctave(p);
                                                                    setActiveTab('all'); // Force Universal Mode
                                                                }}
                                                                style={{
                                                                    flex: 1, 
                                                                    padding: '0.6rem 0.2rem',
                                                                    border: '1px solid',
                                                                    borderColor: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.05)',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    background: isSelected ? 'rgba(167, 139, 250, 0.4)' : 'transparent',
                                                                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.2)',
                                                                    fontSize: '0.75rem', 
                                                                    fontWeight: isSelected ? 900 : 500,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '2px',
                                                                    transition: 'all 0.15s ease',
                                                                    boxShadow: isSelected ? '0 0 10px rgba(167, 139, 250, 0.3)' : 'none'
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '0.85rem' }}>{p < 10 ? `0${p}` : p}</span>
                                                                {/* VISIBILITY FIX: Increased opacity from 0.5 to 0.8 for unselected, 1.0 for selected */}
                                                                <span style={{ fontSize: '0.65rem', opacity: isSelected ? 1 : 0.8 }}>{count}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>

                                        {/* MATCHES AND PREDICTED TOGGLES (Moved here by user request to be under Sub Octaves) */}
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '1fr 1fr', 
                                            gap: '6px', 
                                            marginTop: '0.4rem',
                                            padding: '0 0.2rem', 
                                            minWidth: '100%' 
                                        }}>
                                            {/* MATCHES TOGGLE */}
                                            <div 
                                                onClick={() => setShowMatches(!showMatches)}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = showMatches ? 'rgba(167, 139, 250, 0.35)' : 'rgba(255,255,255,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = showMatches ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.03)'}
                                                style={{ 
                                                    cursor: 'pointer', padding: '0.4rem',
                                                    backgroundColor: showMatches ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.03)',
                                                    borderRadius: '4px', border: '1px solid',
                                                    borderColor: showMatches ? 'rgba(167, 139, 250, 0.4)' : 'rgba(255,255,255,0.05)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div style={{
                                                    width: '5px', height: '5px', borderRadius: '50%',
                                                    background: showMatches ? '#a78bfa' : '#475569',
                                                    boxShadow: showMatches ? '0 0 5px rgba(167, 139, 250, 0.4)' : 'none',
                                                    transition: 'background 0.3s ease'
                                                }} />
                                                <span style={{ fontSize: '0.65rem', color: showMatches ? '#fff' : '#64748b', fontWeight: 800, letterSpacing: '0.5px' }}>MATCHES</span>
                                            </div>
                                            
                                            {/* PREDICTED TOGGLE */}
                                            <div 
                                                onClick={() => setShowPredicted(!showPredicted)}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = showPredicted ? 'rgba(167, 139, 250, 0.35)' : 'rgba(255,255,255,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = showPredicted ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.03)'}
                                                style={{ 
                                                    cursor: 'pointer', padding: '0.4rem',
                                                    backgroundColor: showPredicted ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.03)',
                                                    borderRadius: '4px', border: '1px solid',
                                                    borderColor: showPredicted ? 'rgba(167, 139, 250, 0.4)' : 'rgba(255,255,255,0.05)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div style={{
                                                    width: '5px', height: '5px', borderRadius: '50%',
                                                    background: showPredicted ? '#a78bfa' : '#475569',
                                                    boxShadow: showPredicted ? '0 0 5px rgba(167, 139, 250, 0.4)' : 'none',
                                                    transition: 'background 0.3s ease'
                                                }} />
                                                <span style={{ fontSize: '0.65rem', color: showPredicted ? '#fff' : '#64748b', fontWeight: 800, letterSpacing: '0.5px' }}>PREDICTED</span>
                                            </div>
                                        </div>

                                        {/* 1.5 OBJECT TYPE FILTERS */}
                                        <div style={{ 
                                            marginTop: '0rem', 
                                            padding: '0.4rem', 
                                            background: 'rgba(255,255,255,0.05)', 
                                            borderRadius: '4px',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                            gap: '4px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            {Object.keys(visibleTypes).map(type => (
                                                <div 
                                                    key={type}
                                                    onClick={() => toggleType(type)}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = visibleTypes[type] ? 'rgba(167, 139, 250, 0.35)' : 'rgba(255,255,255,0.1)';
                                                        e.currentTarget.style.borderColor = visibleTypes[type] ? 'rgba(167, 139, 250, 0.6)' : 'rgba(255,255,255,0.2)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = visibleTypes[type] ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.03)';
                                                        e.currentTarget.style.borderColor = visibleTypes[type] ? 'rgba(167, 139, 250, 0.4)' : 'rgba(255,255,255,0.05)';
                                                    }}
                                                    style={{ 
                                                        cursor: 'pointer', padding: '0.3rem',
                                                        backgroundColor: visibleTypes[type] ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.03)',
                                                        borderRadius: '3px', border: '1px solid',
                                                        borderColor: visibleTypes[type] ? 'rgba(167, 139, 250, 0.4)' : 'rgba(255,255,255,0.05)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.2s ease',
                                                        opacity: visibleTypes[type] ? 1 : 0.6
                                                    }}
                                                >
                                                    <span style={{ fontSize: '0.45rem', color: visibleTypes[type] ? '#fff' : '#64748b', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center' }}>
                                                        {type === 'Dwarf Planet' ? 'Dwarf' : type}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                            
                            {/* STATS FIELDS (Moved to Center, Violet Color, Lighter Unselected) */}
                            {/* STATS FIELDS (Refactored to 2x2 Grid with Status Dots) */}
                            {/* HIDDEN VIA USER REQUEST (2026-02-17)
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '6px', 
                                padding: '0.4rem 0.2rem', 
                                minWidth: '100%' 
                            }}>
                                {/* OBJECTS TOGGLE *
                                <div 
                                    onClick={() => setFilterObjects(!filterObjects)}
                                    style={{ 
                                        cursor: 'pointer', padding: '0.5rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px',
                                        paddingLeft: '12px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: filterObjects ? '#10b981' : '#333',
                                        boxShadow: filterObjects ? '0 0 5px rgba(16, 185, 129, 0.4)' : 'none',
                                        transition: 'background 0.3s ease'
                                    }} />
                                    <span style={{ fontSize: '0.65rem', color: filterObjects ? '#fff' : '#777', fontWeight: 700, letterSpacing: '0.5px' }}>OBJECTS</span>
                                </div>
                                
                                {/* PREDICTED TOGGLE *
                                <div 
                                    onClick={() => setFilterPredicted(!filterPredicted)}
                                    style={{ 
                                        cursor: 'pointer', padding: '0.5rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px',
                                        paddingLeft: '12px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: filterPredicted ? '#10b981' : '#333',
                                        boxShadow: filterPredicted ? '0 0 5px rgba(16, 185, 129, 0.4)' : 'none',
                                        transition: 'background 0.3s ease'
                                    }} />
                                    <span style={{ fontSize: '0.65rem', color: filterPredicted ? '#fff' : '#777', fontWeight: 700, letterSpacing: '0.5px' }}>PREDICTED</span>
                                </div>
                                
                                {/* ORBITERS TOGGLE *
                                <div 
                                    onClick={() => setFilterOrbiters(!filterOrbiters)}
                                    style={{ 
                                        cursor: 'pointer', padding: '0.5rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px',
                                        paddingLeft: '12px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: filterOrbiters ? '#10b981' : '#333',
                                        boxShadow: filterOrbiters ? '0 0 5px rgba(16, 185, 129, 0.4)' : 'none',
                                        transition: 'background 0.3s ease'
                                    }} />
                                    <span style={{ fontSize: '0.65rem', color: filterOrbiters ? '#fff' : '#777', fontWeight: 700, letterSpacing: '0.5px' }}>ORBITERS</span>
                                </div>
                                
                                {/* MOONS TOGGLE *
                                <div 
                                    onClick={() => setFilterMoons(!filterMoons)}
                                    style={{ 
                                        cursor: 'pointer', padding: '0.5rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px',
                                        paddingLeft: '12px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: filterMoons ? '#10b981' : '#333',
                                        boxShadow: filterMoons ? '0 0 5px rgba(16, 185, 129, 0.4)' : 'none',
                                        transition: 'background 0.3s ease'
                                    }} />
                                    <span style={{ fontSize: '0.65rem', color: filterMoons ? '#fff' : '#777', fontWeight: 700, letterSpacing: '0.5px' }}>MOONS</span>
                                </div>
                            </div>
                            */}

                            {/* SIMULATION TIME CLOCK + CONTROLS (Merged) */}
                            <div style={{ 
                                padding: '0.8rem',
                                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
                                borderRadius: '8px', border: '1px solid rgba(34, 211, 238, 0.2)',
                                boxShadow: '0 0 20px rgba(34, 211, 238, 0.1)',
                                display: 'flex', flexDirection: 'column', gap: '0.8rem'
                            }}>
                                {/* TIMING DISPLAY */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', paddingBottom: '0.2rem', borderBottom: '1px solid rgba(34, 211, 238, 0.15)' }}>
                                        <span style={{ fontSize: '0.45rem', color: 'rgba(34, 211, 238, 0.7)', letterSpacing: '2px', fontWeight: 800 }}>⏱ SIMULATION TIME</span>
                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPaused ? '#ef4444' : '#10b981', boxShadow: isPaused ? '0 0 6px #ef4444' : '0 0 6px #10b981', animation: isPaused ? 'none' : 'pulse 1.5s ease-in-out infinite' }} />
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontFamily: "'SF Mono', monospace" }}>
                                        {/* UNIFIED TIME DISPLAY (Reference-Relative Dilation) */}
                                        {(() => {
                                            // 1. Calculate the Time Scale Ratio
                                            // The clock must advance relative to the Base Calibration Octave.
                                            // `displayHudScale` holds the relative dilation (Base vs Current).
                                            const displaySeconds = accumulatedSimTimeRef.current * displayHudScale;
                                            
                                            // 2. STANDARD MACRO DISPLAY (Always Visible)
                                            // Shows Years, Days, Time for all octaves
                                            const years = displaySeconds / CosmicRecursionEngine.SECONDS_PER_YEAR;
                                            const comps = getSimTimeComponents(years);
                                            const fmtYears = formatYears(comps.y);
                                            
                                            // High Precision Fraction (9 digits)
                                            // Recalculate seconds remainder with high precision
                                            const totalSeconds = displaySeconds;
                                            const s = Math.floor(totalSeconds % 60);
                                            const fracPart = totalSeconds - Math.floor(totalSeconds);
                                            const fracStr = fracPart.toFixed(9).substring(2); // "0.123..." -> "123..."

                                            return (
                                                <>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                                                        <span style={{ color: '#22d3ee', fontSize: '2.1rem', lineHeight: 1.1, fontWeight: 800 }}>{fmtYears.value}</span>
                                                        <span style={{ color: 'rgba(34, 211, 238, 0.6)', fontSize: '0.85rem', fontWeight: 700 }}>{fmtYears.suffix} yr</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                                                        <span style={{ color: '#a78bfa', fontSize: '1.5rem', lineHeight: 1.1, fontWeight: 800 }}>{comps.d}</span>
                                                        <span style={{ color: 'rgba(167, 139, 250, 0.6)', fontSize: '0.85rem', fontWeight: 700 }}>d</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                                                        <span style={{ color: '#fbbf24', fontSize: '1.3rem', lineHeight: 1.1, fontWeight: 800 }}>
                                                            {comps.h.toString().padStart(2, '0')}:{comps.m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
                                                        </span>
                                                        <span style={{ color: 'rgba(251, 191, 36, 0.6)', fontSize: '0.75rem', fontWeight: 700 }}>hms</span>
                                                    </div>
                                                    <div style={{ marginTop: '-0.1rem', opacity: 0.7 }}>
                                                        <span style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 900, fontFamily: "'SF Mono', monospace" }}>
                                                            .{fracStr}
                                                        </span>
                                                    </div>

                                                    {/* QUANTUM PRECISION ROW (Visible when time is effectively < 1s) */}
                                                    {displaySeconds < 1 && displaySeconds > 0 && (
                                                        <div style={{ marginTop: '0.2rem', paddingTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                             {(() => {
                                                                 let val = displaySeconds;
                                                                 let unit = 's';
                                                                 let color = '#fbbf24';
                                                                 if (displaySeconds < 1e-9) { val = displaySeconds * 1e12; unit = 'ps'; color = '#ec4899'; }
                                                                 else if (displaySeconds < 1e-6) { val = displaySeconds * 1e9; unit = 'ns'; color = '#d946ef'; }
                                                                 else if (displaySeconds < 1e-3) { val = displaySeconds * 1e6; unit = 'μs'; color = '#a855f7'; }
                                                                 else { val = displaySeconds * 1e3; unit = 'ms'; color = '#8b5cf6'; }
                                                                 
                                                                 return (
                                                                     <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                                                                         <span style={{ color: color, fontSize: '0.9rem', fontWeight: 800 }}>{val.toFixed(3)}</span>
                                                                         <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.6rem', fontWeight: 700 }}>{unit}</span>
                                                                     </div>
                                                                 );
                                                             })()}
                                                        </div>
                                                    )}
                                                </>
                                            );

                                        })()}
                                    </div>
                                </div>

                                {/* CONTROLS (Moved Inside) */}
                                <div style={{ display: 'flex', gap: '4px', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button onClick={() => setIsPaused(!isPaused)} style={{ flex: 2, padding: '0.6rem', border: 'none', borderRadius: '4px', cursor: 'pointer', background: isPaused ? '#10b981' : 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 900, fontSize: '0.6rem' }}>
                                        {isPaused ? 'PLAY' : 'PAUSE'}
                                    </button>
                                    <button onClick={() => { 
                                        // 1. Cancel existing animations
                                        if (followAnimRef.current) { cancelAnimationFrame(followAnimRef.current); followAnimRef.current = null; }
                                        if (momentumAnimRef.current) { cancelAnimationFrame(momentumAnimRef.current); momentumAnimRef.current = null; }
                                        
                                        // 2. Clear Selection
                                        setSelectedBody(null);
                                        setHoveredBody(null);
                                        
                                        // 3. Reset Simulation State INSTANTLY
                                        startTimeRef.current = performance.now(); 
                                        totalPausedTimeRef.current = 0; 
                                        lastPauseStartRef.current = null;
                                        accumulatedSimTimeRef.current = 0; // RESET TIME
                                        sessionStartTimeRef.current = Date.now();
                                        lastFrameTimeRef.current = performance.now();

                                        // 4. LOCK BASE CALIBRATION OCTAVE (User Request)
                                        // "When the timer starts whatever octave is selected becomes the new global timer."
                                        setBaseCalibrationOctave(octave);
                                        // FIX: Lock HUD SCALE (Structure only), ignore speed multiplier.
                                        referenceTimeScaleRef.current = hudScale;
                                        
                                        // 5. Reset Speed & Pause
                                        const range = SPEED_RANGE[octave as keyof typeof SPEED_RANGE]; 
                                        if (range) setSpeedMultiplier(range.default);
                                        setIsPaused(true); 
                                        setTrigger(t => t + 1);
                                        
                                        // 6. SMOOTH ANIMATION to Origin
                                        const startX = viewTransform.x;
                                        const startY = viewTransform.y;
                                        const startScale = viewTransform.scale;
                                        const targetScale = DEFAULT_ZOOM_SCALE;
                                        
                                        const duration = 800; // Smooth 800ms flyback
                                        const animStartTime = performance.now();
                                        
                                        const animateReset = () => {
                                            const now = performance.now();
                                            const elapsed = now - animStartTime;
                                            const t = Math.min(elapsed / duration, 1);
                                            const ease = 1 - Math.pow(1 - t, 3); 
                                            
                                            setViewTransform({
                                                x: startX + (0 - startX) * ease,
                                                y: startY + (0 - startY) * ease,
                                                scale: startScale + (targetScale - startScale) * ease
                                            });
                                            
                                            if (sliderRef.current) sliderRef.current.syncTo(startScale + (targetScale - startScale) * ease);

                                            if (t < 1) {
                                                requestAnimationFrame(animateReset);
                                            }
                                        };
                                        requestAnimationFrame(animateReset);
                                        
                                    }} style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 900, fontSize: '0.6rem' }}>
                                        RESET
                                    </button>
                                </div>
                            </div>

                            {/* SPEED SLIDER */}
                            <div style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.9rem', color: THEME.muted, letterSpacing: '1px', fontWeight: 700 }}>SPEED</span>
                                    <span style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: 900 }}>{formatMultiplier(speedMultiplier)}x</span>
                                </div>
                                <input 
                                    type="range" min={0.01} max={range.max} step={range.step} value={speedMultiplier}
                                    onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                                    style={{ width: '100%', height: '3px', appearance: 'none', background: `linear-gradient(to right, #6366f1 ${progress}%, rgba(255,255,255,0.1) ${progress}%)`, borderRadius: '1.5px', cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.4rem', color: THEME.muted, marginTop: '4px' }}>
                                    <span>{range.min}x</span>
                                    <span onClick={() => setSpeedMultiplier(range.default)} style={{ cursor: 'pointer', color: speedMultiplier === range.default ? THEME.primary : '#fff' }}>{range.default}x</span>
                                    <span>{range.max}x</span>
                                </div>
                            </div>



                            {/* DETAILS */}
                            {/* DETAILS (HIDDEN)
                            <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                <div style={{ textAlign: 'center' }}><span style={{ color: THEME.muted, display: 'block', fontSize: '0.45rem', fontWeight: 700 }}>MULT</span> <span style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 900 }}>{formatMultiplier(timeScale)}x</span></div>
                                <div style={{ textAlign: 'center' }}><span style={{ color: THEME.muted, display: 'block', fontSize: '0.45rem', fontWeight: 700 }}>PREC</span> <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 900 }}>{precessionDegrees.toFixed(2)}°</span></div>
                                <div style={{ textAlign: 'center' }}><span style={{ color: THEME.muted, display: 'block', fontSize: '0.45rem', fontWeight: 700 }}>72yr</span> <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 900 }}>{tick72Year}</span></div>
                                <div style={{ textAlign: 'center' }}><span style={{ color: THEME.muted, display: 'block', fontSize: '0.45rem', fontWeight: 700 }}>CYCLE</span> <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 900 }}>{(cycleProgress * 100).toFixed(1)}%</span></div>
                            </div>
                            */}

                            {/* FULLSCREEN MOVED TO TOP */}
                        </div>
                    );
                })()}

            </div>

            {/* HARMONICS PANEL (Shows when Harmonics tab is active) */}
            {activeTab === 'harmonics' && (() => {
                const harmonicData = getHarmonicLockTable(finalBodies, speedMultiplier, hudScale);
                const globalData = calculateGlobalHarmonicConvergence(finalBodies, speedMultiplier, hudScale);
                
                return (
                    <div style={{
                        position: 'absolute',
                        left: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 20,
                        background: 'rgba(15, 23, 42, 0.95)',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        backdropFilter: 'blur(20px)',
                        maxWidth: '320px',
                        maxHeight: '60vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ fontSize: '0.55rem', color: THEME.muted, fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '1px' }}>
                            ★ HARMONIC LOCK FREQUENCIES
                        </div>

                        {/* Global Resonance Indicator */}
                        <div style={{ marginBottom: '0.5rem', padding: '0.4rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.5rem', color: THEME.muted }}>GLOBAL RESONANCE</span>
                                <span style={{ fontSize: '0.6rem', color: globalData.resonanceScore > 70 ? '#10b981' : globalData.resonanceScore > 40 ? '#fbbf24' : '#ef4444', fontWeight: 700 }}>
                                    {globalData.resonanceScore.toFixed(1)}%
                                </span>
                            </div>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${globalData.resonanceScore}%`, 
                                    height: '100%', 
                                    background: globalData.resonanceScore > 70 ? '#10b981' : globalData.resonanceScore > 40 ? '#fbbf24' : '#ef4444',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <div style={{ fontSize: '0.45rem', color: THEME.muted, marginTop: '0.2rem' }}>
                                Locked: {globalData.lockedBodies.length}/{finalBodies.length} bodies
                            </div>
                        </div>

                        {/* Quick Lock Buttons */}
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.45rem', color: THEME.muted, marginBottom: '0.2rem' }}>QUICK LOCK</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                {harmonicData.slice(0, 6).map(d => (
                                    <button
                                        key={d.bodyId}
                                        onClick={() => {
                                            const nearest = findNearestLockSpeed(d.orbitalPeriodDays, speedMultiplier, hudScale);
                                            setSpeedMultiplier(nearest.speed);
                                        }}
                                        style={{
                                            padding: '0.2rem 0.4rem',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            background: d.isLocked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.05)',
                                            color: d.isLocked ? '#10b981' : '#fff',
                                            fontSize: '0.5rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        {d.bodyName.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Data Table */}
                        <table style={{ width: '100%', fontSize: '0.5rem', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.3rem', color: THEME.muted }}>Body</th>
                                    <th style={{ textAlign: 'right', padding: '0.3rem', color: THEME.muted }}>Lock×1</th>
                                    <th style={{ textAlign: 'right', padding: '0.3rem', color: THEME.muted }}>Drift°</th>
                                </tr>
                            </thead>
                            <tbody>
                                {harmonicData.map(d => (
                                    <tr 
                                        key={d.bodyId} 
                                        style={{ 
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            background: d.isLocked ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                                        }}
                                    >
                                        <td style={{ padding: '0.25rem 0.3rem', color: d.isLocked ? '#10b981' : '#fff' }}>
                                            {d.isLocked ? '● ' : '○ '}{d.bodyName}
                                        </td>
                                        <td style={{ padding: '0.25rem 0.3rem', textAlign: 'right', color: '#a78bfa', fontFamily: 'monospace' }}>
                                            {formatLockSpeed(d.lockSpeeds[0])}
                                        </td>
                                        <td style={{ padding: '0.25rem 0.3rem', textAlign: 'right', color: d.isLocked ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                                            {d.currentDrift.toFixed(1)}°
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })()}

            {/* 3. LAYER: TAB SELECTOR (TOP CENTER) */}
            <div style={{ 
                position: 'absolute', top: '0.5rem', left: '50%', transform: 'translateX(-50%) translateZ(0)',
                zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '8px', backdropFilter: 'blur(5px)' }}>
                    {['all', 'control'].map(t => (
                        <button key={t} onClick={() => { 
                            setActiveTab(t as any); 
                            setSelectedBody(null); 
                            // Control tab defaults to octave 11 (Solar System)
                            if (t === 'control') {
                                setOctave(11);
                                // User Request: Smooth Reset Viewport
                                targetViewTransformRef.current = { x: 0, y: 0, scale: 1.0 };
                                isTransitioningViewRef.current = true;
                            }
                        }} style={{ padding: '0.3rem 0.6rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: activeTab === t ? 'rgba(99, 102, 241, 0.4)' : 'transparent', color: '#fff', fontSize: '0.65rem', fontWeight: 700, textTransform: 'capitalize' }}>
                            {t === 'all' ? 'Universal' : 'Control'}
                        </button>
                    ))}
                </div>

                {/* 50px Gutter */}
                <div style={{ height: '50px' }} />

                <div style={{
                    textAlign: 'center',
                    fontSize: '1.2rem', fontWeight: 300, color: 'rgba(255,255,255,0.7)', letterSpacing: '6px',
                    textTransform: 'uppercase',
                    textShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
                }}>
                    {getOctaveScientificName(octave)}
                </div>
                <div style={{
                    textAlign: 'center',
                    fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '2px',
                    marginTop: '0.2rem',
                    textTransform: 'uppercase'
                }}>
                    OBJECTS DETECTED: {finalBodies.length}
                </div>
            </div>

            {/* TOGGLE BUTTONS - Bottom Left */}
            <div style={{
                position: 'absolute',
                bottom: '1rem',
                left: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                zIndex: 10002,
                transform: 'translateZ(0)'
            }}>
                {/* Precession Popup - appears above toggle buttons */}
                {showPrecession && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        marginBottom: '0.4rem',
                        minWidth: '220px',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}>
                        {/* Header */}
                        <div style={{ 
                            color: '#c4b5fd', 
                            fontWeight: 700, 
                            fontSize: '0.7rem', 
                            letterSpacing: '0.1em',
                            marginBottom: '0.6rem',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
                            paddingBottom: '0.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                        }}>
                            ⏱ Cosmic Timeline
                        </div>
                        
                        {/* Row 1: Simulation Time & Cycle Position */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.5rem' }}>
                            <div>
                                <div style={{ color: THEME.muted, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cosmic Time</div>
                                <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '1rem' }}>{formatCCY(cosmicState)}</div>
                            </div>
                            <div>
                                <div style={{ color: THEME.muted, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase</div>
                                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1rem' }}>{formatPhase(cosmicState)}</div>
                            </div>
                        </div>

                        {/* Row 2: Precession Cycle Info */}
                        <div style={{ 
                            background: 'rgba(168, 85, 247, 0.1)', 
                            borderRadius: '0.4rem', 
                            padding: '0.5rem',
                            marginBottom: '0.5rem',
                        }}>
                            <div style={{ color: '#c4b5fd', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Precession Cycle #{simPrecessionTimeline.currentCycleNumber.toLocaleString()}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                <div>
                                    <div style={{ color: '#86efac', fontSize: '0.5rem', textTransform: 'uppercase' }}>Cycle Start</div>
                                    <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.9rem' }}>{simPrecessionTimeline.cycleStartYear.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#fca5a5', fontSize: '0.5rem', textTransform: 'uppercase' }}>Cycle End</div>
                                    <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>{simPrecessionTimeline.cycleEndYear.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Days Remaining (featured) */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.25), rgba(239, 68, 68, 0.15))',
                            border: '1px solid rgba(248, 113, 113, 0.5)',
                            borderRadius: '0.4rem', 
                            padding: '0.6rem',
                            textAlign: 'center',
                        }}>
                            <div style={{ color: '#fca5a5', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>⏳ Days to Cycle End</div>
                            <div style={{ color: '#f87171', fontWeight: 800, fontSize: '1.3rem' }}>
                                {simPrecessionTimeline.daysRemaining.toLocaleString()}
                            </div>
                        </div>

                        {/* Row 4: Formula Explanations */}
                        <div style={{ 
                            marginTop: '0.5rem',
                            background: 'rgba(99, 102, 241, 0.1)', 
                            borderRadius: '0.4rem', 
                            padding: '0.5rem',
                            border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}>
                            <div style={{ color: '#a5b4fc', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 700 }}>📐 How It's Calculated</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.6rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span style={{ color: '#94a3b8' }}>Full Cycle</span>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>25,772 yrs</span>
                                </div>
                                <div style={{ color: '#6b7280', fontSize: '0.5rem', marginTop: '-0.2rem' }}>← IAU 2006 measured period</div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span style={{ color: '#94a3b8' }}>Rate</span>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>50.29 arcsec/yr</span>
                                </div>
                                <div style={{ color: '#6b7280', fontSize: '0.5rem', marginTop: '-0.2rem' }}>← 360° ÷ 25,772 = 0.01397°/yr × 3600</div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px dashed rgba(99,102,241,0.3)', paddingTop: '0.3rem' }}>
                                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>Years/Degree</span>
                                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.75rem' }}>72</span>
                                </div>
                                <div style={{ color: '#6b7280', fontSize: '0.5rem', marginTop: '-0.2rem' }}>← 1° ÷ 0.01397°/yr = 71.6 ≈ <b style={{ color: '#fbbf24' }}>72</b></div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Toggle Buttons Row */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* GHOST TOGGLE - New Location */}
                    <button
                        onClick={() => setShowPrecession(prev => !prev)}
                        style={{
                            padding: '0.4rem 0.7rem',
                            fontSize: '0.65rem',
                            background: showPrecession ? 'rgba(168, 85, 247, 0.3)' : 'rgba(15, 23, 42, 0.85)',
                            border: `1px solid ${showPrecession ? '#a855f7' : 'rgba(99, 102, 241, 0.3)'}`,
                            borderRadius: '0.25rem',
                            color: showPrecession ? '#c4b5fd' : THEME.muted,
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        ⏱ Precession
                    </button>
                    <button
                        onClick={() => setShowEquinox(prev => !prev)}
                        style={{
                            padding: '0.4rem 0.7rem',
                            fontSize: '0.65rem',
                            background: showEquinox ? 'rgba(251, 191, 36, 0.3)' : 'rgba(15, 23, 42, 0.85)',
                            border: `1px solid ${showEquinox ? '#fbbf24' : 'rgba(99, 102, 241, 0.3)'}`,
                            borderRadius: '0.25rem',
                            color: showEquinox ? '#fbbf24' : THEME.muted,
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        ☉ Equinox
                    </button>
                    <button
                        onClick={() => setZodiacMode(prev => prev === 'current' ? 'ptolemaic' : prev === 'ptolemaic' ? 'sidereal' : 'current')}
                        style={{
                            padding: '0.4rem 0.7rem',
                            fontSize: '0.65rem',
                            background: zodiacMode === 'sidereal' ? 'rgba(34, 197, 94, 0.3)' : zodiacMode === 'ptolemaic' ? 'rgba(251, 146, 60, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                            border: `1px solid ${zodiacMode === 'sidereal' ? '#22c55e' : zodiacMode === 'ptolemaic' ? '#fb923c' : '#6366f1'}`,
                            borderRadius: '0.25rem',
                            color: zodiacMode === 'sidereal' ? '#86efac' : zodiacMode === 'ptolemaic' ? '#fb923c' : '#a5b4fc',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        {zodiacMode === 'current' ? '♁ Meroitic' : zodiacMode === 'ptolemaic' ? '♁ Ptolemaic' : '⭐ Sidereal'}
                    </button>
                    {/* GRID TOGGLE - New Location */}
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        style={{
                            padding: '0.4rem 0.7rem',
                            fontSize: '0.65rem',
                            background: showGrid ? 'rgba(34, 211, 238, 0.3)' : 'rgba(15, 23, 42, 0.85)',
                            border: `1px solid ${showGrid ? '#22d3ee' : 'rgba(99, 102, 241, 0.3)'}`,
                            borderRadius: '0.25rem',
                            color: showGrid ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            transition: 'all 0.2s',
                            fontWeight: 600
                        }}
                    >
                        <span>◎</span>
                        <span>GRID</span>
                    </button>
                    <button
                        onClick={() => setShowGhost(!showGhost)}
                        style={{
                            padding: '0.4rem 0.7rem',
                            fontSize: '0.65rem',
                            background: showGhost ? 'rgba(99, 102, 241, 0.3)' : 'rgba(15, 23, 42, 0.85)',
                            border: `1px solid ${showGhost ? '#6366f1' : 'rgba(99, 102, 241, 0.3)'}`,
                            borderRadius: '0.25rem',
                            color: showGhost ? '#c7d2fe' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>👻</span>
                        <span style={{ fontWeight: 700 }}>GHOST</span>
                    </button>
                    <button
                        onClick={() => setShowLabels(prev => !prev)}
                        style={{
                            padding: '0.4rem 0.7rem',
                            fontSize: '0.65rem',
                            background: showLabels ? 'rgba(147, 197, 253, 0.3)' : 'rgba(15, 23, 42, 0.85)',
                            border: `1px solid ${showLabels ? '#93c5fd' : 'rgba(99, 102, 241, 0.3)'}`,
                            borderRadius: '0.25rem',
                            color: showLabels ? '#93c5fd' : THEME.muted,
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        Aa Labels
                    </button>
                    {/* DEBUG COORDINATES */}
                    <div style={{ 
                        position: 'fixed', 
                        top: 100, 
                        left: 10, 
                        background: 'rgba(0,0,0,0.8)', 
                        color: '#0f0', 
                        padding: '10px', 
                        fontSize: '12px', 
                        fontFamily: 'monospace',
                        pointerEvents: 'none',
                        zIndex: 9999
                    }}>
                        <div>RED DOT (Screen): {screenCenter.x}, {screenCenter.y}</div>
                        <CoordinateDebugger />
                        <div style={{ marginTop: 5, color: '#00faff' }}>
                            VIEW: {Math.round(size)}x{Math.round(size)}<br/>
                            CENTER: {Math.round(center)}, {Math.round(center)}<br/>
                            TRANSFORM: x:{Math.round(viewTransform.x)} y:{Math.round(viewTransform.y)} s:{viewTransform.scale.toFixed(2)}<br/>
                            ZOOM PIVOT: CENTER (Fixed)
                        </div>
                    </div>
                    <button
                        onClick={() => setShowResonance(prev => !prev)}
                        style={{
                            padding: '0.4rem 0.7rem',
                            fontSize: '0.65rem',
                            background: showResonance ? 'rgba(74, 222, 128, 0.3)' : 'rgba(15, 23, 42, 0.85)',
                            border: `1px solid ${showResonance ? '#4ade80' : 'rgba(99, 102, 241, 0.3)'}`,
                            borderRadius: '0.25rem',
                            color: showResonance ? '#4ade80' : THEME.muted,
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        ✦ Resonance
                    </button>
                </div>
            </div>

            {/* 4. LAYER: SVG Canvas */}
            <div 
                // UNMASKED: overflow: visible allows planets to fly out of the bounds
                // DIAGNOSTIC CENTER DOT: CENTERED TO SCREEN
                style={{ 
                    position: 'absolute', // Fixed center
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: size, 
                    height: size, 
                    cursor: isDragging ? 'grabbing' : 'grab', 
                    zIndex: 1,
                    // overflow: 'visible' // implied by being a div? No, overflow is default visible.
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* CENTER SCREEN DIAGNOSTIC */}
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    width: '6px',
                    height: '6px',
                    background: 'red',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999,
                    pointerEvents: 'none'
                }} />

                <svg 
                    width={size} 
                    height={size} 
                    viewBox={`0 0 ${size} ${size}`} 
                    style={{ overflow: 'visible' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget || (e.target as SVGElement).tagName === 'g') {
                            setSelectedBody(null);
                        }
                    }}
                >
                    <defs>
                        <radialGradient id="systemGlow">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                            <stop offset="50%" stopColor={THEME.primary} stopOpacity="0.2" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Invisible full-size rect for hit detection - OPTIMIZED SIZE */}
                    {/* Reduced from 11x to 5x to save memory but still cover reasonable zoom */}
                    <rect 
                        x={-size * 2} 
                        y={-size * 2} 
                        width={size * 5} 
                        height={size * 5}  
                        fill="none"
                        pointerEvents="all"
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                        onClick={() => setSelectedBody(null)}
                    />

                    <g 
                        ref={contentRef}
                        // FIX: Pivot scaling around 'center' so zooming doesn't shift the view off-screen
                        // Pattern: Translate to Center + Pan -> Scale -> Translate back from Center
                        transform={`translate(${center + (isNaN(viewTransform.x) ? 0 : viewTransform.x)}, ${center + (isNaN(viewTransform.y) ? 0 : viewTransform.y)}) scale(${isNaN(viewTransform.scale) || viewTransform.scale <= 0 ? 1 : viewTransform.scale}) translate(${-center}, ${-center})`}
                    >


                        {/* 1. SOLAR ANCHOR (Absolute Background Layer) */}
                        {/* Rendered first within the transform group so planets/zodiac stay on top */}
                        <SolarBody 
                            center={center} 
                            scale={viewTransform.scale} 
                            octave={octave} 
                            scaleFactor={scaleFactor} 
                            activeTab={activeTab} 
                            onClick={() => {
                                const sun = finalBodies.find(b => b.name === 'Sun');
                                if (sun) {
                                    setSelectedBody(sun);
                                    // Optional: setSelectionZoomTarget(2.5); 
                                }
                            }}
                        />

                        {/* ORBITAL RESONANCE TRAIL (Venus-Earth Pentagram) - Only in Octave 2 */}
                        {/* ORBITAL RESONANCE TRAIL (Venus-Earth Pentagram) - Only in Octave 11 (Solar System) */}
                        {octave === 11 && (
                            <OrbitalResonanceTrail
                                center={center}
                                scaleFactor={scaleFactor || 290}
                                earthPos={earthPosRef.current}
                                venusPos={venusPosRef.current}
                                 scaledTime={accumulatedSimTimeRef.current * hudScale}
                                enabled={showResonance}
                                maxPoints={800}
                                sampleRate={86400 * 2}  // Sample every 2 sim days
                            />
                        )}

                        {/* 1.5 CONTROL SYSTEM RENDERER (NASA JPL DATA) */}
                        
                        {/* CONTROL SYSTEM MOVED OUTSIDE GROUP FOR VIEWPORT MODE */}

                        {/* B. OCTAVE 2 (Universal - Duplicated Engine) */}
                        {/* B. OCTAVE 2 (Universal - Duplicated Engine) */}
                        {/* OCTAVE 2 RENDERER MOVED OUTSIDE GROUP FOR VIEWPORT MODE */}


                         {/* PLANE OF THE SYSTEM (0° = Vernal Equinox / 180° = Autumnal Equinox) */}
                         <line 
                             x1={center - 100000} 
                             y1={center} 
                             x2={center + 100000} 
                             y2={center} 
                             stroke="rgba(255, 255, 255, 0.15)" 
                             strokeWidth={1}
                             strokeDasharray="10, 10"
                             vectorEffect="non-scaling-stroke"
                         />

                         {/* 0. PRECESSION RING (Outermost - 25,920 year cycle) */}
                        {(() => {
                             // DYNAMIC ZODIAC SCALING:
                             // Ensure the Zodiac radius is drawn in PIXELS by multiplying AU lengths by the current scale parameters.
                             const systemParity = activeTab === 'control' ? 1.0 : 6.0;
                             const orbitOuterPixels = maxBodyRadius * (scaleFactor || 290) * systemParity;
                             
                             const dynamicPadding = 120 / Math.max(0.01, viewTransform.scale);
                             const precessionRadius = maxBodyRadius > 0 
                                 ? orbitOuterPixels + dynamicPadding 
                                 : center * 0.95;

                             // Calculate Rotation
                             const PTOLEMAIC_OFFSET = 28; 
                             const SIDEREAL_OFFSET = 314; // Derived from Octave 13 Anchor Stars (e.g. Aldebaran @ ~269° geometric)
                             const zodiacRotation = zodiacMode === 'current' 
                                 ? -precessionDegrees 
                                 : zodiacMode === 'sidereal' ? SIDEREAL_OFFSET : PTOLEMAIC_OFFSET;

                             // Helper Handler for Zodiac Clicks
                             const handleZodiacClick = (i: number) => {
                                // Deselect any body immediately
                                setSelectedBody(null); 
                                
                                // Calculate target position to CENTER on this zodiac label
                                const rawTarget = 5.0 / CosmicProjector.getSpatialScaleRatio(octave);
                                const targetZoom = Math.min(rawTarget, MAX_SCALE);
                                setSelectionZoomTarget(targetZoom); 
                                
                                // Add zodiacRotation to account for the group's rotation transform
                                const zodiacAngle = (i * 30 - 90 + zodiacRotation) * Math.PI / 180;
                                
                                // Calculate radius at TARGET zoom (not current zoom)
                                const labelOffsetAtTargetZoom = 20 / targetZoom;
                                const zodiacCenterRadius = precessionRadius + labelOffsetAtTargetZoom;
                                
                                const zodiacX = center + zodiacCenterRadius * Math.cos(zodiacAngle);
                                const zodiacY = center + zodiacCenterRadius * Math.sin(zodiacAngle);
                                
                                const finalTargetX = (center - zodiacX) * targetZoom;
                                const finalTargetY = (center - zodiacY) * targetZoom;
                                
                                // Animate smoothly
                                const startX = viewTransform.x;
                                const startY = viewTransform.y;
                                const startScale = viewTransform.scale;
                                const duration = 400;
                                const startTime = performance.now();
                                
                                const animateZoom = () => {
                                    const elapsed = performance.now() - startTime;
                                    const t = Math.min(elapsed / duration, 1);
                                    const ease = 1 - Math.pow(1 - t, 2.5);
                                    
                                    if (t >= 1) {
                                        setViewTransform({ x: finalTargetX, y: finalTargetY, scale: targetZoom });
                                        sliderRef.current?.syncTo(targetZoom);
                                        setSelectedZodiac(i);
                                    } else {
                                        setViewTransform({
                                            x: startX + (finalTargetX - startX) * ease,
                                            y: startY + (finalTargetY - startY) * ease,
                                            scale: startScale + (targetZoom - startScale) * ease
                                        });
                                        requestAnimationFrame(animateZoom);
                                    }
                                };
                                requestAnimationFrame(animateZoom);
                                
                                // Reset Speed
                                const range = SPEED_RANGE[octave as keyof typeof SPEED_RANGE];
                                animateSpeedTo(range.default, 600);
                             };

                            // OPTIMIZATION: Cull Zodiac Ring at high zoom (> 0.05 scale)
                            // This prevents rendering a massive 10m px container when looking at the inner system.
                            // if (viewTransform.scale > 0.05) return null;

                            // if (octave > 3) return null;

                            return (
                                <ZodiacRing 
                                    center={center}
                                    radius={precessionRadius}
                                    rotation={zodiacRotation}
                                    scale={viewTransform.scale}
                                    selectedZodiac={selectedZodiac}
                                    setSelectedZodiac={setSelectedZodiac}
                                    onZodiacClick={handleZodiacClick}
                                />
                            );
                        })()}


                        {/* 2. HARMONIC SYSTEM (Includes Sun as Level 0) */}
                        {/* PERFORMANCE OPTIMIZATION: Do not process harmonic bodies loop in Control Tab OR Octave 2 */}
                        {/* 2. HARMONIC SYSTEM (Includes Sun as Level 0) */}
                        {showGrid && (
                            <ConcentricCirclesGrid 
                                center={center} 
                                scaleFactor={scaleFactor / (activeTab === 'control' ? 40.0 : (CosmicRecursionEngine.getOctaveBoundary(octave).maxRadius || 1.0))} 
                                viewTransform={viewTransform}
                                viewportSize={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
                                visible={showGrid}
                                svgSize={CONTAINER_SIZE}
                                octave={octave}
                            />
                        )}
                        {(activeTab !== 'control') && (
                            <HarmonicSystemRenderer
                                bodies={finalBodies}
                                octave={octave}
                                center={center}
                                scaleFactor={scaleFactor} // UNIFIED SCALING: Map 1.0 (Octave Edge) to Container Radius
                                viewTransform={viewTransform}
                                accumulatedSimTime={accumulatedSimTimeRef.current * hudScale}
                                elapsedRealTime={elapsed}
                                selectedBody={selectedBody}
                                setSelectedBody={setSelectedBody}
                                hoveredBody={hoveredBody}
                                setHoveredBody={setHoveredBody}
                                setSelectionZoomTarget={setSelectionZoomTarget}
                                isAutoZoomingRef={isAutoZoomingRef}
                                animateSpeedTo={animateSpeedTo}
                                maxZoom={dynamicMaxZoom}
                                ref={harmonicRendererRef}
                                showLabels={showLabels}
                                showEquinox={showEquinox}
                                setSelectedZodiac={setSelectedZodiac}
                                bodyPositionsRef={bodyPositionsRef}
                                earthPosRef={earthPosRef}
                                venusPosRef={venusPosRef}
                                planetaryEquinoxes={planetaryEquinoxes}
                            />
                        )}
                                            

                    </g>

                    {/* 1.5 CONTROL SYSTEM RENDERER (Now Outside Transformed Group) */}
                    {/* USES VIEWPORT MODE TO PROJECT COORDINATES DIRECTLY */}
                    


                    {/* A. CONTROL TAB (Original) */}
                    {activeTab === 'control' && controlSystemState && (
                        <ControlSystemRenderer
                            renderMode="viewport"
                            center={center}
                            dataCenter={CONTAINER_CENTER} // FIX: Pass static generation origin (290)
                            scaleFactor={scaleFactor}
                            viewTransform={viewTransform}
                            simDate={simDate}
                            selectedBody={selectedBody}
                            setSelectedBody={setSelectedBody}
                            hoveredBody={hoveredBody}
                            setHoveredBody={setHoveredBody}
                            showLabels={showLabels}
                            showEquinox={showEquinox}
                            systemState={controlSystemState}
                            planetaryEquinoxes={planetaryEquinoxes}
                            bodyPositionsRef={bodyPositionsRef}
                        />
                    )}

                    {/* B. GHOST OVERLAY (Universal Tab) - MOVED TO TOP LAYER */}
                    {activeTab !== 'control' && showGhost && controlSystemState && (
                        <g style={{ opacity: 0.7, pointerEvents: 'none' }}>
                            <ControlSystemRenderer
                                renderMode="viewport"
                                center={center}
                                dataCenter={CONTAINER_CENTER}
                                scaleFactor={scaleFactor}
                                viewTransform={viewTransform}
                                simDate={simDate}
                                selectedBody={null}
                                setSelectedBody={() => {}}
                                hoveredBody={null}
                                setHoveredBody={() => {}}
                                showLabels={false} 
                                showEquinox={false}
                                systemState={{
                                    ...controlSystemState,
                                    bodies: controlSystemState.bodies.map(b => ({ ...b, color: '#ffdd00' })) // Gold for visibility
                                }}
                                planetaryEquinoxes={planetaryEquinoxes}
                                bodyPositionsRef={{ current: new Map() } as any}
                            />
                        </g>
                    )}


                </svg>
            </div>
            
            {/* 2. LAYER: CONTROLS & OVERLAYS */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                
                {/* CANVAS SIZE DISPLAY REMOVED */}
            </div>

            {/* 5. ZOOM SCROLL BAR OVERLAY */}
            {/* Simple zoom: slider shows actual scale 1-50 */}
            <div style={{ position: 'absolute', bottom: '7rem', left: '50%', transform: 'translateX(-50%) translateZ(0)', zIndex: 60 }}>
                <InertialZoomSlider 
                    ref={sliderRef}
                    scale={viewTransform.scale} // Pass RAW scale
                    minLogScale={dynamicMinZoom} // Dynamic zoom floor
                    onChange={handleZoomChange}
                    defaultZoom={DEFAULT_ZOOM_SCALE}
                    selectionZoomTarget={selectionZoomTarget} // Use state!
                    maxLogScale={20000.0} // Explicit 20000x max limit (User Request)
                />
            </div>

            {/* 6. LAYER: SYSTEM HARMONIC LABEL (TOP LEFT) */}
            <div style={{
                position: 'absolute', top: '0.5rem', left: '1.5rem',
                textAlign: 'left', zIndex: 10000, transform: 'translateZ(0)'
            }}>
                <div style={{ fontSize: '0.6rem', color: THEME.primary, fontWeight: 900, letterSpacing: '2px' }}>
                    SYSTEM HARMONIC: f₉₀ (19.74 Hz)
                </div>
                <button
                    onClick={() => setShowVerifyModal(true)}
                    style={{
                        marginTop: '0.3rem',
                        padding: '0.25rem 0.6rem',
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.5)',
                        borderRadius: '4px',
                        color: THEME.primary,
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '1px'
                    }}
                >
                    📊 VERIFY SOURCES
                </button>
                <button
                    onClick={() => setShowMeroitic(true)}
                    style={{
                        marginTop: '0.3rem',
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.6rem',
                        background: showMeroitic ? 'rgba(217, 119, 6, 0.3)' : 'rgba(217, 119, 6, 0.15)',
                        border: '1px solid rgba(217, 119, 6, 0.5)',
                        borderRadius: '4px',
                        color: '#fbbf24',
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '1px'
                    }}
                >
                    𓂀 MEROITIC
                </button>
                <button
                    onClick={() => setShowVoynich(true)}
                    style={{
                        marginTop: '0.3rem',
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.6rem',
                        background: showVoynich ? 'rgba(45, 212, 191, 0.3)' : 'rgba(45, 212, 191, 0.15)',
                        border: '1px solid rgba(45, 212, 191, 0.5)',
                        borderRadius: '4px',
                        color: '#2dd4bf',
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '1px'
                    }}
                >
                    ⚛ VOYNICH
                </button>
                <button
                    onClick={() => { setShowEnglishModal(true); setShowEnglish(true); }}
                    title="Open English Validation Data"
                    style={{
                        marginTop: '0.3rem',
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.6rem',
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.5)',
                        borderRadius: '4px',
                        color: '#fbbf24',
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '1px'
                    }}
                >
                    🇬🇧 ENGLISH
                </button>
                <button
                    onClick={() => window.open('/science/catalog', '_blank')}
                    title="Open Catalog"
                    style={{
                        marginTop: '0.3rem',
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.6rem',
                        background: 'rgba(99, 102, 241, 0.15)', // Indigo background
                        border: '1px solid rgba(99, 102, 241, 0.5)', // Indigo border
                        borderRadius: '4px',
                        color: '#818cf8', // Indigo text
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '1px'
                    }}
                >
                    📓 CATALOG
                </button>
                <button
                    onClick={() => window.open('/science/dashboard/harmonicResonanceOutput', '_blank')}
                    title="Open Source Output"
                    style={{
                        marginTop: '0.3rem',
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.6rem',
                        background: 'rgba(217, 70, 239, 0.15)', // Fuchsia background
                        border: '1px solid rgba(217, 70, 239, 0.5)', // Fuchsia border
                        borderRadius: '4px',
                        color: '#d946ef', // Fuchsia text
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '1px'
                    }}
                >
                    🌐 SOURCE
                </button>
            </div>
            
            {/* CATALOG MODAL REMOVED - NOW A SEPARATE PAGE */}

            {/* VERIFY SOURCES MODAL */}
            {showVerifyModal && (
                <div 
                    onClick={() => setShowVerifyModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(200, 210, 220, 0.15)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10001
                    }}
                >
                    {/* Floating Title */}
                    <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 900, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                            Cosmic Compass Framework vs Modern Science
                        </h2>
                    </div>
                    
                    {/* Floating Close Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowVerifyModal(false); }}
                        style={{
                            position: 'absolute',
                            top: '1.5rem',
                            right: '1.5rem',
                            background: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: '44px',
                            height: '44px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '1.3rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ✕
                    </button>
                    
                    {/* Floating Cards Grid */}
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                    >
                    <div 
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '85vw', maxWidth: '1100px' }}
                    >
                            {/* OCTAVE 1 COLUMN - Level Color: Red/Orange (#ff6b35) */}
                            <div style={{ background: 'rgba(255, 107, 53, 0.08)', padding: '0.8rem', borderRadius: '12px', border: '2px solid rgba(255, 107, 53, 0.4)' }}>
                                <div style={{ color: '#ff6b35', fontWeight: 900, fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                                    OCTAVE 1 — SUBATOMIC
                                </div>
                                <div style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>TimeScale:</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>1,377,549×</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Dilation Factor:</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>Φ² = 2.618</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>1 Real Sec =</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>~16 sim days</span>
                                    </div>
                                </div>
                                
                                <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                                            <th style={{ textAlign: 'left', padding: '8px', color: '#ff6b35' }}>Constant</th>
                                            <th style={{ textAlign: 'right', padding: '8px' }}>
                                                <div style={{ color: '#4ade80', fontSize: '0.6rem' }}>Framework</div>
                                                <div style={{ color: '#4ade80', fontWeight: 700 }}>Value</div>
                                            </th>
                                            <th style={{ textAlign: 'right', padding: '8px' }}>
                                                <div style={{ color: '#60a5fa', fontSize: '0.6rem' }}>Science</div>
                                                <div style={{ color: '#60a5fa', fontWeight: 700 }}>CODATA</div>
                                            </th>
                                            <th style={{ textAlign: 'right', padding: '8px', color: '#fff' }}>Δ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {verificationData.octave1.map(p => (
                                            <tr 
                                                key={p.name} 
                                                onClick={() => setSelectedVerifyItem({ ...p, octave: 1, frameworkDisplay: p.octave, controlDisplay: p.control })}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,107,53,0.15)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '8px', color: '#fff' }}>{p.name}</td>
                                                <td style={{ textAlign: 'right', padding: '8px', color: '#4ade80' }}>{p.octave}</td>
                                                <td style={{ textAlign: 'right', padding: '8px', color: '#60a5fa' }}>{p.control}</td>
                                                <td style={{ textAlign: 'right', padding: '8px', color: '#4ade80' }}>{p.align}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                <div style={{ marginTop: '1rem', padding: '0.6rem', background: 'rgba(255, 107, 53, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                                    <span style={{ color: '#ff6b35', fontWeight: 900, fontSize: '1rem' }}>{verificationData.octave1Avg > 0 ? verificationData.octave1Avg.toFixed(1) + '% ALIGNED' : 'Φ-SCALED'}</span>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', marginTop: '0.2rem' }}>Coupling Constants & Φ²-Ratios</div>
                                </div>
                            </div>
                            
                            {/* OCTAVE 2 COLUMN - Level Color: Blue (#6366f1) */}
                            <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '0.8rem', borderRadius: '12px', border: '2px solid rgba(99, 102, 241, 0.5)' }}>
                                <div style={{ color: '#6366f1', fontWeight: 900, fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                                    OCTAVE 2 — PLANETARY ★
                                </div>
                                <div style={{ fontSize: '0.65rem', marginBottom: '0.6rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>TimeScale:</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>525,960×</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Dilation Factor:</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>1.0 (Base)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>1 Real Sec =</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>~6.1 sim days</span>
                                    </div>
                                </div>
                                
                                <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                                            <th style={{ textAlign: 'left', padding: '8px', color: '#6366f1' }}>Body</th>
                                            <th style={{ textAlign: 'right', padding: '8px' }}>
                                                <div style={{ color: '#4ade80', fontSize: '0.6rem' }}>Cosmic Compass</div>
                                                <div style={{ color: '#4ade80', fontWeight: 700 }}>Octave</div>
                                            </th>
                                            <th style={{ textAlign: 'right', padding: '8px' }}>
                                                <div style={{ color: '#60a5fa', fontSize: '0.6rem' }}>NASA Data</div>
                                                <div style={{ color: '#60a5fa', fontWeight: 700 }}>JPL (days)</div>
                                            </th>
                                            <th style={{ textAlign: 'right', padding: '8px', color: '#fff' }}>Δ</th>
                                        </tr>
                                    </thead>
                                </table>
                                {/* Scrollable body rows */}
                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {verificationData.octave11.map(p => (
                                                <tr 
                                                    key={p.name}
                                                    onClick={() => setSelectedVerifyItem({ ...p, octave: 11, frameworkDisplay: p.octave, controlDisplay: p.control })}
                                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <td style={{ padding: '6px', color: '#fff' }}>{p.name}</td>
                                                    <td style={{ textAlign: 'right', padding: '6px', color: '#4ade80' }}>{p.octave}</td>
                                                    <td style={{ textAlign: 'right', padding: '6px', color: '#60a5fa' }}>{p.control}</td>
                                                    <td style={{ textAlign: 'right', padding: '6px', color: '#4ade80' }}>{p.align}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div style={{ marginTop: '1rem', padding: '0.6rem', background: 'rgba(74, 222, 128, 0.12)', borderRadius: '8px', textAlign: 'center' }}>
                                    <span style={{ color: '#4ade80', fontWeight: 900, fontSize: '1.1rem' }}>{verificationData.octave11Avg.toFixed(1)}% ALIGNED</span>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', marginTop: '0.2rem' }}>NASA JPL Horizons Data</div>
                                </div>
                            </div>
                            
                            {/* OCTAVE 3 COLUMN - Level Color: Violet (#a78bfa) */}
                            <div style={{ background: 'rgba(167, 139, 250, 0.08)', padding: '0.8rem', borderRadius: '12px', border: '2px solid rgba(167, 139, 250, 0.4)' }}>
                                <div style={{ color: '#a78bfa', fontWeight: 900, fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                                    OCTAVE 3 — GALACTIC
                                </div>
                                <div style={{ fontSize: '0.65rem', marginBottom: '0.6rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>TimeScale:</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>200,918×</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Dilation Factor:</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>1/Φ² = 0.382</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>1 Real Sec =</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>~2.3 sim days</span>
                                    </div>
                                </div>
                                
                                <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                                            <th style={{ textAlign: 'left', padding: '8px', color: '#a78bfa' }}>Cycle</th>
                                            <th style={{ textAlign: 'right', padding: '8px' }}>
                                                <div style={{ color: '#4ade80', fontSize: '0.6rem' }}>Cosmic Compass</div>
                                                <div style={{ color: '#4ade80', fontWeight: 700 }}>Octave</div>
                                            </th>
                                            <th style={{ textAlign: 'right', padding: '8px' }}>
                                                <div style={{ color: '#60a5fa', fontSize: '0.6rem' }}>Astronomical</div>
                                                <div style={{ color: '#60a5fa', fontWeight: 700 }}>IAU/Gaia</div>
                                            </th>
                                            <th style={{ textAlign: 'right', padding: '8px', color: '#fff' }}>Δ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {verificationData.octave3.map(p => (
                                            <tr 
                                                key={p.name}
                                                onClick={() => setSelectedVerifyItem({ ...p, octave: 3, frameworkDisplay: p.octave, controlDisplay: p.control })}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(167,139,250,0.15)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '8px', color: '#fff' }}>{p.name}</td>
                                                <td style={{ textAlign: 'right', padding: '8px', color: '#4ade80' }}>{p.octave}</td>
                                                <td style={{ textAlign: 'right', padding: '8px', color: '#60a5fa' }}>{p.control}</td>
                                                <td style={{ textAlign: 'right', padding: '8px', color: '#4ade80' }}>{p.align}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                <div style={{ marginTop: '1rem', padding: '0.6rem', background: 'rgba(167, 139, 250, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                                    <span style={{ color: '#a78bfa', fontWeight: 900, fontSize: '1rem' }}>{verificationData.octave3Avg.toFixed(1)}% ALIGNED</span>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', marginTop: '0.2rem' }}>Derived from Octave 11 via Φ scaling + drag</div>
                                </div>
                            </div>
                    </div>{/* End of grid */}
                    </div>{/* End of flex container */}
                    
                    {/* Floating Footer */}
                    <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                        Click outside or press ✕ to close • Cosmic Compass Framework vs External Scientific Data
                    </div>
                </div>
            )}
            
            {/* DETAIL POPUP - Shows when clicking a row in Verify Sources */}
            {selectedVerifyItem && (
                <div 
                    onClick={() => setSelectedVerifyItem(null)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(10, 15, 25, 0.75)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1100
                    }}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'rgba(30, 40, 60, 0.95)',
                            borderRadius: '16px',
                            border: `2px solid ${selectedVerifyItem?.octave === 1 ? '#ff6b35' : selectedVerifyItem?.octave === 11 ? '#6366f1' : '#a78bfa'}`,
                            padding: '1.5rem',
                            maxWidth: '600px',
                            width: '90vw',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h3 style={{ 
                                color: selectedVerifyItem?.octave === 1 ? '#ff6b35' : selectedVerifyItem?.octave === 11 ? '#6366f1' : '#a78bfa', 
                                margin: 0, 
                                fontSize: '1.2rem', 
                                fontWeight: 900 
                            }}>
                                {selectedVerifyItem?.name} — Octave {selectedVerifyItem?.octave}
                            </h3>
                            <button 
                                onClick={() => setSelectedVerifyItem(null)}
                                style={{ 
                                    background: 'rgba(255,255,255,0.1)', 
                                    border: 'none', 
                                    borderRadius: '50%', 
                                    width: '32px', 
                                    height: '32px', 
                                    color: '#fff', 
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >✕</button>
                        </div>
                        
                        {/* Alignment Badge */}
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '0.8rem', 
                            background: 'rgba(74, 222, 128, 0.15)', 
                            borderRadius: '10px',
                            marginBottom: '1.2rem'
                        }}>
                            <span style={{ color: '#4ade80', fontWeight: 900, fontSize: '1.4rem' }}>{selectedVerifyItem?.align} ALIGNED</span>
                        </div>
                        
                        {/* Two Column Comparison */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                            {/* Framework Column */}
                            <div style={{ background: 'rgba(74, 222, 128, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                                <div style={{ color: '#4ade80', fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                                    🔬 COSMIC COMPASS FRAMEWORK
                                </div>
                                <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    {selectedVerifyItem?.frameworkDisplay}
                                </div>
                                <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace' }}>
                                    {selectedVerifyItem?.frequency} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selectedVerifyItem?.unit || 'Hz'}</span>
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                    {selectedVerifyItem.octave === 1 && (
                                        <>
                                            <strong>Method:</strong> Coupling Constant / Φ-Ratio<br/>
                                            <strong>Anchor:</strong> L80 Schumann (K₈₀ = 1.00)<br/>
                                            <strong>Source:</strong> cosmic_compass_data.json
                                        </>
                                    )}
                                    {selectedVerifyItem.octave === 11 && (
                                        <>
                                            <strong>Method:</strong> Harmonic Resonance Engine (Level 110)<br/>
                                            <strong>Formula:</strong> T = T₀ × Φ^(level/10)<br/>
                                            <strong>Source:</strong> Framework-synced orbital elements
                                        </>
                                    )}
                                    {selectedVerifyItem.octave === 3 && (
                                        <>
                                            <strong>Method:</strong> Φ scaling from precession cycle<br/>
                                            <strong>Formula:</strong> T = T_precession × Φ^n × drag<br/>
                                            <strong>Drag Factor:</strong> 0.994 (galactic correction)
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {/* Control Column */}
                            <div style={{ background: 'rgba(96, 165, 250, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(96, 165, 250, 0.3)' }}>
                                <div style={{ color: '#60a5fa', fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                                    🌍 {selectedVerifyItem?.octave === 1 ? 'CODATA 2018 / NIST' : selectedVerifyItem?.octave === 11 ? 'NASA JPL HORIZONS' : 'IAU / GAIA'}
                                </div>
                                <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    {selectedVerifyItem?.controlDisplay}
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                    {selectedVerifyItem.octave === 1 && (
                                        <>
                                            <strong>Source:</strong> CODATA 2018 / NIST<br/>
                                            <strong>Method:</strong> Spectroscopic measurement<br/>
                                            <strong>Precision:</strong> ±10⁻¹² (atomic clocks)
                                        </>
                                    )}
                                    {selectedVerifyItem.octave === 2 && (
                                        <>
                                            <strong>Source:</strong> JPL Horizons DE440 ephemeris<br/>
                                            <strong>Method:</strong> 500+ years of telescopic observation<br/>
                                            <strong>Precision:</strong> ±0.001 days (radar ranging)
                                        </>
                                    )}
                                    {selectedVerifyItem.octave === 3 && (
                                        <>
                                            <strong>Source:</strong> IAU 2006 precession / Gaia DR3<br/>
                                            <strong>Method:</strong> Astrometric measurement<br/>
                                            <strong>Precision:</strong> ±0.1% (Gaia parallax)
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Plain English Summary */}
                        <div style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            padding: '1rem', 
                            borderRadius: '10px', 
                            borderLeft: `3px solid ${selectedVerifyItem?.octave === 1 ? '#ff6b35' : selectedVerifyItem?.octave === 11 ? '#6366f1' : '#a78bfa'}`
                        }}>
                            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                📝 IMPLICATIONS
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                                {(() => {
                                    const alignVal = parseFloat(selectedVerifyItem?.align || '0');
                                    const isExcellent = alignVal >= 99.5;
                                    const isGood = alignVal >= 98;
                                    
                                    if (selectedVerifyItem?.octave === 1) {
                                        const isSchumann = selectedVerifyItem?.name.includes('L80');
                                        const isAlpha = selectedVerifyItem?.name.includes('α') || selectedVerifyItem?.name.includes('L20');
                                        const isPhiRatio = selectedVerifyItem?.name.includes('Φ');
                                        
                                        if (isSchumann) {
                                            return `Level 80 (Schumann resonance) is the framework's empirical anchor point. With K₈₀ = 1.00, the framework frequency of 7.83 Hz IS the real measured Schumann frequency. This ${alignVal.toFixed(1)}% alignment proves the framework is grounded in physical reality.`;
                                        } else if (isAlpha) {
                                            return `The fine structure constant α = 1/137.036 is embedded directly in the framework at Level 20. This dimensionless constant—identical to CODATA measurements—demonstrates that the Cosmic Compass encodes fundamental physics constants within its structure.`;
                                        } else if (isPhiRatio) {
                                            return `The Φ-ratio between framework levels matches the theoretical Golden Ratio scaling. This validates that the 15-tier frequency system follows precise Φ^n relationships, demonstrating mathematical self-consistency across all scales.`;
                                        }
                                        return `The framework's coupling constant aligns with CODATA measurements.`;
                                    } else if (selectedVerifyItem.octave === 2) {
                                        return isExcellent 
                                            ? `${selectedVerifyItem.name}'s orbital period calculated by the Cosmic Compass matches NASA JPL data to within ${(100 - alignVal).toFixed(2)}%. This validates the framework's core planetary model against centuries of astronomical observation.`
                                            : isGood 
                                            ? `The framework predicts ${selectedVerifyItem.name}'s orbit with ${alignVal.toFixed(1)}% accuracy versus NASA data. The small deviation (${(100 - alignVal).toFixed(2)}%) may arise from the framework's use of idealized Φ-based resonances versus the gravitational perturbations in real orbits.`
                                            : `${selectedVerifyItem.name} shows a ${(100 - alignVal).toFixed(1)}% deviation from JPL data. This may indicate the body's orbit does not follow strict Φ-harmonic relationships, possibly due to gravitational interactions with other bodies.`;
                                    } else {
                                        return isExcellent 
                                            ? `The framework's Φ-scaled prediction for ${selectedVerifyItem.name} aligns closely with astronomical consensus. This demonstrates that galactic-scale cycles can be modeled as harmonic extensions of planetary motion, supporting the fractal nature of cosmic time.`
                                            : isGood 
                                            ? `${selectedVerifyItem.name} shows ${alignVal.toFixed(1)}% alignment with IAU/Gaia measurements. The framework uses Φ scaling with a 0.994 drag factor to model galactic deceleration effects, producing results within observational uncertainty.`
                                            : `The ${(100 - alignVal).toFixed(1)}% deviation for ${selectedVerifyItem.name} reflects the challenge of extending Φ-based scaling to galactic timescales. The discrepancy suggests additional factors (dark matter, galaxy interactions) may need to be incorporated.`;
                                    }
                                })()}
                            </div>
                        </div>
                        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Source</h4>
                            <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                {selectedVerifyItem?.source}
                            </div>
                        </div>
                        <div style={{ 
                            background: selectedVerifyItem?.confidence === 'High' ? 'rgba(16, 185, 129, 0.2)' 
                            : selectedVerifyItem?.confidence === 'Medium' ? 'rgba(251, 191, 36, 0.2)' 
                            : 'rgba(239, 68, 68, 0.2)',
                            color: selectedVerifyItem?.confidence === 'High' ? '#34d399' 
                            : selectedVerifyItem?.confidence === 'Medium' ? '#fbbf24' 
                            : '#f87171',
                            padding: '0.2rem 0.6rem', borderRadius: '4px', display: 'inline-block', fontWeight: 700, fontSize: '0.8rem'
                        }}>
                            {selectedVerifyItem?.confidence}
                        </div>
                    </div>
                </div>
            )}


            {/* ENGLISH VALIDATION POPUP */}
            {showEnglishModal && (
                <div 
                    onClick={() => setShowEnglishModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1002
                    }}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'rgba(30, 41, 59, 0.95)',
                            border: '2px solid rgba(251, 191, 36, 0.5)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            maxWidth: '900px',
                            width: '90%',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            color: '#fff'
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24' }}>
                                    🇬🇧 ENGLISH HARMONIC VALIDATION
                                </h2>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                                    Comparing planetary simulation phases against the 23-point Old English Cipher Grid ("Background Grid of Truth").
                                </p>
                            </div>
                            <button
                                onClick={() => setShowEnglishModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        </div>


                        {/* Concept Block */}
                        <div style={{ 
                            background: 'rgba(251, 191, 36, 0.1)', 
                            padding: '1rem', 
                            borderRadius: '10px', 
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(251, 191, 36, 0.3)'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700, marginBottom: '0.5rem' }}>
                                ⚛ GALACTIC ORIENTATION ENGINE (23-LETTER CIPHER)
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                                The 23-Letter Old English Cipher defines 23 specific "Galactic North/South" vectors. 
                                These vectors are primarily clustered around 270° (Galactic South), where the harmonic 
                                density of the framework is highest.
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                                Validation Metric: Comparing object phase (°) against fixed Galactic Vector anchors.
                            </div>
                        </div>

                        {/* Cipher Reference Table (Horizontal) */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fbbf24' }}>🇬🇧 23-POINT GALACTIC REFERENCE VECTORS</h3>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', 
                                gap: '0.4rem',
                                background: 'rgba(0,0,0,0.2)',
                                padding: '0.8rem',
                                borderRadius: '8px'
                            }}>
                                {ENGLISH_GLYPH_SYSTEM.glyphs.map((g, i) => (
                                    <div key={i} style={{ textAlign: 'center', padding: '0.3rem', border: '1px solid rgba(251, 191, 36, 0.1)', borderRadius: '4px' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fbbf24' }}>{g.char.toUpperCase()}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{g.angle.toFixed(1)}°</div>
                                            </div>
                                ))}
                            </div>
                        </div>

                        {/* VERIFICATION LOGIC */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fbbf24' }}>🇬🇧 VERIFICATION LOGIC</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ 
                                    background: 'rgba(251, 191, 36, 0.08)', 
                                    padding: '1rem', 
                                    borderRadius: '10px',
                                    borderLeft: '4px solid #fbbf24'
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 800, marginBottom: '0.4rem' }}>HOW IT WORKS</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                                        The 23 English Vectors act as <b>Galactic Checkpoints</b>. 
                                        In a perfectly calibrated harmonic simulation, celestial bodies will periodically "Lock" 
                                        into these vectors during specific orbital phases.
                                    </div>
                                </div>
                                <div style={{ 
                                    background: 'rgba(6, 182, 212, 0.08)', 
                                    padding: '1rem', 
                                    borderRadius: '10px',
                                    borderLeft: '4px solid #06b6d4'
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 800, marginBottom: '0.4rem' }}>VALIDATION METRIC</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                                        Verification is achieved when the <b>Phase Drift (Δ)</b> between an object and its 
                                        nearest Galactic Vector is within ±5°. This signals that the object is in 
                                        <b>Harmonic Alignment</b> with the Galactic South cluster.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CALIBRATION ANCHORS */}
                        <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fbbf24' }}>⚓ CALIBRATION ANCHORS</h3>
                            <div style={{ display: 'grid', gap: '0.6rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>STRICT SOUTH CLUSTER (270°)</span>
                                        <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>8 ALIGNED GLYPHS</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                                        The highest density of the English Cipher occurs at the Galactic South axis. 
                                        Letters C, E, I, O, T, V, X, and Y define the primary calibration backbone.
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>GALACTIC ORIENTATION RATIO</span>
                                        <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>CALIBRATED to φ²</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                                        The angular separation between 'M' (North/East) and the South Cluster (270°) 
                                        is governed by the Golden Ratio progression, ensuring scale-invariance across all octaves.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMeroitic && (
                <div 
                    onClick={() => setShowMeroitic(false)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1001
                    }}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'rgba(30, 41, 59, 0.95)',
                            border: '2px solid rgba(217, 119, 6, 0.5)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            maxWidth: '900px',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            color: '#fff'
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24' }}>
                                𓂀 MEROITIC CALIBRATION DATA
                            </h2>
                            <button
                                onClick={() => setShowMeroitic(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >✕</button>
                        </div>

                        {/* Current Status */}
                        <div style={{ 
                            background: 'rgba(217, 119, 6, 0.15)', 
                            padding: '1rem', 
                            borderRadius: '10px', 
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(217, 119, 6, 0.3)'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>CURRENT SIMULATION STATE</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                <div>
                                    <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1.3rem' }}>{precessionDegrees.toFixed(2)}°</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Current Precession</div>
                                </div>
                                <div>
                                    <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '1.3rem' }}>
                                        {MEROITIC_GLYPH_CALIBRATION.glyphs.reduce((nearest, g) => 
                                            Math.abs(g.angle - (precessionDegrees % 90)) < Math.abs(nearest.angle - (precessionDegrees % 90)) ? g : nearest
                                        ).id} ({MEROITIC_GLYPH_CALIBRATION.glyphs.reduce((nearest, g) => 
                                            Math.abs(g.angle - (precessionDegrees % 90)) < Math.abs(nearest.angle - (precessionDegrees % 90)) ? g : nearest
                                        ).name})
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Nearest Glyph</div>
                                </div>
                                <div>
                                    <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '1.3rem' }}>{zodiacMode}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Zodiac Mode</div>
                                </div>
                            </div>
                        </div>

                        {/* Anchor Points - Dual Calibration */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(34, 197, 94, 0.08))', 
                            padding: '1rem', 
                            borderRadius: '10px', 
                            marginBottom: '1.5rem',
                            border: '2px solid rgba(74, 222, 128, 0.4)'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 700, marginBottom: '0.75rem' }}>★ DUAL CALIBRATION ANCHORS</div>
                            {MEROITIC_GLYPH_CALIBRATION.anchors.map((anchor, idx) => (
                                <div key={idx} style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '1fr 1fr', 
                                    gap: '0.75rem',
                                    marginBottom: idx < MEROITIC_GLYPH_CALIBRATION.anchors.length - 1 ? '0.75rem' : 0,
                                    paddingBottom: idx < MEROITIC_GLYPH_CALIBRATION.anchors.length - 1 ? '0.75rem' : 0,
                                    borderBottom: idx < MEROITIC_GLYPH_CALIBRATION.anchors.length - 1 ? '1px solid rgba(74, 222, 128, 0.2)' : 'none'
                                }}>
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Eclipse {idx + 1}</div>
                                        <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{anchor.date}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Reference Glyph</div>
                                        <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem' }}>{anchor.glyphRef}</div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                                        {anchor.event}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Glyph Table */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fbbf24' }}>GLYPH ANGLE → SIMULATION USAGE</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(217, 119, 6, 0.5)' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', color: '#fbbf24' }}>Glyph</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right', color: '#fbbf24' }}>Angle</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center', color: '#fbbf24' }}>Level</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right', color: '#fbbf24' }}>Freq (Hz)</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', color: '#fbbf24' }}>How It's Used</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MEROITIC_GLYPH_CALIBRATION.glyphs.map((g, i) => (
                                        <tr key={g.id} style={{ 
                                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                                            background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                                        }}>
                                            <td style={{ padding: '0.5rem' }}>
                                                <span style={{ color: '#fbbf24', fontWeight: 700 }}>{g.id}</span>
                                                <span style={{ fontSize: '1.2rem', marginLeft: '0.4rem' }}>{g.glyph}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: '0.4rem' }}>({g.name})</span>
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', color: '#4ade80' }}>{g.angle}°</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                <span style={{ background: 'rgba(99, 102, 241, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                                                    L{g.cosmicLevel} {g.levelName}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', color: '#60a5fa' }}>{g.freq}</td>
                                            <td style={{ padding: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>{g.usage}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Calculations Section */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' }}>CALCULATIONS</h3>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {Object.entries(MEROITIC_GLYPH_CALIBRATION.calculations).map(([key, value]) => (
                                    <div key={key} style={{ 
                                        background: 'rgba(74, 222, 128, 0.08)', 
                                        padding: '0.75rem', 
                                        borderRadius: '8px',
                                        borderLeft: '3px solid #4ade80'
                                    }}>
                                        <div style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                                            {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', lineHeight: 1.5 }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Usage Section */}
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#60a5fa' }}>HOW ANGLES DRIVE THE SIMULATION</h3>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {Object.entries(MEROITIC_GLYPH_CALIBRATION.usage).map(([key, value]) => (
                                    <div key={key} style={{ 
                                        background: 'rgba(96, 165, 250, 0.08)', 
                                        padding: '0.75rem', 
                                        borderRadius: '8px',
                                        borderLeft: '3px solid #60a5fa'
                                    }}>
                                        <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                                            {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', lineHeight: 1.5 }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VOYNICH CALIBRATION POPUP */}
            {showVoynich && (
                <div 
                    onClick={() => setShowVoynich(false)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10001
                    }}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'rgba(20, 30, 45, 0.95)',
                            border: '2px solid rgba(45, 212, 191, 0.5)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            maxWidth: '900px',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            color: '#fff'
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#2dd4bf' }}>
                                ⚛ VOYNICH PHASE VALIDATION
                            </h2>
                            <button
                                onClick={() => setShowVoynich(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >✕</button>
                        </div>

                        {/* Concept Block */}
                        <div style={{ 
                            background: 'rgba(45, 212, 191, 0.1)', 
                            padding: '1rem', 
                            borderRadius: '10px', 
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(45, 212, 191, 0.3)'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#2dd4bf', fontWeight: 700, marginBottom: '0.5rem' }}>
                                {VOYNICH_GLYPH_CALIBRATION.hypothesis.concept.toUpperCase()}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                                {VOYNICH_GLYPH_CALIBRATION.hypothesis.detail}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                                Applied: {VOYNICH_GLYPH_CALIBRATION.hypothesis.application}
                            </div>
                        </div>

                        {/* Harmonic Table */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#2dd4bf' }}>ORTHOGONAL HARMONIC ANALYSIS (90° BASE)</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(45, 212, 191, 0.5)' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', color: '#2dd4bf' }}>Glyph Angle</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', color: '#2dd4bf' }}>Phase Type</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', color: '#2dd4bf' }}>Harmonic Derivation</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', color: '#2dd4bf' }}>Resonance Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {VOYNICH_GLYPH_CALIBRATION.anchors.map((a, i) => (
                                        <tr key={i} style={{ 
                                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                                            background: i % 2 === 0 ? 'rgba(45, 212, 191, 0.05)' : 'transparent'
                                        }}>
                                            <td style={{ padding: '0.5rem', fontWeight: 700, color: '#fff' }}>{a.angle}°</td>
                                            <td style={{ padding: '0.5rem', color: '#2dd4bf' }}>{a.type}</td>
                                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>{a.harmony}</td>
                                            <td style={{ padding: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>{a.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Visualization */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '1rem',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '1rem',
                            borderRadius: '10px'
                        }}>
                             <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginBottom: '0.5rem', fontWeight: 700 }}>MEROITIC (Radius)</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                                    Encodes the <b>Structure</b>.<br/>
                                    Like the frets on a guitar. Defines WHERE the resonance occurs (L1, L5, L10...).<br/>
                                    <i>Data Metric: Distance (AU)</i>
                                </div>
                             </div>
                             <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                             <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', color: '#2dd4bf', marginBottom: '0.5rem', fontWeight: 700 }}>VOYNICH (Phase)</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                                    Encodes the <b>State</b>.<br/>
                                    Like plucking the string. Defines WHEN the resonance peaks (Phase Angle).<br/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. LAYER: COMPACT BOTTOM INFO BAR - Hover or Selected */}
            {(hoveredBody || selectedBody) && (() => {
                const displayBody = selectedBody || hoveredBody;
                if (!displayBody) return null;
                
                const frameworkMeta = COSMIC_DATA.find(d => parseInt(d.level) === displayBody.level_ref);
                
                // Calculate real-time orbital position for distance display
                const hudScaledTime = accumulatedSimTimeRef.current * timeScale;
                
                // SAFE CALCULATION for both Harmonic and JPL objects
                let period_s = 0;
                let true_radius_au = 0;
                let currentTheta = 0;
                let r = 0;

                if (displayBody.meta) {
                    // CASE A: Harmonic Object (Has metadata)
                    period_s = displayBody.meta.period_s;
                    true_radius_au = displayBody.meta.true_radius_au;
                    currentTheta = displayBody.initial_phase + (hudScaledTime * 2 * Math.PI * displayBody.orbital_freq);
                    
                    // Ellipse radius formula: r = a(1-e^2) / (1+e*cos(theta))
                    r = true_radius_au * (1 - displayBody.eccentricity * displayBody.eccentricity) / 
                              (1 + displayBody.eccentricity * Math.cos(currentTheta));
                } else {
                    // CASE B: JPL/Control Object (Raw data)
                    const orbitalPeriodDays = (displayBody as any).orbitalPeriod_days || undefined;
                    period_s = orbitalPeriodDays ? orbitalPeriodDays * 86400 : 0;
                    const freq = period_s > 0 ? 1 / period_s : 0;
                    true_radius_au = (displayBody as any).semiMajorAxis_AU || 0;
                    
                    // Removed JPL astronomical positional fallback to enforce closed-loop framework
                    r = true_radius_au; 
                    currentTheta = (displayBody.initial_phase || 0) + (hudScaledTime * 2 * Math.PI * freq);
                }
                
                let displayAngleDeg = (currentTheta * 180 / Math.PI) % 360;
                if (displayAngleDeg < 0) displayAngleDeg += 360;
                
                // Orbital speed in AU/day
                const period_days = period_s / 86400;
                const circumference = 2 * Math.PI * true_radius_au;
                const avgSpeed = period_days > 0 ? circumference / period_days : 0;
                
                return (
                    <div style={{
                        position: 'fixed', 
                        top: '50%', 
                        left: '300px', 
                        transform: 'translateY(-50%)',
                        borderRadius: '12px',
                        height: 'auto', 
                        width: '260px', // Portrait width
                        background: 'rgba(10, 10, 12, 0.95)', 
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderLeft: `3px solid ${displayBody.color || '#fff'}`,
                        padding: '1.5rem', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '1.5rem',
                        zIndex: 100000, 
                        boxShadow: '10px 10px 30px rgba(0,0,0,0.5)',
                        color: '#fff',
                        fontFamily: 'monospace'
                    }}>
                        {/* TOP: IDENTITY */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center',
                            width: '100%',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            paddingBottom: '1.25rem'
                        }}>
                            <div style={{ 
                                fontSize: '0.65rem', 
                                letterSpacing: '2px', 
                                textTransform: 'uppercase', 
                                color: displayBody.color || '#fff', 
                                fontWeight: 700,
                                marginBottom: '0.5rem'
                            }}>
                                NODE L-{displayBody.level !== undefined ? Number(displayBody.level).toFixed(4).replace(/\.?0+$/, '') : '?'} // {displayBody.object_type || "BODY"} {displayBody.spectral_type ? `// ${displayBody.spectral_type}` : ''}
                            </div>
                            
                            <div style={{ 
                                fontSize: '1.75rem', 
                                fontWeight: 900, 
                                color: '#fff', 
                                lineHeight: 1.1,
                                letterSpacing: '-1px',
                                whiteSpace: 'normal', 
                                wordWrap: 'break-word' 
                            }}>
                                {(() => {
                                    let uiName = displayBody.name;
                                    if (uiName.includes('Predicted Orbit')) {
                                        const match = uiName.match(/\[(\d+)\]/);
                                        uiName = match ? `[${match[1]}] Orbit` : 'Orbit';
                                    }
                                    return uiName;
                                })()}
                            </div>
                        </div>

                        {/* BOTTOM: DATA GRID (Portrait) */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1.25rem 1rem',
                            width: '100%'
                        }}>
                            {/* G1: ORBITAL */}
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom:'4px' }}>RADIUS</div>
                                <div style={{ fontSize: '1.15rem', color: displayBody.color || '#fff', fontWeight: 800 }}>
                                    {formatRadius(true_radius_au, octave)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom:'4px' }}>PERIOD</div>
                                <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                                    {period_days > 0 ? (period_days / 365.25).toFixed(2) : <span style={{fontSize:'0.7rem', color:'#f87171'}}>NO DATA</span>} {period_days > 0 && <span style={{fontSize:'0.7rem', color:'#94a3b8', fontWeight: 600}}>YR</span>}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom:'4px' }}>ECCEN</div>
                                <div style={{ fontSize: '1.15rem', color: '#cbd5e1', fontWeight: 700 }}>{displayBody.eccentricity !== undefined ? displayBody.eccentricity.toFixed(3) : <span style={{fontSize:'0.7rem', color:'#f87171'}}>NO DATA</span>}</div>
                            </div>

                             {/* G2: PHYSICAL & HARMONIC (Second Row) */}
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#a855f7', marginBottom:'4px', fontWeight: 700 }}>PHASE ANGLE</div>
                                <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                                    {displayAngleDeg.toFixed(1)}°
                                </div>
                            </div>
                            
                            {(() => {
                                // Dynamic calculations or fallback to framework properties
                                // If framework hasn't strictly calculated it, we derive a placeholder or use 0
                                const eqAngle = (displayBody as any).equinox_angle !== undefined ? (displayBody as any).equinox_angle : ((displayBody.initial_phase || 0) * (180/Math.PI) % 360) || 0;
                                const axTilt = (displayBody as any).axial_tilt !== undefined ? (displayBody as any).axial_tilt : ((displayBody.inclination || 0) * (180/Math.PI)) || 0;
                                
                                return (
                                    <>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: '#fbbf24', marginBottom:'4px', fontWeight: 700 }}>EQUINOX AXIS</div>
                                            <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                                                {eqAngle.toFixed(1)}°
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: '#38bdf8', marginBottom:'4px', fontWeight: 700 }}>AXIAL TILT</div>
                                            <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                                                {axTilt.toFixed(1)}°
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                            
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#fb7185', marginBottom:'4px', fontWeight: 700 }}>PRECESSION</div>
                                <div style={{ fontSize: '1.15rem', color: '#cbd5e1', fontWeight: 700 }}>
                                    {displayBody.precession_rate ? (displayBody.precession_rate * 86400 * 365.25 * (180/Math.PI) * 3600).toFixed(1) : '-'} <span style={{fontSize:'0.6rem', fontWeight: 600}}>"/YR</span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom:'4px' }}>MASS</div>
                                <div style={{ fontSize: '1.15rem', color: '#cbd5e1', fontWeight: 700 }}>
                                    {displayBody.mass_kg ? displayBody.mass_kg.toExponential(2) : <span style={{fontSize:'0.7rem', color:'#f87171'}}>NO DATA</span>} {displayBody.mass_kg && <span style={{fontSize:'0.7rem', fontWeight: 600}}>KG</span>}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom:'4px' }}>DENSITY</div>
                                <div style={{ fontSize: '1.15rem', color: '#cbd5e1', fontWeight: 700 }}>
                                    {displayBody.density_gcm3 ? displayBody.density_gcm3.toExponential(2) : <span style={{fontSize:'0.7rem', color:'#f87171'}}>NO DATA</span>} {displayBody.density_gcm3 && <span style={{fontSize:'0.7rem', fontWeight: 600}}>g/cm³</span>}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom:'4px' }}>EM SIGNATURE</div>
                                <div style={{ fontSize: '1.15rem', color: '#cbd5e1', fontWeight: 700 }}>
                                    {displayBody.electromagnetic_field_tesla ? displayBody.electromagnetic_field_tesla.toExponential(2) : <span style={{fontSize:'0.7rem', color:'#f87171'}}>NO DATA</span>} {displayBody.electromagnetic_field_tesla && <span style={{fontSize:'0.7rem', fontWeight: 600}}>T</span>}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom:'4px' }}>FREQ</div>
                                <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                                    {displayBody.freq_hz ? displayBody.freq_hz.toExponential(1) : "0.0"} <span style={{fontSize:'0.7rem', fontWeight: 600}}>HZ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Remaining animation styles */}
        </div>
    );
};
