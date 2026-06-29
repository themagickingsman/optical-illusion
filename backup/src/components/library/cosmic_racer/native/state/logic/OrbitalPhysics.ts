import { useMemo } from 'react';

// Shared Interface for Celestial Bodies
export interface CelestialBody {
    id: string;
    name: string;
    parentBodyId?: string;
    x?: number;
    y?: number;
    // Orbital Elements
    orbital_freq?: number;
    initial_phase?: number;
    precession_rate?: number;
    eccentricity?: number;
    semiMajorAxis_AU?: number;
    radius_au?: number;
    local_radius_au?: number;
    normalized_radius_au?: number;
}

/**
 * Calculates the geometric properties of an orbit (semi-major axis, eccentricity, focus offset).
 * Shared between the Renderer (Ellipse Path) and the Physics Engine (Body Position).
 */
export const getOrbitGeometry = (b: any, scale: number, scaleFactor: number) => {
    let semiMajor = 0;
    const MIN_ORBIT_PX = 15;
        
    // 1. Calculate Raw Radius in Pixels
    if (b.parentBodyId && b.local_radius_au) {
         // MOON: No Parity Scale
         semiMajor = b.local_radius_au * scaleFactor;
    } else {
         // PLANET: Parity Scale 6.0
         const SYSTEM_PARITY_SCALE = 6.0;
         semiMajor = b.normalized_radius_au * scaleFactor * SYSTEM_PARITY_SCALE;
    }

    // 2. Apply Visual Clamping (Min Size)
    // Only clamp if we are zoomed in somewhat (> 0.1), preventing massive overlaps at deep zoom
    if (scale > 0.1 && semiMajor * scale < MIN_ORBIT_PX) {
        semiMajor = MIN_ORBIT_PX / scale;
    }
    
    // User Request: "our framework is like an alignment grid it's the perfect version"
    // Disable physical Keplerian eccentricity to enforce pure concentric geometric rings.
    const ecc = 0; 
    const semiMinor = semiMajor; 
    const focusOffset = 0;
    
    return { semiMajor, semiMinor, focusOffset, ecc };
};

/**
 * Calculates the position of a celestial body at a given time.
 * Handles hierarchy (recursive parent lookup) and orbital physics.
 */
export const getBodyPosition = (
    b: any, 
    time: number, 
    bodyMap: Map<string, any>,
    center: number,
    scaleFactor: number,
    viewTransformScale: number,
    depth = 0, 
    overrideScale?: number, 
    overrideScaleFactor?: number
): { x: number, y: number } => {
    // Safety: Start with recursion limit
    if (depth > 10) return { x: center, y: center };

    // Check if engine provided position (Dynamic Physics)
    // FIX: Only use hardcoded x/y if it's a NASA JPL/Control body (lacks framework orbital fields)
    if (typeof b.x === 'number' && typeof b.y === 'number' && !b.normalized_radius_au && !b.local_radius_au) {
        return { x: b.x, y: b.y };
    }

    // If it has a parent, calculate parent first
    let parentX = center;
    let parentY = center;
    
    if (b.parentBodyId) {
        if (b.parentBodyId !== b.id) {
            const parent = bodyMap.get(b.parentBodyId);
            if (parent) {
                const pPos = getBodyPosition(parent, time, bodyMap, center, scaleFactor, viewTransformScale, depth + 1, overrideScale, overrideScaleFactor);
                parentX = pPos.x;
                parentY = pPos.y;
            }
        }
    }

    // Use overrideScale if provided (for Camera accuracy), else use current render state
    const currentScale = overrideScale ?? viewTransformScale;
    const currentScaleFactor = overrideScaleFactor ?? scaleFactor;

    // UNIFIED ORBIT GEOMETRY
    const { semiMajor, semiMinor, focusOffset, ecc } = getOrbitGeometry(b, currentScale, currentScaleFactor);

    // Fallback check
    if (!semiMajor && semiMajor !== 0) return { x: parentX, y: parentY };
        
    // MODULO THETA
    const periodSec = (b.orbital_freq && b.orbital_freq > 0) ? (1 / b.orbital_freq) : (1e99); 
    const localTime = time % periodSec;
    
    let thetaTerm = localTime * 2 * Math.PI * b.orbital_freq;
    if (!Number.isFinite(thetaTerm)) thetaTerm = 0; 
    
    const theta = b.initial_phase + thetaTerm;
    const precessionAngle = time * (b.precession_rate || 0);

    // Keplerian Orbit Logic:
    // 1. Calculate position relative to geometric center of ellipse
    let xLocal = semiMajor * Math.cos(theta);
    const yLocal = - (semiMinor * Math.sin(theta)); // Inverse Y-axis for Prograde (Counter-Clockwise)

    // 2. Shift center so Primary is at Focus
    // We add focusOffset to align 0,0 with the Focus.
    xLocal += focusOffset;

    // 3. Apply Precession Rotation
    const xRot = xLocal * Math.cos(precessionAngle) - yLocal * Math.sin(precessionAngle);
    const yRot = xLocal * Math.sin(precessionAngle) + yLocal * Math.cos(precessionAngle);

    return {
        x: parentX + xRot,
        y: parentY + yRot
    };
};
