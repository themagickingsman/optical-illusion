/**
 * Cosmic Epoch Solver - Closed-Loop Chronological Engine
 * 
 * This engine severs the simulation from arbitrary Earth timelines (Gregorian calendars, Unix epochs).
 * It establishes a pure geometric clock based on the Cosmic Compass framework.
 * 
 * 1 Cosmic Compass Year (CCY) = 1 full geometric precession cycle = 25,772 Base Ticks.
 */

// The fundamental mathematical constant of the framework's precession
export const COSMIC_COMPASS_YEAR = 25772;
export const BASE_TICKS_PER_CCY = COSMIC_COMPASS_YEAR;

import { THE_44_PENTACLES, ROTOR_23_TEETH, calculateAlignment } from './SealAlignmentEngine';

export interface CosmicTimeState {
    // The master metric: Total geometric precession cycles since the Grand Alignment
    totalCCY: number;
    // Whole cycles completed
    completedCycles: number;
    // Fractional progress through the current cycle [0.0 - 1.0]
    cycleProgress: number;
    // Current geometric phase (0-360 degrees) of the current cycle
    phaseDegrees: number;
    // Raw simulation ticks elapsed
    totalTicks: number;
}

/**
 * Converts a raw accumulation of simulation "ticks" into the closed-loop Phase State.
 * In a 1:1 scale running at default speed, 1 Tick = 1 Earth Year of orbital movement.
 * But we decouple the terminology: we process Ticks.
 */
export const getCosmicTime = (cumulativeTicks: number): CosmicTimeState => {
    // We allow negative ticks if simulating backwards before the Epoch
    const totalCCY = cumulativeTicks / BASE_TICKS_PER_CCY;
    const completedCycles = Math.floor(totalCCY);
    
    // Normalize progress to strictly positive 0.0 -> 1.0 within the current cycle
    let cycleProgress = totalCCY - completedCycles;
    if (cycleProgress < 0) cycleProgress += 1.0; 

    const phaseDegrees = cycleProgress * 360;

    return {
        totalCCY,
        completedCycles,
        cycleProgress,
        phaseDegrees,
        totalTicks: cumulativeTicks
    };
};

/**
 * DERIVED PROJECTION: Map the internal geometric state outward to a recognizable Earth Date.
 * By anchoring the Grand Alignment (CCY 0.0) to a known syzygy or epoch, we calculate the Date.
 * 
 * For framework alignment purposes, let's theoretically anchor CCY 0.0 (The Epoch) 
 * at the start of the current cycle (approx 2000 AD for easy reference, or the 2017 eclipse).
 * Wait, the user previously anchored to the 2000 AD or 2017 eclipse as an anchor. 
 * We will define CCY 0.0 to align approximately with Jan 1, 2000 (J2000 epoch) for math simplicity.
 */
const J2000_TIMESTAMP = new Date('2000-01-01T12:00:00Z').getTime();

export const getDerivedGregorianDate = (state: CosmicTimeState): Date => {
    // If 1 Tick conceptually moves the system by 1 Earth Year (31557600 seconds)
    // we simply project the totalTicks outward from the J2000 anchor.
    const ONE_YEAR_MS = 31557600000;
    
    // Calculate the ms offset from the anchor
    const msOffset = state.totalTicks * ONE_YEAR_MS;
    return new Date(J2000_TIMESTAMP + msOffset);
};

/**
 * Utility to format CCY for the HUD
 */
export const formatCCY = (state: CosmicTimeState): string => {
    return `${state.totalCCY.toFixed(5)} CCY`;
};

export const formatPhase = (state: CosmicTimeState): string => {
    return `${state.phaseDegrees.toFixed(2)}°`;
};

/**
 * Returns the perfect geometric phase angles for the classical planets at CCY 0.00.
 * In the Grand Syzygy, all planets exist on the exact Phase Angles dictated by the 
 * 44 Solomon Seals resonating with the 23-tooth Meroitic linguistic gear drift.
 * This anchors the simulation start strictly to the framework's internal math.
 */
export const getGrandSyzygyAngles = (planetName: string): number => {
    // mathematical extraction of the geometric vectors ("PCA Angles") 
    // of the Meroitic glyphs assigned to the classical planets:
    const pcaAngles: Record<string, number> = {
        "Saturn": 3.62,      // Glyph T
        "Jupiter": 273.46,   // Glyph P (Square aspect to Saturn: ~90°)
        "Mercury": 37.29,    // Glyph N
        "Venus": 37.29,      // Glyph M (Conjunction with Mercury: 0°)
        "Mars": 0.0,         // Glyph M base
        "Earth": 0.0,        // Glyph M base / Vernal Equinox
        "Sun": 0.0,          // System Center / Baseline
        "Moon": 0.0,         // Baseline conjunction
        "Ceres": 0.0,
        "Universal": 0.0     // Master Sync
    };

    if (planetName in pcaAngles) {
        return pcaAngles[planetName] * (Math.PI / 180);
    }

    // For all other planets (Uranus, Neptune, Pluto, etc.), they are not random.
    // They lock into the 23 gears of the Antikythera Mechanism.
    // We deterministically map each non-classical body to one of the 23 irrational gears 
    // based on the string hash of its name.
    const charSum = planetName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const gearIndex = charSum % 23; 
    
    // Safety check: Fallback to mathematically generated shift if ROTOR_23_TEETH isn't available
    const tooth = ROTOR_23_TEETH[gearIndex];
    const gearPhaseDeg = tooth ? tooth.phaseShiftDegrees : 0;

    return gearPhaseDeg * (Math.PI / 180);
};
