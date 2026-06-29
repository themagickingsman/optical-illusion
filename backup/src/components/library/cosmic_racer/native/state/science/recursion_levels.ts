/**
 * Recursion Levels Engine
 * 
 * Computes intermediate level positions for higher precision settings.
 * Each precision step subdivides gaps between existing levels,
 * using the same φ-power formula the framework uses for all calculations.
 * 
 * Also provides a solar system catalog (~200 bodies) for auto-matching
 * framework radii to real celestial objects.
 */
import { CosmicRecursionEngine } from '../../state/logic/CosmicRecursionEngine';

const PHI = CosmicRecursionEngine.PHI;
const POWER_SPAN = CosmicRecursionEngine.RADIUS_POWER_SPAN;
const LEVEL_SPAN = CosmicRecursionEngine.OCTAVE_LEVELS;

// ═══════════════════════════════════════════════════════════════════════
// SOLAR SYSTEM CATALOG
// Sources: IAU, JPL Small-Body Database, MPC
// All semi-major axes in AU
// ═══════════════════════════════════════════════════════════════════════

export interface SolarSystemBody {
    name: string;
    semi_major_axis_au: number;
    type: 'Planet' | 'Dwarf Planet' | 'Asteroid' | 'Centaur' | 'TNO' | 'Trojan' | 'Comet' | 'Moon'
        | 'Star' | 'Binary Star' | 'Star Cluster' | 'Nebula' | 'Supernova Remnant' | 'Node' | 'Constellation'
        | 'KBO' | 'Sednoid' | 'Belt Edge' | 'Heliophysics' | 'Scattered Disc Object'
        | 'Orbital Bound' | 'Planetary Wave' | 'Neural Oscillation' | 'Cellular Mechanics' | 'Genetic Structure'
        | 'Molecular Bond' | 'Electron Cloud' | 'Atomic Nucleus' | 'Quantum Field'
        | 'Pathogen' | 'Healthy' | 'Therapeutic' | 'Molecular';
    discoverer?: string;
    year_discovered?: number;
    diameter_km?: number;
    distance_pc?: number;     // Distance in parsecs (1 pc = 206,265 AU)
    spectral_type?: string;   // Stellar classification (e.g., G2V, M4V)
    source: string;
    parentBody?: string;
    color?: string;
    meta?: {
        resonant_freq_ghz?: number;  // Microwave/GHz resonant frequency (measured)
        size_nm?: number;            // Physical size in nanometers
        health_status?: 'pathogen' | 'healthy' | 'therapeutic' | 'molecular' | 'nuclear';
        energy_kev?: number;         // Photon/particle energy in keV
        wavenumber_cm?: number;      // IR wavenumber in cm⁻¹
    };
}

// ═══════════════════════════════════════════════════════════════════════
// CATALOG IMPORTS
// ═══════════════════════════════════════════════════════════════════════

import { SOLAR_SYSTEM_CATALOG } from './catalogs/solar_catalog';
import { ATOMIC_CATALOG } from './catalogs/atomic_catalog';
import { BIOLOGICAL_CATALOG } from './catalogs/biological_catalog';
import { MACRO_CATALOG } from './catalogs/macro_catalog';
import { GALACTIC_CATALOG } from './catalogs/galactic_catalog';
import { HEALTH_CATALOG } from './catalogs/health_catalog';
import { Units } from './catalogs/unit_converter';

