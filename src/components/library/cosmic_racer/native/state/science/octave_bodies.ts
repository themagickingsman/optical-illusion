/**
 * Octave Bodies - Flat Array Generated from Cosmic Data
 * 
 * Simple structure like Control, but data comes from:
 * - cosmic_compass_data.json (framework levels)
 * - CosmicRecursionEngine (φ-power calculations)
 * - unified_taxonomy.ts (names)
 * - recursion_levels.ts (precision subdivision + solar system catalog)
 * 
 * Supports precision levels 1x–15x for recursive object discovery.
 */

import COSMIC_DATA from '../../config/cosmic_compass_data.json';
import { 
    getLevelsForPrecision, 
    levelToRadius, 
    matchRadiusToBody, 
    ALL_OCTAVES,
    SolarSystemBody
} from './recursion_levels';

// ... lines 24-633 ...
export const ALL_CATALOGS = Object.values(ALL_OCTAVES).flat();

function getCatalogForOctave(octave: number): SolarSystemBody[] {
    // The mathematical candidate-centric alignment engine naturally isolates 
    // relevant elements using log10 distance scoring. Supplying the full
    // unified continuous catalog prevents arbitrary octave boundary cut-offs.
    return ALL_CATALOGS;
}
import { CosmicRecursionEngine } from '../../state/logic/CosmicRecursionEngine';
import { PhysicsEngine } from '../../state/logic/PhysicsEngine';

const PHI = 1.61803398875;
// FIX: Use 9.1 for Intra-Octave Level Spacing (matches recursion_levels.ts and Taxonomy)
const POWER_SPAN = 9.1;
const LEVEL_SPAN = CosmicRecursionEngine.OCTAVE_LEVELS;
const EARTH_ANCHOR = 90;

export interface OctaveBody {
    level: number;
    name: string;
    radius_au: number;
    color: string;
    eccentricity: number;
    period_days: number;
    freq_hz: number;
    // Precision-related fields
    is_base_level?: boolean;      // true for the 16 resonant levels
    auto_discovered?: boolean;    // true for objects found via precision > 1
    real_radius?: number;         // Real object's semi-major axis (AU)
    alignment?: number;           // % match between framework and real
    object_type?: string;         // Planet, Asteroid, Centaur, TNO, etc.
    discovery_source?: string;    // IAU, JPL, MPC, Framework
    discoverer?: string;
    year_discovered?: number;
    diameter_km?: number;
    distance_pc?: number;         // Distance in parsecs
    spectral_type?: string;       // Stellar classification (e.g., G2V, M4V)
    spin_freq?: number;           // Self-rotation frequency (Hz)
    is_theoretical?: boolean;     // Visual flag: Render as empty dotted orbit
    parentBodyId?: string;        // ID or Name of parent body (for Moons)
    local_radius_au?: number;     // Radius relative to parent
    
    catalogName?: string;         // The original matched name from Catalog (e.g. "Ceres") if different
    
    // NEW: Deduplication Fields
    isHarmonicEcho?: boolean;     // True if this object matches a lower-precision anchor
    echoMatches?: number;         // Number of times this object was re-confirmed
    
    // NEW: Physical & Chemical Properties
    mass_kg?: number;             // Mass in kg
    density_gcm3?: number;        // Surface/Mean Density in g/cm³
    composition?: string;         // Chemical makeup
    electromagnetic_field_tesla?: number; // Estimated Magnetic Field Strength (Tesla)
    
    // NEW: Expanded Metrics
    geometry_type?: string;       // e.g. "Trine", "Square"
    zodiac_angle?: number;        // 0-360 degrees
    intensity?: number;           // 0.0 - 1.0 stability score

    discovery_subOctive?: number;      // 1 = Base, 2 = Precision 2, etc.
    status?: string;              // verified, matched, predicted
    initial_phase?: number;       // NEW: Deterministic Start Angle (Radians)

    // HARMONIC GEOMETRY (Added to Interface)
    inclination?: number;
    longitude_asc_node?: number;
    arg_perihelion?: number;
    mean_anomaly_epoch?: number;
    declination?: number;
    radius_delta?: number; // NEW: Deviation from Framework Prediction
}

