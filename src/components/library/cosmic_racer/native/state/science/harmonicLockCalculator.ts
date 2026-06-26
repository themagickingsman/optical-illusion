/**
 * Harmonic Lock Calculator
 * 
 * Calculates the precise speeds at which celestial bodies appear stationary
 * (stroboscopic effect) and detects global harmonic convergences.
 */

import { HarmonicBody, RenderableBody } from './HarmonicResonanceEngine';

// Display frame rate (assumed 60fps)
const FRAME_RATE = 60;
const FRAME_TIME = 1 / FRAME_RATE;

export interface HarmonicLockData {
    bodyId: string;
    bodyName: string;
    orbitalPeriodDays: number;
    orbitalFrequency: number; // Hz
    lockSpeeds: number[];     // Array of lock speeds for N=1,2,3...
    currentDrift: number;     // Current phase drift in degrees (0 = locked)
    isLocked: boolean;        // Within 5° of lock
    lockProximity: number;    // 0-1, how close to lock (1 = perfect lock)
}

export interface GlobalHarmonicData {
    resonanceScore: number;       // 0-100%, how many bodies are near-locked
    nearestConvergenceSpeed: number;
    lockedBodies: string[];       // Names of currently locked bodies
    driftingBodies: string[];     // Names of drifting bodies
}

/**
 * Calculate the harmonic lock speed for a given orbital period
 * 
 * Formula: lock_speed = (N × 2π) / (orbital_frequency × frame_time)
 * 
 * @param orbitalPeriodDays - Orbital period in days
 * @param harmonicN - Harmonic number (1, 2, 3...)
 * @param timeScale - Base time scale of the simulation
 * @returns Lock speed multiplier
 */
export function calculateHarmonicLockSpeed(
    orbitalPeriodDays: number,
    harmonicN: number,
    timeScale: number = 1
): number {
    const orbitalPeriodSeconds = orbitalPeriodDays * 86400;
    const orbitalFrequency = (2 * Math.PI) / orbitalPeriodSeconds;
    
    // Lock occurs when: speed × orbital_freq × frame_time = N × 2π
    // Solving for speed: speed = (N × 2π) / (orbital_freq × frame_time × timeScale)
    const lockSpeed = (harmonicN * 2 * Math.PI) / (orbitalFrequency * FRAME_TIME * timeScale);
    
    return lockSpeed;
}

/**
 * Calculate current phase drift for a body at a given speed
 * Returns drift in degrees (0-180, where 0 = perfect lock)
 */
export function calculatePhaseDrift(
    orbitalPeriodDays: number,
    currentSpeed: number,
    timeScale: number = 1
): number {
    const orbitalPeriodSeconds = orbitalPeriodDays * 86400;
    const orbitalFrequency = (2 * Math.PI) / orbitalPeriodSeconds;
    
    // Calculate how much phase changes per frame
    const phasePerFrame = currentSpeed * timeScale * orbitalFrequency * FRAME_TIME;
    
    // Find nearest integer multiple of 2π
    const nearestMultiple = Math.round(phasePerFrame / (2 * Math.PI));
    if (nearestMultiple === 0) {
        // Moving too slow to complete full cycles
        return phasePerFrame * (180 / Math.PI); // Convert to degrees
    }
    
    // Drift is the difference from perfect lock
    const perfectPhase = nearestMultiple * 2 * Math.PI;
    const drift = Math.abs(phasePerFrame - perfectPhase);
    
    // Convert to degrees (0-180)
    return Math.min(drift * (180 / Math.PI), 180);
}

/**
 * Generate harmonic lock data table for all bodies
 */
export function getHarmonicLockTable(
    bodies: (HarmonicBody | RenderableBody)[],
    currentSpeed: number,
    timeScale: number = 1,
    numHarmonics: number = 3
): HarmonicLockData[] {
    return bodies.map(body => {
        const periodSec = body.period_sec || ((body as any).period_sec) || 0; 
        const orbitalPeriodDays = body.orbital_period_days || (periodSec > 0 ? periodSec / 86400 : 0) || 1;
        const orbitalFrequency = (2 * Math.PI) / (orbitalPeriodDays * 86400);
        
        // Calculate lock speeds for N=1, 2, 3...
        const lockSpeeds = Array.from({ length: numHarmonics }, (_, i) => 
            calculateHarmonicLockSpeed(orbitalPeriodDays, i + 1, timeScale)
        );
        
        // Calculate current drift
        const currentDrift = calculatePhaseDrift(orbitalPeriodDays, currentSpeed, timeScale);
        
        // Consider locked if within 5 degrees
        const isLocked = currentDrift < 5;
        
        // Lock proximity (0 = far, 1 = perfect lock)
        const lockProximity = Math.max(0, 1 - (currentDrift / 180));
        
        return {
            bodyId: body.id,
            bodyName: body.name,
            orbitalPeriodDays,
            orbitalFrequency,
            lockSpeeds,
            currentDrift,
            isLocked,
            lockProximity
        };
    });
}

/**
 * Calculate global harmonic convergence
 * Analyzes how close the entire system is to a harmonic state
 */
export function calculateGlobalHarmonicConvergence(
    bodies: (HarmonicBody | RenderableBody)[],
    currentSpeed: number,
    timeScale: number = 1
): GlobalHarmonicData {
    const lockData = getHarmonicLockTable(bodies, currentSpeed, timeScale);
    
    // Calculate resonance score (% of bodies near lock)
    const lockedBodies = lockData.filter(d => d.isLocked).map(d => d.bodyName);
    const driftingBodies = lockData.filter(d => !d.isLocked).map(d => d.bodyName);
    
    // Weighted resonance score (average lock proximity)
    const resonanceScore = lockData.reduce((sum, d) => sum + d.lockProximity, 0) / lockData.length * 100;
    
    // Find nearest convergence speed by averaging lock speeds
    // This is an approximation - true convergence requires LCM
    const avgLockSpeed = lockData.reduce((sum, d) => sum + d.lockSpeeds[0], 0) / lockData.length;
    
    return {
        resonanceScore,
        nearestConvergenceSpeed: avgLockSpeed,
        lockedBodies,
        driftingBodies
    };
}

/**
 * Find the best speed to lock a specific body
 * Returns the nearest harmonic lock speed to the current speed
 */
export function findNearestLockSpeed(
    orbitalPeriodDays: number,
    currentSpeed: number,
    timeScale: number = 1,
    maxHarmonic: number = 10
): { speed: number; harmonic: number } {
    let nearestSpeed = 0;
    let nearestHarmonic = 1;
    let minDiff = Infinity;
    
    for (let n = 1; n <= maxHarmonic; n++) {
        const lockSpeed = calculateHarmonicLockSpeed(orbitalPeriodDays, n, timeScale);
        const diff = Math.abs(lockSpeed - currentSpeed);
        
        if (diff < minDiff) {
            minDiff = diff;
            nearestSpeed = lockSpeed;
            nearestHarmonic = n;
        }
    }
    
    return { speed: nearestSpeed, harmonic: nearestHarmonic };
}

/**
 * Format speed for display
 */
export function formatLockSpeed(speed: number): string {
    if (speed >= 1e9) return `${(speed / 1e9).toFixed(1)}B`;
    if (speed >= 1e6) return `${(speed / 1e6).toFixed(1)}M`;
    if (speed >= 1e3) return `${(speed / 1e3).toFixed(1)}K`;
    if (speed >= 1) return speed.toFixed(1);
    if (speed >= 0.01) return speed.toFixed(3);
    return speed.toExponential(2);
}
