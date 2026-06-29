import COSMIC_DATA from '../../config/cosmic_compass_data.json';

export interface RecursiveResonance {
    radius_au: number;
    f_eff: number;
    n_eff: number;
    meta: any;
    vocab: {
        path: string;
        wobble: string;
        body: string;
    };
}

/**
 * COSMIC LATTICE AUTHORITY
 * 
 * Coupling Space and Time through the Unified Phi-Power Lattice ($1.618033...).
 * All scaling is derived from Octave 2 as the Unitary Baseline (1.0).
 */
export class CosmicRecursionEngine {
    public static readonly PHI: number = (1 + Math.sqrt(5)) / 2;
    public static readonly OCTAVE_LEVELS: number = 15; // Void (0) to Metaversal (14)
    
    // POWER 16 LATTICE CONSTANTS
    // Adjusted to fit the 15-level Semantic Map (Void -> Solar -> Source)
    // Solar (11) to Atom (3) = 8 steps covering ~10^26 scale.
    // Phi^128 ~= 10^26.7. Therefore Power Span = 16.
    public static readonly TIME_DILATION_POWER: number = 24; // T = R^1.5 -> 16 * 1.5 = 24.
    public static readonly RADIUS_POWER_SPAN: number = 16; 
    
    // BASELINE PHYSICAL ANCHOR (Standard Time)
    // How many simulation seconds pass per wall-clock second at Speed=1.0.
    public static readonly BASELINE_TEMPO: number = 525960; // 1 Year / Minute
    public static readonly SECONDS_PER_YEAR: number = 365.25 * 86400;

    public static readonly F_SYSTEM: number = 19.74; // Level 90 Fundamental (Quantum Frequency)
    public static readonly UNIFIED_BODY_RADIUS: number = 5.5; 

    /**
     * Get the coupled Lattice Ratios for any octave.
     * Incorporates Phase Transitions (Harmonic Bridges) at defined boundaries.
     */
    public static getLatticeRatios(octave: number): { radius: number; period: number; hudDilation: number; visualStability: number } {
        // 1. BASE GEOMETRY (Solar System Anchor)
        const delta = octave - 11;
        const radiusRatio = Math.pow(this.PHI, delta * this.RADIUS_POWER_SPAN);
        // By default, T = R^1.5 (Kepler's 3rd Law for gravitational wells)
        const periodRatio = Math.pow(this.PHI, delta * this.TIME_DILATION_POWER); 
        
        return {
            radius: radiusRatio,
            period: periodRatio,
            hudDilation: periodRatio, // Slow motion for small scales (period < 1 means slow time)
            visualStability: periodRatio // Movement slowdown to match fast orbits
        };
    }

    /**
     * UNIFIED φ-POWER RADIUS CALCULATION
     * Calculates the true mathematical radius in AU for any given precision level 
     * based strictly on the Phi geometry and the Base Anchor (Earth at Level 90 = 1.0 AU).
     */
    public static levelToRadius(level: number): number {
        // Calculate raw mathematical absolute distance based on Octave anchoring
        // Inverting the logic so that lower levels represent the microcosm (Singularity)
        const delta = level - 55.5;
        const phiPower = delta * (this.RADIUS_POWER_SPAN / 111);
        return Math.pow(this.PHI, phiPower);
    }

    /**
     * Get the exact AU boundaries for a given octave.
     * Octave Span = 16 Powers of Phi.
     * Center = (Octave - 11) * 16.
     * Range = Center ± 8.
     */
    public static getOctaveBoundary(octave: number): { minRadius: number; maxRadius: number } {
        // Solar System (Octave 11) is the Anchor (Power 0)
        
        const centerPower = (octave - 11) * this.RADIUS_POWER_SPAN;
        const halfSpan = this.RADIUS_POWER_SPAN / 2;
        
        const minPower = centerPower - halfSpan;
        const maxPower = centerPower + halfSpan;
        
        return {
            minRadius: Math.pow(this.PHI, minPower),
            maxRadius: Math.pow(this.PHI, maxPower)
        };
    }

    /**
     * Get domain-specific vocabulary based on knowledge discipline and scale
     */
    public getDomainVocab(level: number): { path: string; wobble: string; body: string } {
        let base_lvl = ((level % 111) + 111) % 111;
        if (base_lvl === 0 && level > 0 && level % 111 === 0) {
            base_lvl = 111;
        }

        const row = COSMIC_DATA.find(d => parseInt(d.level) === base_lvl) || COSMIC_DATA[0];
        const discipline = row.discipline || "";
        
        const vocab_map: Record<string, { path: string; wobble: string; body: string }> = {
            "Physics": { path: "geodesic", wobble: "quantum fluctuation", body: "particle" },
            "Biology": { path: "metabolic pathway", wobble: "cellular vibration", body: "organism" },
            "Information": { path: "data vector", wobble: "signal noise", body: "node" },
            "Astronomy": { path: "elliptical orbit", wobble: "harmonic perturbation", body: "celestial body" }
        };
        
        let key = "Information";
        if (level >= 111) key = "Astronomy";
        else if (discipline.includes("Biology") || discipline.includes("Chemistry")) key = "Biology";
        else if (discipline.includes("Physics")) key = "Physics";
        
        return vocab_map[key];
    }