const AU_IN_METERS = 1.495978707e11;

/**
 * Generate flat array of bodies for an octave from COSMIC_DATA
 * @param octave - Which octave (1, 2, or 3)
 * @param precisions - Set of recursion depths to active (1-15).
 */
// pure harmonic engine: no external physics data imported.
export function getOctaveBodies(octave: number, precisions: Set<number> | number = 1): { bodies: OctaveBody[], shadowCount: number } {
    // Normalize input to sorted array of unique precisions
    const precisionInput = typeof precisions === 'number' ? new Set([precisions]) : precisions;
    // Always ensure we have at least precision 1 (Base)
    if (precisionInput.size === 0) precisionInput.add(1);
    const precisionSubOctives = Array.from(precisionInput).sort((a,b) => a - b);

    // Enforce Octave Type
    const validOctave = typeof octave === 'string' ? parseInt(octave) : octave;

    // Get the COSMIC_DATA entries for base levels (precision 1)
    const cosmicDataMap = new Map<number, typeof COSMIC_DATA[0]>();
    COSMIC_DATA.forEach(d => {
        cosmicDataMap.set(parseInt(d.level), d);
    });
    
    // ---------------------------------------------------------
    // PHASE 0: GENERATE ALL CANDIDATE LEVELS (RECURSIVE SCANNER)
    // ---------------------------------------------------------
    // Flatten all requested precisions into a single set of unique levels
    const uniqueLevels = new Set<number>();
    const levelMetadata = new Map<number, { isBase: boolean, subOctive: number }>();

    for (const precision of precisionSubOctives) {
        // DYNAMIC SCANNER:
        const subOctives = getLevelsForPrecision(precision);
        
        subOctives.forEach((lvl: number) => {
            if (!uniqueLevels.has(lvl)) {
                uniqueLevels.add(lvl);
                // Check if it's a Major Level (Semantic Marker via math instead of hardcoded hooks)
                const baseLevels = [0, 1, 5, 10, 20, 30, 35, 40, 50, 55.5, 60, 70, 80, 90, 100, 110, 111];
                const isBase = baseLevels.includes(Math.round(lvl * 1000) / 1000);
                
                levelMetadata.set(lvl, { 
                    isBase: isBase, 
                    subOctive: isBase ? 1 : 15 
                });
            }
        });
    }

    // Convert to array of { level, radius }
    const candidates = Array.from(uniqueLevels).map(level => {
        const r_au = levelToRadius(level);
        return { level, radius: r_au };
    });

    // ---------------------------------------------------------
    // PHASE 1: CATALOG ALLOCATION (Pinning)
    // ---------------------------------------------------------
    // Iterate through the APPROPRIATE Catalog.
    const harmonicManifest = new Map<string, OctaveBody>();
    const takenLevels = new Set<number>();
    
    // SWITCH: Select Catalog based on Octave
    // Octave 0-1 = Quantum
    // Octave 2 = Subatomic Field
    // Octave 11 = Solar System
    // Octave 12+ = Galactic
    // user request: disable matching logic for now
    const activeCatalog = getCatalogForOctave(validOctave);

    // PREVENT GRID NODE LEAKAGE BY DEDUPLICATING OVERLAPPING CATALOGS
    // (e.g. Bennu exists in both SOLAR_SYSTEM and MINOR_PLANET catalogs)
    const uniqueCatalogBodies = new Map<string, SolarSystemBody>();
    activeCatalog.forEach(body => {
        if (!uniqueCatalogBodies.has(body.name)) {
            uniqueCatalogBodies.set(body.name, body);
        }
    });

    const usedNames = new Set<string>();

    candidates.forEach(cand => {
        if (takenLevels.has(cand.level)) return; 

        // USE THE CENTRALIZED ALIGNMENT ENGINE (Candidate-Centric)
        const matchedBody = matchRadiusToBody(cand.radius, usedNames, activeCatalog);

        // If it returns a matched body (not a Predicted Orbit fallback)
        if (matchedBody && matchedBody.name !== 'Predicted Orbit' && matchedBody.name !== 'Void Resonance' && !matchedBody.name.includes('Predicted')) {
            const lvl = cand.level;
            const rad = cand.radius;
            const meta = levelMetadata.get(lvl)!;

            const PHI_RADIANS = (Math.PI * 2) * (1 / PHI); 
            const goldenPhase = (Math.abs(lvl) * 2.399963) % (Math.PI * 2);

            const matchMock = {
                name: matchedBody.name,
                type: matchedBody.type,
                alignment: (matchedBody as any).alignment || 100,
                real_radius: matchedBody.framework_radius || rad, 
                source: matchedBody.source,
                discoverer: matchedBody.discoverer,
                year_discovered: matchedBody.year_discovered,
                diameter_km: (matchedBody as any).diameter_km,
                distance_pc: (matchedBody as any).distance_pc,
                spectral_type: (matchedBody as any).spectral_type,
                parentBodyId: (matchedBody as any).parentBody,
                status: matchedBody.status || 'verified',
                mass_kg: (matchedBody as any).mass_kg,
                density_gcm3: (matchedBody as any).density_gcm3,
                composition: (matchedBody as any).composition,
                
                initial_phase: goldenPhase,
                eccentricity: 0,
                inclination: 0,
                longitude_asc_node: 0,
                arg_perihelion: 0,
                mean_anomaly_epoch: 0
            };

            const newBody = createBodyObject(lvl, rad, meta.isBase, matchMock, cosmicDataMap, validOctave);
            
            if (Math.abs(lvl % 10) < 0.0001 && lvl >= 0 && lvl <= 111) {
                newBody.discovery_subOctive = 1;
            } else {
                newBody.discovery_subOctive = meta.subOctive;
            }
            
            newBody.isHarmonicEcho = false;
            harmonicManifest.set(matchedBody.name, newBody);
            takenLevels.add(lvl);
        }
    });

    // ---------------------------------------------------------
    // PHASE 2: FILL REMAINING LEVELS (THEORETICAL HARMONICS)
    // ---------------------------------------------------------
    const shadowCount = 0;

    candidates.forEach(cand => {
        if (!takenLevels.has(cand.level)) {
            // PURE HARMONIC MODE:
            // All Levels are REAL predictions of the Framework.
            
            // Get Metadata (isBase, subOctive, etc.)
            const meta = levelMetadata.get(cand.level) || { isBase: false, subOctive: 1 };
            
            // NEW: Unified Taxonomy Lookup
            // This ensures Consistent Classification across ALL Octaves (e.g. "Guardian Resonance" for Level 50)
            const taxEntry: any = ALL_OCTAVES[validOctave]?.find(b => "level" in b && String(b.level) === String(cand.level));
            
            let name = taxEntry ? taxEntry.name : `Harmonic Resonance ${cand.level}`;
            let type = taxEntry?.type || 'Resonance'; // Uses 'Resonance' or 'Node' from Taxonomy if available
            const matchDetail = taxEntry?.match_detail;

            let color = '#a3a3a3'; // Metallic Grey
            const isOrbiter = !meta.isBase;

            if (taxEntry) {
                // If it's a known resonance type, color code it
                if (type === 'Resonance') color = '#60a5fa'; // Blue
                if (type === 'Node') color = '#737373';      // Grey
            } else {
                // Fallback Logic
                 if (meta.isBase) {
                    name = `Major Resonance ${cand.level}`;
                    type = 'Resonance'; 
                    color = '#60a5fa'; 
                } else {
                    name = `Harmonic Node ${cand.level}`;
                    type = 'Node';
                    color = '#737373'; 
                }
            }

            // Create Harmonic Object ( Treated as REAL )
            const harmonicMock = {
                name: name,
                type: type,
                alignment: isOrbiter ? 50 : 100, // Planets get high confidence, Belts lower
                real_radius: cand.radius, // "Real" in the sense of "Predicted Real"
                source: 'Harmonic Resonance',
                discoverer: 'Cosmic Compass',
                year_discovered: 2026,
                diameter_km: isOrbiter ? 0 : 5000, // Give planets some heft
                distance_pc: 0,
                spectral_type: undefined,
                parentBodyId: undefined,
                status: 'predicted' // Still 'predicted' status, but logic treats as real
            };

            const newBody = createBodyObject(cand.level, cand.radius, meta.isBase, harmonicMock, cosmicDataMap, validOctave);
            newBody.discovery_subOctive = meta.subOctive;
            newBody.isHarmonicEcho = false;
            newBody.is_theoretical = false; // CRITICAL: NO LONGER THEORETICAL
            newBody.color = color;

            harmonicManifest.set(cand.level.toString(), newBody);

            // FIXED: Removed Recursive Moon Injection (Fractal Moons) per user request for "Real Objects Only".
            // Previous logic generated 3 fake moons for every resonance node, causing object count inflation (314 vs 254).
        }
    });

    injectMoons(harmonicManifest, validOctave);


    // Final Sort
    const bodies = Array.from(harmonicManifest.values())
        .filter(b => b.radius_au > 0)
        .sort((a, b) => a.radius_au - b.radius_au)
        .slice(0, 255); // STRICT CAP: 255 Objects Max

    return { bodies, shadowCount };
} 

