import { HarmonicBody } from "../science/HarmonicResonanceEngine";
import { CosmicRecursionEngine } from "./CosmicRecursionEngine";

/**
 * NORMALIZATION ENGINE
 * 
 * Purpose: Decouple Physical Reality from Visual Representation.
 * 
 * Problem: Octave 1 is $10^{-9}$ AU. Octave 3 is $10^9$ AU. 
 * Rendering these raw values requires massive camera zooms, causing
 * precision loss, jitter, and the "chug" race condition.
 * 
 * Solution: Normalize ALL data to a standard 0-1000 unit grid.
 * The UI becomes a "dumb renderer" that just draws circles at (x,y).
 */

export interface RenderableBody extends HarmonicBody {
    // VISUAL COORDINATES (0-1000 Grid)
    visual: {
        radius_px: number; // Size of the body itself
        orbit_radius_px: number; // Size of the orbit
        x: number;
        y: number;
    };
    // Additional UI properties
    type?: string;
    mass_kg?: number;
    radius_km?: number;
    // PHYSICAL METADATA (For HUD)
    meta: {
        radius_txt: string;
        period_txt: string;
        velocity_txt: string;
    }
}

export class NormalizationEngine {
    
    // STANDARD GRID CONSTANTS
    private static readonly GRID_SIZE = 1000;
    private static readonly CENTER = 500;
    private static readonly BASELINE_ORBIT = 300; // 300px radius for Earth-like orbit
    
    /**
     * Normalize a list of Physical Bodies into Renderable Bodies.
     * @param bodies - Raw physical bodies from HarmonicResonanceEngine
     * @param octave - The current octave (1, 2, 3...)
     */
    public static normalize(bodies: HarmonicBody[], octave: number): RenderableBody[] {
        // 1. Determine the Normalization Factor
        // We use the INVERSE of the Lattice Radius Ratio to normalize everything to Octave 2 Scale (1.0).
        // Then we multiply by BASELINE_ORBIT (300px) to fit the screen.
        
        const ratios = CosmicRecursionEngine.getLatticeRatios(octave);
        const latticeScale = ratios.radius; // e.g. 10^-9
        
        // Scalar: If Octave 1 is 10^-9, we need 10^9 to bring it to 1.0, then * 300 to bring to pixels.
        // If Octave 2 is 1.0, we just multiply by 300.
        const scalar = (1.0 / latticeScale) * this.BASELINE_ORBIT;
        
        // 2. Transform Data
        return bodies.map(body => {
            const orbit_px = body.radius_au * scalar;
            
            // Calculate Position (Simple circular for now, Elliptical later if needed)
            // Note: Phase is handled by the renderer animation loop usually, 
            // but here we establish the baseline orbit path.
            
            return {
                ...body,
                visual: {
                    radius_px: Math.max(3, body.body_radius * 2), // Standardized 3px min size
                    orbit_radius_px: orbit_px,
                    x: this.CENTER + orbit_px, 
                    y: this.CENTER
                },
                meta: {
                    radius_txt: this.formatDistance(body.radius_au),
                    period_txt: this.formatPeriod(body.period_sec),
                    velocity_txt: "0 km/s" 
                }
            };
        });
    }
    
    // --- FORMATTERS ---
    
    private static formatDistance(au: number): string {
        if (au < 1e-6) return `${(au * 1.496e+8).toExponential(2)} km`;
        if (au < 0.1) return `${(au * 149.6e6).toFixed(0)} km`;
        if (au > 1000) return `${(au / 206265).toFixed(2)} pc`;
        return `${au.toFixed(2)} AU`;
    }
    
    private static formatPeriod(seconds: number): string {
        const y = seconds / (365.25 * 86400);
        if (y < 1e-6) return `${(seconds * 1000).toFixed(2)} ms`;
        if (y < 1/365) return `${(seconds / 3600).toFixed(2)} h`;
        if (y >= 1e6) return `${(y / 1e6).toFixed(1)} MY`;
        return `${y.toFixed(2)} y`;
    }
}