    /**
     * Identify the object name based on level and octave
     */
    public getObjectName(level: number, octave: number): string {
        let base_lvl = ((level % 111) + 111) % 111;
        if (base_lvl === 0 && level > 0 && level % 111 === 0) {
            base_lvl = 111;
        }
        const row = COSMIC_DATA.find(d => parseInt(d.level) === base_lvl);
        return row ? (row as any).object_type || `Object ${level}` : `Object ${level}`;
    }

    /**
     * Calculate effective resonance for a given recursive level
     */
    public calculateResonance(level: number, overrideLevel?: number): RecursiveResonance {
        let octave = Math.floor(level / CosmicRecursionEngine.OCTAVE_LEVELS) + 1;
        let base_lvl = ((level % 111) + 111) % 111;
        
        if (base_lvl === 0 && level > 0) {
            if (overrideLevel === 0) base_lvl = 0;
            else base_lvl = 111;
            octave = Math.floor(level / CosmicRecursionEngine.OCTAVE_LEVELS);
        }

        const row = COSMIC_DATA.find(d => parseInt(d.level) === base_lvl) || COSMIC_DATA[0];
        
        // UNIFIED φ-POWER FORMULA: Calculate radius from LEVEL
        // We use the continuous symmetrical mapping spanning -8 to +8 (Span of 16) per Octave
        // Level 55.5 is the exact midpoint representing 1.0 AU (\Phi^0) for Octave 11.
        const phiPower = (base_lvl - 55.5) * (CosmicRecursionEngine.RADIUS_POWER_SPAN / 111);
        // 1. BASE GEOMETRY
        const r_au = Math.pow(CosmicRecursionEngine.PHI, phiPower);
        const period_years = Math.pow(r_au, 1.5);
        
        // Calculate effective final frequency
        const f_eff = 1 / (period_years * CosmicRecursionEngine.SECONDS_PER_YEAR);
        const n_eff = Math.log(f_eff / CosmicRecursionEngine.F_SYSTEM) / Math.log(CosmicRecursionEngine.PHI);
        
        return {
            radius_au: r_au,
            f_eff: f_eff,
            n_eff: n_eff,
            meta: {
                ...row,
                object_name: this.getObjectName(level, octave)
            },
            vocab: this.getDomainVocab(level)
        };
    }

    /**
     * Calculate PERCEPTUAL TEMPO for the simulation movement loop.
     * Returns the scale factor required to maintain visual parity (1 orbit ≈ 60s).
     */
    public static calculatePerceptualTempo(octave: number): number {
        const ratios = this.getLatticeRatios(octave);
        return this.BASELINE_TEMPO * ratios.visualStability;
    }

    /**
     * Calculate TEMPORAL DENSITY factor for the HUD.
     * This reveals how many "Standard Years" pass per "Observer Second".
     */
    public static calculateTemporalDensity(octave: number): number {
        const ratios = this.getLatticeRatios(octave);
        return ratios.hudDilation; 
    }

    /**
     * Calculate HARMONIC VISUAL RADIUS based on Semantic Density.
     * 
     * Base Anchor: Schumann Resonance (Level 80) = 7.83 Hz.
     * We use 7.83 as the visual pixel radius for Earth (The Anchor).
     * 
     * All other bodies scale by the CUBIC ROOT of their diameter ratio to Earth.
     * This preserves "Volumetric Density" in the visual representation.
     * 
     * Formula: R = 7.83 * (Diameter / EarthDiameter)^(1/3)
     */
    public static calculateHarmonicVisualRadius(diameter_km?: number): number {
        const ANCHOR_RADIUS = 7.83; // Schumann Resonance (Level 80)
        const EARTH_DIAMETER = 12742; 
        
        if (!diameter_km) return ANCHOR_RADIUS; // Default to Earth size if unknown
        
        // Cubic Root for Volumetric Scaling (Density-preserving)
        const ratio = diameter_km / EARTH_DIAMETER;
        return ANCHOR_RADIUS * Math.pow(ratio, 1/3);
    }


    public static readonly DILATION_FACTOR: number = Math.pow((1 + Math.sqrt(5)) / 2, 14.2);
    public static readonly SCALING_FACTOR_L90: number = 6.25e8; // Approx scaling factor for Quantum -> Macro projection

    /**
     * Calculate theoretical Time Dilation Factor based on Octave.
     * Formula: D = Phi ^ ((Octave - 1) * 14.2)
     * This ensures "Visual Fractal Similarity" across scales.
     */
    public calculateTimeDilation(octave: number): number {
        // Octave 1: D^0 = 1 (Base)
        // Octave 2: D^1 = 927.35
        // Octave 3: D^2 = 859,983
        const exponent = octave - 1;
        return Math.pow(CosmicRecursionEngine.DILATION_FACTOR, exponent);
    }
}