/**
 * MOON INJECTION HELPER (Called before return)
 * We need to inject this logic.
 */
function injectMoons(manifest: Map<string, OctaveBody>, octave: number) {
    // In other octaves, "Moons" might be Electrons, minor cell structures, or Lagrange debris.
    // Anything with a 'parentBody' tag acts as a sub-orbital structural node.
    const realMoons = (ALL_OCTAVES[octave] || []).filter(b => b.parentBody);

    realMoons.forEach((moon: SolarSystemBody) => {
        // Only inject moons for parents that actually exist in the compiled manifest
        const parentKey = moon.parentBody;
        if (!parentKey) return;
        
        const parent = manifest.get(parentKey);
        
        if (parent) {
            const moonLevel = parent.level + 0.01;
            const latticeRatios = CosmicRecursionEngine.getLatticeRatios(octave);
            const moonTier = (parent.discovery_subOctive || 1) + 2; 
            const PhaseRadius = parent.radius_au / latticeRatios.radius;

            const moonPhysics = PhysicsEngine.calculateHarmonicProperties(PhaseRadius, moonLevel, moonTier);
            const finalMass = moonPhysics.mass_kg * Math.pow(latticeRatios.radius, 3);
            const finalEM = moonPhysics.electromagnetic_field_tesla * Math.pow(latticeRatios.radius, -2);
            
            const newMoon: OctaveBody = {
                level: moonLevel,
                name: moon.name,
                radius_au: parent.radius_au, 
                local_radius_au: moon.semi_major_axis_au, // The moon's actual orbit radius around parent
                color: moon.color || '#94a3b8',
                eccentricity: 0.05, 
                period_days: 27.3, // Approximate lunar cycle basis
                freq_hz: (parent.freq_hz || 1) * 10,
                is_base_level: false,
                auto_discovered: true,
                is_theoretical: false, // It's a verified sub-orbital
                object_type: moon.type || 'Moon',
                parentBodyId: parent.name,
                status: 'predicted', // Ensure it matches predictive framework status
                discovery_subOctive: parent.discovery_subOctive || 5, 
                initial_phase: 0,
                diameter_km: moon.diameter_km || 1000,
                mass_kg: finalMass,
                density_gcm3: moonPhysics.density_gcm3,
                composition: moonPhysics.composition,
                electromagnetic_field_tesla: finalEM
            };
            
            manifest.set(`moon_${newMoon.parentBodyId}_${moon.name}`, newMoon);
        }
    });
}