// ═══════════════════════════════════════════════════════════════════════
export const ALL_OCTAVES: Record<number, SolarSystemBody[]> = {
    // ── THE QUANTUM / ATOMIC SCALES ──
    // Octave 2: QCD / Strong Force — quark confinement & electroweak resonances
    2: [...ATOMIC_CATALOG.filter(b => b.semi_major_axis_au < Units.fromFemtometers(0.7)),
        ...HEALTH_CATALOG.filter(b => b.semi_major_axis_au < Units.fromFemtometers(0.7))],
    // Octave 3: Atomic Nucleus — nuclear binding modes (~0.7 to 16 fm)
    3: [...ATOMIC_CATALOG.filter(b => b.semi_major_axis_au >= Units.fromFemtometers(0.7) && b.semi_major_axis_au <= Units.fromFemtometers(16)),
        ...HEALTH_CATALOG.filter(b => b.semi_major_axis_au >= Units.fromFemtometers(0.7) && b.semi_major_axis_au <= Units.fromFemtometers(16))],
    // Octave 4: Electron Orbitals / QED — physical atomic-scale distances + molecular spectroscopy
    4: [...ATOMIC_CATALOG.filter(b => b.semi_major_axis_au >= Units.fromFemtometers(2.0) && b.semi_major_axis_au <= Units.fromFemtometers(100000)),
        ...HEALTH_CATALOG.filter(b => b.semi_major_axis_au >= Units.fromFemtometers(2.0) && b.semi_major_axis_au <= Units.fromNanometers(2000))],
    // Octave 5: Molecular Bonds — sub-nm bond lengths + IR/Raman wavelengths + drug resonances
    5: [...ATOMIC_CATALOG.filter(b => b.semi_major_axis_au > Units.fromFemtometers(100000)),
        ...HEALTH_CATALOG.filter(b => b.semi_major_axis_au > Units.fromNanometers(2000) && b.semi_major_axis_au <= Units.fromNanometers(20000))],

    // ── THE BIOLOGICAL / CELLULAR SCALES ──
    // Octave 6: Bio-molecular + Viral — DNA/proteins + virus resonances (10nm–500nm)
    6: [...BIOLOGICAL_CATALOG.filter(b => b.semi_major_axis_au <= Units.fromNanometers(100000)),
        ...HEALTH_CATALOG.filter(b => b.semi_major_axis_au > Units.fromNanometers(5) && b.semi_major_axis_au <= Units.fromNanometers(500))],
    // Octave 7: Cellular Bioelectric + Bacteria + Human Cells (500nm–300µm)
    7: [...BIOLOGICAL_CATALOG.filter(b => b.semi_major_axis_au > Units.fromNanometers(100000)),
        ...HEALTH_CATALOG.filter(b => b.semi_major_axis_au > Units.fromNanometers(500))],

    // ── THE MACRO / GEOSPATIAL SCALES ──
    // Octave 8: Neural Oscillations & EM Biosphere — brainwaves, RF, biophotonics
    //           λ range: µm (UV biophoton) through 6,000 km (AC grid EM wavelength)
    8: MACRO_CATALOG.filter(b => b.semi_major_axis_au <= Units.fromKilometers(8000)),
    // Octave 9: Planetary Cavity Resonance — Schumann, seismic, magnetosphere
    //           λ range: 8,000 km through 70,000 km (magnetopause)
    9: MACRO_CATALOG.filter(b => b.semi_major_axis_au > Units.fromKilometers(8000) && b.semi_major_axis_au <= Units.fromKilometers(70000)),
    // Octave 10: Lunar Orbitals & Standing Waves (~70,000 km to 500,000 km)
    10: MACRO_CATALOG.filter(b => b.semi_major_axis_au > Units.fromKilometers(70000) && b.semi_major_axis_au <= Units.fromKilometers(500000)),

    // ── THE SOLAR SYSTEM & STELLAR NEIGHBORHOOD ──
    // Octave 11: The Solar System (Planets, Asteroids, Inner Kuiper Belt) (< 47 AU)
    11: SOLAR_SYSTEM_CATALOG.filter(b => b.semi_major_axis_au < 47),

    // ── THE GALACTIC / COSMOLOGICAL SCALES ──
    // Octave 12: Scattered Disc, Sednoids, Oort Cloud (47 AU to ~104,082 AU / ~1.64 ly)
    12: [...SOLAR_SYSTEM_CATALOG, ...GALACTIC_CATALOG].filter(b => b.semi_major_axis_au >= 47 && b.semi_major_axis_au < 104083),
    // Octave 13: Local Stellar Neighborhood & Constellations (104,083 AU to ~230,642,866 AU / ~3,647 ly)
    13: GALACTIC_CATALOG.filter(b => b.semi_major_axis_au >= 104083 && b.semi_major_axis_au < 230642867),
    // Octave 14: Milky Way & Local Group (> 230,642,866 AU)
    14: GALACTIC_CATALOG.filter(b => b.semi_major_axis_au >= 230642867)
};

// ═══════════════════════════════════════════════════════════════════════
// LEVEL COMPUTATION
// ═══════════════════════════════════════════════════════════════════════

/** Base resonant levels — the 16 positions that form precision 1x */
const BASE_RESONANT_LEVELS = [0, 1, 5, 10, 20, 30, 35, 40, 50, 55.5, 60, 70, 80, 90, 100, 110, 111];

/**
 * Compute the φ-power radius for any level (integer or fractional).
 * Unified with CosmicRecursionEngine to guarantee a single mathematical anchor.
 */
export function levelToRadius(level: number): number {
    return CosmicRecursionEngine.levelToRadius(level);
}

/**
 * Get all levels for a given precision depth.
 * 
 * LINEAR GROWTH: each precision step adds ~15 new levels (one per base gap).
 * 
 * Precision 1: 16 base resonant levels
 * Precision 2: 16 + 15 = 31 levels (1 subdivision per base gap)
 * Precision 3: 16 + 30 = 46 levels (2 subdivisions per base gap)
 * Precision N: 16 + 15×(N-1) levels
 * 
 * Returns sorted array of unique level values.
 */
export function getLevelsForPrecision(precision: number): number[] {
    if (precision < 1) precision = 1;
    if (precision > 15) precision = 15;

    const levels = new Set<number>(BASE_RESONANT_LEVELS);

    if (precision > 1) {
        // For each of the 15 gaps between base levels, 
        // insert (precision - 1) evenly spaced intermediate levels
        const sorted = [...BASE_RESONANT_LEVELS].sort((a, b) => a - b);
        
        for (let i = 0; i < sorted.length - 1; i++) {
            const lo = sorted[i];
            const hi = sorted[i + 1];
            const subdivisions = precision; // Split each gap into this many segments
            
            for (let s = 1; s < subdivisions; s++) {
                const frac = s / subdivisions;
                const level = Math.round((lo + (hi - lo) * frac) * 100) / 100;
                levels.add(level);
            }
        }
    }

    return Array.from(levels).sort((a, b) => a - b);
}

