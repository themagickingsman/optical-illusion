import { CosmicRecursionEngine } from './CosmicRecursionEngine';

/**
 * COSMIC PROJECTOR ENGINE
 * Centralizes all spatial and temporal transforms to ensure physical consistency.
 * Abolishes "Auto-Normalization" to provide an Absolute Scale model.
 */
export class CosmicProjector {
    // 1. SPATIAL ANCHOR: The pixel size of 1 AU in the baseline Octave 2.
    // This provides the "Zoom out to see more" experience.
    public static readonly BASELINE_AU_PX: number = 250; 
    
    // VISUAL STANDARDIZATION
    // The visual radius (px) of the "Standard Octave Orbit" in the Normalized Grid.
    // Used by NormalizationEngine to map physical values to visual pixels.
    public static readonly BASELINE_ORBIT: number = 300;

    /**
     * Calculate the absolute Spatial Scaling ratio for the current octave.
     * This describes how much larger/smaller the world is relative to Octave 2.
     * Pure Lattice Ratio: Phi ^ ((octave - 2) * 28)
     */
    public static getSpatialScaleRatio(octave: number): number {
        return CosmicRecursionEngine.getLatticeRatios(octave).radius;
    }

    /**
     * Project a physical AU distance to pixel coordinates.
     */
    public static projectRadius(radius_au: number): number {
        return radius_au * this.BASELINE_AU_PX;
    }

    /**
     * Centralized Body Projection
     * Calculates size and position for any body in any octave.
     */
    public static projectVisualSize(baseRadius: number, scale: number): number {
        // Bodies should be visually consistent but not "microscopic" when zoomed out.
        // Clamp at 1px minimum.
        return Math.max(1, baseRadius / scale);
    }

    /**
     * Get the recommended Zoom Range for the current octave.
     * Since everything is now absolute scale, we shift the zoom range
     * to ensure the user can always see the "whole system" or "deep dive".
     */
    public static getZoomLimits(octave: number): { min: number, max: number } {
        // Standardized Zoom Range for Normalized Views
        // Octave 2 is now normalized to "System Scale" (Pluto = 1.0 unit).
        // Earth is at 0.025. To see Earth clearly, we need ~40x zoom just to get to previous 1.0 baseline.
        // To zoom INTO Earth, we need much more.
        return {
            min: 1, 
            max: 40000 
        };
    }
}