/** Helper to create Body Object */
function createBodyObject(level: number, r_au: number, isBase: boolean, match: any, cosmicDataMap: Map<number, any>, octave: number): OctaveBody {
    let name = match.name;
    // User Request: Prioritize Meta-Data Color if available
    let color = match.color || getAutoDiscoveryColor(match.type); 
    const catalogName = match.name; // Keep valid ref to original name before any overrides

    // 1. Level Color (HIGHEST PRIORITY - User Request)
    let lookupLevel = level;
    if (!cosmicDataMap.has(lookupLevel)) {
        lookupLevel = Math.round(level / 10) * 10;
        if (lookupLevel === 0) {
             if (level >= 5) lookupLevel = 5;
             else if (level >= 1) lookupLevel = 1;
        } else if (lookupLevel > 110) {
             lookupLevel = 111;
        }
    }
    
    // Look up the accurate framework subOctive color
    const cosmicEntry = cosmicDataMap.get(lookupLevel);
    
    if (cosmicEntry?.hex) {
        color = cosmicEntry.hex;
    } else if (match.color) {
        // 2. Metadata Color (Secondary)
        color = match.color;
    }
    // 3. Compass/District Hex (Metadata from Recursion Engine)
    else if (match.compass_hex) {
        color = match.compass_hex;
    }
    // 4. Auto-Discovery Color (Fallback) is already set in init

    let isTheoretical = match.is_theoretical;
    let autoDiscovered = !isBase;
    
    // Taxonomy Override for Base Levels
    if (isBase && match.alignment < 85) {
            const taxEntry: any = ALL_OCTAVES[octave]?.find(b => "level" in b && String(b.level) === String(level));
            const taxonomyName = taxEntry ? taxEntry.name : undefined;
            if (taxonomyName && !taxonomyName.startsWith('New Object')) {
                name = taxonomyName;
                color = cosmicEntry?.hex || '#94a3b8';
                autoDiscovered = false;
                match.alignment = undefined; // Pure framework
                isTheoretical = false;
            }
    }

    // Calculate Physics
    const SECONDS_PER_YEAR = CosmicRecursionEngine.SECONDS_PER_YEAR;
    const period_years = Math.pow(r_au, 1.5);
    const period_days = period_years * (SECONDS_PER_YEAR / 86400);
    const f_eff = 1 / (period_years * SECONDS_PER_YEAR);
    const spin_freq = f_eff * Math.pow(PHI, 12.2);
    
    // DETERMINISTIC PHASE (Harmonic)
    // If mock provides it (Phase 1), use it. Otherwise calculate it (Phase 2).
    let initial_phase = match.initial_phase;
    
    if (initial_phase === undefined) {
         // PURE HARMONIC LOGIC: Golden Angle (137.5077 degrees)
         // Instead of random name hashes, distribute theoretically pure nodes 
         // using natural phyllotaxis (Fermat's spiral). This guarantees that
         // fractal geometry (like hexagons and pentagons) naturally emerges.
         const GOLDEN_ANGLE_RAD = 2.39996322972865332;
         initial_phase = (Math.abs(level) * GOLDEN_ANGLE_RAD) % (2 * Math.PI);
    }

    // REMOVED JPL LOOKUP - Pure Framework Logic
    // We strictly use the geometry provided in the match object or defaults.
    const inclination = match.inclination || 0;
    const longAsc = match.longitude_asc_node || 0;
    const argPeri = match.arg_perihelion || 0;
    const meanAnomalyEpoch = match.mean_anomaly_epoch || 0;

    // ── PHYSICS ENGINE INTEGRATION ──
    // If verifiable data exists (from Catalog), use it.
    // Otherwise, generate estimates via PhysicsEngine.
    let mass_kg = match.mass_kg;
    let density_gcm3 = match.density_gcm3;
    let composition = match.composition;
    let em_field = match.electromagnetic_field_tesla;
    let diameter_km = match.diameter_km;

    // Use a heuristic subOctive based on discovery/precision level
    // We don't have 'body' here, so we used passed matches or inference
    // In original code 'body' was undefined here. We should use 'match' or passed params.
    // 'match' has data, 'level' is passed.
    const subOctive = isBase ? 1 : 2;

    if (!mass_kg || !density_gcm3) {
        // Calculate/Estimate missing properties
        // We need a 'Type' for the engine. If theoretical, guess based on radius/level.
        const typeForPhysics = match.type || (r_au > 100 ? 'TNO' : r_au > 2 ? 'Asteroid' : 'Planet');
        
        const physics = PhysicsEngine.calculatePhysicalProperties(r_au, typeForPhysics, subOctive);
        
        if (!mass_kg) mass_kg = physics.mass_kg;
        if (!density_gcm3) density_gcm3 = physics.density_gcm3;
        if (!composition) composition = physics.composition;
        if (em_field === undefined) em_field = physics.electromagnetic_field_tesla;
        if (!diameter_km) diameter_km = physics.diameter_km;
    }
    
    // For Earth, we previously forced L90. In Harmonic Mode, should it also follow the rule?
    // "Initial Position... set this to the frameworks start position"
    // So even Earth should be at its Harmonic Start, not Current Real Position.
    
    // CALCULATE PHYSICS FROM RADIUS
    // P = R^1.5 (Kepler's 3rd Law)
    // STRICT FRAMEWORK COMPLIANCE: Use Framework Radius (radius_au)
    // External Data (real_radius) is for Identification & Alignment ONLY.

    // HARMONIC PHYSICS GENERATION
    // Purely algorithmic, based on position and scale.
    // const physics = PhysicsEngine.calculateHarmonicProperties(r, body.level, body.discovery_tier || 1); // This line is no longer needed.

    return {
        level,
        name,
        radius_au: r_au,
        color,
        eccentricity: match.eccentricity !== undefined ? match.eccentricity : 0.0, // Default perfect circle
        period_days,
        freq_hz: f_eff,
        spin_freq,
        is_base_level: isBase,
        auto_discovered: autoDiscovered,
        real_radius: match.real_radius,
        alignment: match.alignment,
        object_type: match.type,
        discovery_source: match.source,
        discoverer: match.discoverer,
        year_discovered: match.year_discovered,
        diameter_km,
        distance_pc: match.distance_pc ?? (r_au > 1000 ? r_au / 206265 : undefined),
        spectral_type: match.spectral_type,
        is_theoretical: isTheoretical,
        parentBodyId: match.parentBodyId,
        local_radius_au: match.local_radius_au,
        catalogName, // Save the original catalog name
        status: match.status,
        initial_phase,
        
        // VISUAL GEOMETRY (Harmonic)
        inclination,
        longitude_asc_node: longAsc,
        arg_perihelion: argPeri,
        mean_anomaly_epoch: meanAnomalyEpoch,
        
        // Match Accuracy
        radius_delta: match.radius_delta,
        
        // Physics Data
        mass_kg,
        density_gcm3,
        composition,
        electromagnetic_field_tesla: em_field,
        
        // Fix for missing property from Linter
        discovery_subOctive: subOctive
    };
}