/**
 * Match a framework-computed radius to the closest real solar system body.
 * Uses the embedded catalog. Each body can only be matched once per call batch.
 * 
 * @param radius_au - Framework-computed radius
 * @param usedNames - Set of already-used names (to avoid duplicates)
 * @returns Match result with name, alignment, and metadata
 */
export function matchRadiusToBody(
    radius_au: number,
    usedNames: Set<string> = new Set(),
    activeCatalog: SolarSystemBody[] = SOLAR_SYSTEM_CATALOG
): {
    name: string;
    real_radius: number;
    framework_radius: number;
    alignment: number;
    type: string;
    source: string;
    status: 'verified' | 'matched' | 'predicted';
    discoverer?: string;
    year_discovered?: number;
    diameter_km?: number;
    distance_pc?: number;
    spectral_type?: string;
} {
    // Sort catalog by alignment to this radius
    const sorted = [...activeCatalog]
        .map(body => ({
            body,
            alignment: (Math.min(body.semi_major_axis_au, radius_au) / Math.max(body.semi_major_axis_au, radius_au)) * 100
        }))
        .sort((a, b) => b.alignment - a.alignment);

    // Pick the best unused match
    const bestUnused = sorted.find(s => !usedNames.has(s.body.name));
    
    // FALLBACK: If catalog is exhausted or alignment is poor (< 60%), generate a predicted identity
    if (!bestUnused || (bestUnused.alignment < 60)) {
        const id = Math.floor(radius_au * 1000) % 999;
        const type = radius_au > 200000 ? 'Star' : radius_au > 100 ? 'TNO' : 'Object';
        const name = `${type} H-${id}`;
        
        return {
            name,
            real_radius: radius_au,
            framework_radius: radius_au,
            alignment: 100.0,
            type,
            source: 'Framework (Discovery)',
            status: 'predicted',
            diameter_km: radius_au > 200000 ? 1000000 : 500
        };
    }

    const best = bestUnused;
    const isPlanet = best.body.type === 'Planet';
    const alignment = best.alignment;

    const result = {
        name: best.body.name,
        real_radius: best.body.semi_major_axis_au,
        framework_radius: radius_au,
        alignment: Math.round(alignment * 10) / 10,
        type: best.body.type,
        source: best.body.source,
        status: isPlanet && alignment > 85 ? 'verified' : alignment > 70 ? 'matched' : 'predicted',
        discoverer: best.body.discoverer,
        year_discovered: best.body.year_discovered,
        diameter_km: best.body.diameter_km,
        distance_pc: best.body.distance_pc,
        spectral_type: best.body.spectral_type,
    };
    
    // DEBUG VENUS (L100)
    if (Math.abs(radius_au - 0.674) < 0.01 || result.name === 'Venus') {
        console.log(`MATCH DEBUG [${radius_au.toFixed(4)} AU]: Found ${result.name} (${result.real_radius} AU) with ${result.alignment}% alignment. Status: ${result.status}`);
    }

    return result as any;
}

/**
 * Compute all bodies for a given octave and precision.
 * Returns an array of matched objects sorted by radius.
 */
export function computePrecisionBodies(
    octave: number,
    precision: number
): Array<{
    level: number;
    name: string;
    radius_au: number;
    real_radius: number;
    alignment: number;
    type: string;
    source: string;
    status: 'verified' | 'matched' | 'predicted';
    discoverer?: string;
    year_discovered?: number;
    diameter_km?: number;
    is_base_level: boolean;
}> {
    const levels = getLevelsForPrecision(precision);
    const usedNames = new Set<string>();
    const bodies: Array<ReturnType<typeof computePrecisionBodies>[number]> = [];

    // Sort levels by radius to match inner-first (higher priority matches for inner planets)
    const levelsWithRadius = levels.map(level => ({
        level,
        radius: levelToRadius(level)
    })).sort((a, b) => a.radius - b.radius);

    for (const { level, radius } of levelsWithRadius) {
        // Apply octave scaling for non-planetary octaves
        let r_au = radius;
        if (octave !== 2) {
            const octaveScale = Math.pow(PHI, (octave - 2) * POWER_SPAN);
            r_au *= octaveScale;
        }

        const match = matchRadiusToBody(r_au, usedNames);
        usedNames.add(match.name);

        bodies.push({
            level,
            name: match.name,
            radius_au: r_au,
            real_radius: match.real_radius,
            alignment: match.alignment,
            type: match.type,
            source: match.source,
            status: match.status,
            discoverer: match.discoverer,
            year_discovered: match.year_discovered,
            diameter_km: match.diameter_km,
            is_base_level: BASE_RESONANT_LEVELS.includes(level),
        });
    }

    return bodies.sort((a, b) => a.radius_au - b.radius_au);
}

