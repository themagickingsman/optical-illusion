/**
 * Calculate which harmonic levels match real planets
 * Based on matching orbital radii using Kepler's 3rd Law
 */

import { SOLAR_SYSTEM_PLANETS } from '../data/solar_system_jpl';

// Real planet orbital frequencies (1/period in days)
const planetFrequencies = SOLAR_SYSTEM_PLANETS.map(p => ({
    name: p.name,
    freq_hz: 1 / (p.orbitalPeriod_days * 86400), // Convert days to seconds
    radius_au: p.semiMajorAxis_AU
}));

// Harmonic levels from cosmic_compass_data.json (approximate values)
const harmonicLevels = [
    { level: 0, name: 'Void / Singularity', freq_hz: 0.090 },
    { level: 70, name: 'Family/Community', freq_hz: 12.20 },
    { level: 80, name: 'Planetary', freq_hz: 7.83 },
    { level: 60, name: 'Self-Awareness', freq_hz: 7.54 },
    { level: 50, name: 'Tissue', freq_hz: 4.66 },
    { level: 40, name: 'RNA/DNA', freq_hz: 2.88 },
    { level: 30, name: 'Molecular', freq_hz: 1.78 },
    { level: 20, name: 'Atomic Orbitals', freq_hz: 1.10 },
    { level: 10, name: 'Atomic Nucleus', freq_hz: 0.68 },
    { level: 5, name: 'Quark-Gluon', freq_hz: 0.26 },
    { level: 1, name: 'Quantum Foam', freq_hz: 0.16 },
    { level: 90, name: 'Solar System', freq_hz: 19.74 },
    { level: 100, name: 'Galactic', freq_hz: 31.94 },
    { level: 110, name: 'Universal', freq_hz: 51.67 },
    { level: 111, name: 'Metaversal', freq_hz: 83.60 },
];

// Calculate Keplerian radius for each frequency
const GM = 1.0; // Normalized
function calculateRadius(freq: number): number {
    return Math.pow(GM / Math.pow(2 * Math.PI * freq, 2), 1/3);
}

console.log('\n=== PLANET TO HARMONIC LEVEL MAPPING ===\n');
console.log('Real Planets:');
planetFrequencies.forEach(p => {
    const r = calculateRadius(p.freq_hz);
    console.log(`${p.name.padEnd(10)} freq=${p.freq_hz.toExponential(4)} Hz  R=${p.radius_au.toFixed(3)} AU (real)  R=${r.toFixed(6)} (calculated)`);
});

console.log('\nHarmonic Levels:');
harmonicLevels.forEach(h => {
    const r = calculateRadius(h.freq_hz);
    console.log(`L${String(h.level).padStart(3)} ${h.name.padEnd(25)} freq=${h.freq_hz.toFixed(2)} Hz  R=${r.toFixed(6)}`);
});

console.log('\n=== CLOSEST MATCHES (by orbital radius) ===\n');
planetFrequencies.forEach(planet => {
    let closestLevel = harmonicLevels[0];
    let closestDiff = Infinity;
    
    const planetR = calculateRadius(planet.freq_hz);
    
    harmonicLevels.forEach(level => {
        const levelR = calculateRadius(level.freq_hz);
        const diff = Math.abs(Math.log10(planetR) - Math.log10(levelR)); // Log scale difference
        
        if (diff < closestDiff) {
            closestDiff = diff;
            closestLevel = level;
        }
    });
    
    const levelR = calculateRadius(closestLevel.freq_hz);
    console.log(`${planet.name.padEnd(10)} → Level ${String(closestLevel.level).padStart(3)} (${closestLevel.name}) - Rdiff=${(Math.abs(planetR - levelR) / planetR * 100).toFixed(1)}%`);
});

export const PLANET_TO_LEVEL_MAPPING: Record<string, number> = {
    'Void / Singularity': 0,
    // Will be filled in based on calculations above
};