/** Color palette for auto-discovered objects based on type */
function getAutoDiscoveryColor(type: string): string {
    switch (type) {
        case 'Planet': return '#60a5fa';        // Blue
        case 'Dwarf Planet': return '#c084fc';  // Purple
        case 'Asteroid': return '#94a3b8';      // Slate gray
        case 'Centaur': return '#06b6d4';       // Cyan
        case 'TNO': return '#818cf8';           // Indigo
        case 'Trojan': return '#f59e0b';        // Amber
        case 'Comet': return '#10b981';         // Emerald
        case 'Moon': return '#94a3b8';          // Slate
        case 'Quantum Entity': return '#2dd4bf'; // Teal / Aqua (Quantum)
        
        // Biology / Micro
        case 'Cell': return '#4ade80';          // Green
        case 'Bacteria': return '#bef264';      // Lime
        case 'Virus': return '#f472b6';         // Pink
        case 'Organism': return '#fb923c';      // Orange
        
        // Physics / Atomic
        case 'Atom': return '#22d3ee';          // Cyan
        case 'Nucleus': return '#818cf8';       // Indigo
        case 'Particle': return '#f472b6';      // Pink
        case 'Boson': return '#f43f5e';         // Rose
        
        // Macro / Structure
        case 'Structure': return '#9ca3af';     // Gray
        case 'Landmark': return '#d1d5db';      // Light Gray
        case 'Station': return '#38bdf8';       // Sky Blue (ISS)
        
        // Deep space types (Octaves 4-6)
        case 'Star': return '#fcd34d';          // Warm yellow (stellar)
        case 'Binary Star': return '#fbbf24';   // Gold (binary system)
        case 'Star Cluster': return '#22d3ee';  // Cyan (cluster)
        case 'Nebula': return '#fb7185';        // Rose (nebula)
        case 'Supernova Remnant': return '#fb923c'; // Orange (remnant)
        default: return '#94a3b8';              // Default gray
    }
}
