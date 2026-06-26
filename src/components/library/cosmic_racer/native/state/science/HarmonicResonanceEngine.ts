
import COSMIC_DATA from '../../config/cosmic_compass_data.json';
import { calculate3DPosition, deg2rad, SOLAR_SYSTEM_PLANETS, getEclipticLongitude } from '../data/solar_system_jpl';
import { getOctaveBodies, OctaveBody } from './octave_bodies';
import { CosmicRecursionEngine } from '../../state/logic/CosmicRecursionEngine';
import { PhysicsEngine } from '../logic/PhysicsEngine';
import { getGrandSyzygyAngles } from './CosmicEpochSolver';

export interface SolarSystemState {
    bodies: {
        name: string;
        x: number;
        y: number;
        z: number;
        color: string;
        id: string;
        radius_km: number;
    }[];
    orbits: Map<string, string>;
    orbitPoints?: Map<string, {x: number, y: number}[]>;
}

export interface RenderableBody {
    id: string;
    // Additional UI properties
    type?: string;
    mass_kg?: number;
    density_gcm3?: number;
    composition?: string;
    electromagnetic_field_tesla?: number;
    radius_km?: number;
    period_days?: number; // Added for compatibility with OctaveBody
    // Standard properties
    name: string;
    // VISUAL DATA (The Slide)
    // Normalized so that the Primary Anchor (Earth, Level 90) is always ~1.0
    normalized_radius_au: number; 
    sim_frequency?: number; // Pre-dilated frequency for stable rendering
    theoretical_radius_au?: number; // ADDED: Pure Framework Radius before Physics Parity 
    visual_radius: number; // Size of the dot
    color: string;
    
    // PHYSICAL DATA (The Context)
    // The true physical values for the HUD
    meta: {
        true_radius_au: number;
        period_s: number;
        period_txt: string;
        radius_txt: string;
        type: string;
        freq_hz: number;
        constellation?: string;
    };
    
    // ORBITAL DATA (Normalized)
    normalized_period: number; 
    eccentricity: number;
    initial_phase: number;
    spin_freq: number;
    precession_rate: number;
    
    // 3D ORBITAL DATA (Optional)
    inclination?: number;
    longitude_asc_node?: number;
    arg_perihelion?: number;
    mean_anomaly_epoch?: number;
    orbital_period_days?: number;

    // NEW DEBUG METRICS
    geometry_type?: string;       // e.g. "Trine", "Square"
    // initial_phase is already defined above at line 50
    orbital_freq: number;         // Hz (1/Period)
    harmonic_phase?: number;      // N-Index (PHI Power from Quantum Base)
    
    // UI METADATA
    level?: number;           // NEW: Precise Float Level (Debugging)
    level_ref?: number;
    object_type?: string;
    base_freq?: number;
    distance_pc?: number;
    spectral_type?: string;
    period_sec?: number; // Legacy compatibility
    
    auto_discovered?: boolean;
    parentBodyId?: string;    // NEW: Parent Body ID (for Moons)
    alignment?: number;       // NEW: % Match to Real World
    local_radius_au?: number; // NEW: Local Radius for moons
    discovery_subOctive?: number;  // NEW: Recursive Sub-Octive (1-15)
    subOctive?: number;            // Unified Sub-Octive (1-15)
    real_radius?: number;     // NEW: True Physical Radius for Visual Correction
    
    // Deduplication
    isHarmonicEcho?: boolean;
    echoMatches?: number;

    // MISSING PROPERTIES (Exposed by Generator)
    radius_txt?: string;
    radius_au?: number;
    freq_hz?: number;
    status?: string;
    discovery_source?: string;
    discoverer?: string;
    is_theoretical?: boolean;
}

export interface HarmonicBody {
    id: string;
    name: string;
    level?: number; // NEW: Precise Float Level
    level_ref: number;
    radius_au: number;
    theoretical_radius_au?: number; // Fixed type to number
    real_radius?: number; // New: True physical radius
    period_sec: number;
    is_theoretical?: boolean;
    eccentricity: number;
    color: string;
    geometry: string;
    freq_hz: number; // Replaced base_freq with freq_hz
    orbital_freq: number;
    precession_rate: number;
    drag_factor: number;
    body_radius: number;
    consciousness: string;
    core_desire: string;
    archetype: string;
    inclination?: number;
    longitude_asc_node?: number;
    arg_perihelion?: number;
    mean_anomaly_epoch?: number;
    orbital_period_days?: number;
    recursion_level?: number;
    parentBodyId?: string;    // NEW: Parent Body ID (for Moons)
    alignment?: number;       // NEW: % Match to Real World
    local_radius_au?: number; // NEW: Local Radius for moons
    discovery_subOctive?: number;  // NEW: Recursive Sub-Octive (1-15)
    perturbation: {
        type: 'sine' | 'bessel' | 'cosine_offset' | 'decay' | 'stochastic' | 'discrete';
        strength: number;
    };
    auto_discovered?: boolean;
    object_type?: string;
    distance_pc?: number;
    spectral_type?: string;
    spin_freq: number;
    
    // Deduplication
    isHarmonicEcho?: boolean;
    echoMatches?: number;

    // Status & Source
    status?: string;
    discovery_source?: string;
    discoverer?: string;

    // NEW DEBUG METRICS
    geometry_type?: string;
    zodiac_angle?: number;
    intensity?: number;
    // freq_hz is defined above
    harmonic_phase?: number;
    initial_phase?: number;
    mass_kg?: number;
    density_gcm3?: number;
    composition?: string;
    electromagnetic_field_tesla?: number;
}

/**
 * Pure Data Snapshot for Octave 2 Renderer.
 * CONTAINS NO PHYSICS LOGIC. JUST VISUALS.
 */

export class HarmonicResonanceEngine {
    private phi: number = 1.618033988749895;



    public getSolarSystemStaticOrbits(simDate: Date, center: number, scaleFactor: number): { paths: Map<string, string>, points: Map<string, {x: number, y: number}[]> } {
        const paths = new Map<string, string>();
        const rawPoints = new Map<string, {x: number, y: number}[]>();
        
        const safeScaleFactor = (scaleFactor && !isNaN(scaleFactor) && scaleFactor > 0) ? scaleFactor : 290;
        
        // Use real JPL elements for orbits
        SOLAR_SYSTEM_PLANETS.forEach(planet => {
             const points: string[] = [];
             
             // Resolution: Higher for outer planets to look smooth
             const segments = 120;
             const a = planet.semiMajorAxis_AU;
             const e = planet.eccentricity;
             const Omega = deg2rad(planet.longitudeAscNode_deg);
             const omega = deg2rad(planet.argPerihelion_deg);
             const i_angle = deg2rad(planet.inclination_deg);

             for (let k = 0; k <= segments; k++) {
                 const E = (k / segments) * 2 * Math.PI;
                 
                 // True anomaly
                 const nu = 2 * Math.atan2(
                     Math.sqrt(1 + e) * Math.sin(E / 2),
                     Math.sqrt(1 - e) * Math.cos(E / 2)
                 );
                 
                 // Heliocentric distance
                 const r = a * (1 - e * Math.cos(E));
                 
                 // Orbital plane coordinates
                 const x_orb = r * Math.cos(nu);
                 const y_orb = r * Math.sin(nu);
                 
                 // Rotate to ecliptic
                 const x_proj = (Math.cos(Omega) * Math.cos(omega) - Math.sin(Omega) * Math.sin(omega) * Math.cos(i_angle)) * x_orb
                              + (-Math.cos(Omega) * Math.sin(omega) - Math.sin(Omega) * Math.cos(omega) * Math.cos(i_angle)) * y_orb;
                 
                 const y_proj = (Math.sin(Omega) * Math.cos(omega) + Math.cos(Omega) * Math.sin(omega) * Math.cos(i_angle)) * x_orb
                              + (-Math.sin(Omega) * Math.sin(omega) + Math.cos(Omega) * Math.cos(omega) * Math.cos(i_angle)) * y_orb;

                 const finalX = center + x_proj * safeScaleFactor;
                 const finalY = center - y_proj * safeScaleFactor; // Prograde Y-Invert
                 
                 points.push(`${finalX},${finalY}`);
                 
                 if (!rawPoints.has(planet.name)) rawPoints.set(planet.name, []);
                 rawPoints.get(planet.name)!.push({ x: finalX, y: finalY });
             }
             
             if (points.length > 0) {
                 paths.set(planet.name, `M ${points.join(" L ")}`);
             }
        });

        return { paths, points: rawPoints };
    }

    /**
     * Get HARMONIC orbit paths (SVG d strings) for Framework Bodies.
     * Supports seeded J2000 positions if available (for Earth/Planets),
     * otherwise draws standard ellipses based on radius/eccentricity.
     */
    public getHarmonicOrbits(bodies: RenderableBody[], center: number, scaleFactor: number, simDate: Date): { paths: Map<string, string>, points: Map<string, {x: number, y: number}[]> } {
        const paths = new Map<string, string>();
        const rawPoints = new Map<string, {x: number, y: number}[]>();
        const safeScaleFactor = (scaleFactor && !isNaN(scaleFactor) && scaleFactor > 0) ? scaleFactor : 290;
        
        bodies.forEach(body => {
            const segments = 120;
            // Use TRUE AU properties for visual parity with Control tab
            const r = (body.meta?.true_radius_au || body.normalized_radius_au) * safeScaleFactor;
            
            // HARMONIC ORBITS are Ideals (Perfect Circles or Harmonic Ellipses)
            // We do NOT use JPL elements here.
            
            const points: string[] = [];
            
            // Simple Circle Logic
            // M cx,cy m -r,0 a r,r 0 1,0 2r,0 a r,r 0 1,0 -2r,0
            // Or explicit points for "points" map
            
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * 2 * Math.PI;
                // Add initial phase if we want the "start" of the drawn orbit to match something? 
                // A circle is a circle. But if we draw an ellipse, orientation matters.
                // For now, Pure Circle for Harmonic Model.
                
                const px = center + r * Math.cos(angle);
                const py = center + r * Math.sin(angle);
                
                points.push(`${px},${py}`);
                
                 if (!rawPoints.has(body.name)) rawPoints.set(body.name, []);
                 rawPoints.get(body.name)!.push({ x: px, y: py });
            }
            
             if (points.length > 0) {
                 paths.set(body.name, `M ${points.join(" L ")}`);
             }
        });
        
        return { paths, points: rawPoints };
    }

    /**
     * Get DYNAMIC Planet Positions for current frame.
     * Call this every frame.
     */
    public getSolarSystemDynamicPositions(simDate: Date, center: number, scaleFactor: number): any[] {
        const safeSimDate = (simDate instanceof Date && !isNaN(simDate.getTime())) ? simDate : new Date('2000-01-01T12:00:00Z');
        const safeScaleFactor = (scaleFactor && !isNaN(scaleFactor) && scaleFactor > 0) ? scaleFactor : 290;

        const sysBodies = SOLAR_SYSTEM_PLANETS.map(planet => {
            // Get accurate 3D position based on NASA dates
            const pos3D = calculate3DPosition(planet, safeSimDate);

            // Scale
            const rLocalX = pos3D.x * safeScaleFactor;
            // The solar_system_jpl uses positive Y as up. The SVG puts positive Y as down. So we invert Y for prograde.
            const rLocalY = -pos3D.y * safeScaleFactor;

            let x = center + rLocalX;
            let y = center + rLocalY;
            
            if (isNaN(x) || isNaN(y)) {
                x = center;
                y = center;
            }

            const eclipticAngle = getEclipticLongitude(pos3D.x, pos3D.y);

            return {
                id: planet.name,
                name: planet.name,
                x,
                y,
                z: 0,
                color: planet.color,
                radius_km: planet.radius_km,
                visual_radius: 1.5 + (Math.log10(planet.radius_km || 1000) * 1.2),
                zodiac_angle: eclipticAngle,
                geometry_type: HarmonicResonanceEngine.prototype.getGeometryType ? HarmonicResonanceEngine.prototype.getGeometryType(eclipticAngle) : "Conjunction",
                freq_hz: 1 / (planet.orbitalPeriod_days * 86400),
                originalData: planet, // Important: pass the original NASA object for downstream AU
                rawPlanetCache: { ...planet, semiMajorAxis_AU: planet.semiMajorAxis_AU, orbitalPeriod_days: planet.orbitalPeriod_days }
            };
        });

        // console.log(`[STRESS] Returning ${sysBodies.length} bodies`);
        return [...sysBodies];
    }

    /**
     * Get DYNAMIC Harmonic Positions (Octave 2 / Framework).
     * Centralizes the physics calculation in the Engine.
     */
    public getHarmonicSystemDynamicPositions(
        simDate: Date, 
        center: number, 
        scaleFactor: number, 
        harmonicBodies: RenderableBody[]
    ): any[] {
        const safeScaleFactor = (scaleFactor && !isNaN(scaleFactor) && scaleFactor > 0) ? scaleFactor : 290;
        
        // 3. Calculate Simulation Time (simDate - J2000) for Physics
        const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
        const currentSim = simDate.getTime();
        const secondsSinceJ2000 = (currentSim - J2000) / 1000;
        const daysSinceJ2000 = secondsSinceJ2000 / 86400;

        // SEPARATE PRIMARIES AND MOONS
        // We must calculate primaries FIRST so moons have a parent position to orbit
        const primaries = harmonicBodies.filter(b => !b.parentBodyId);
        const moons = harmonicBodies.filter(b => b.parentBodyId);

        // MAP: ID -> Position (x, y, z)
        const positions = new Map<string, { x: number, y: number, z: number }>();

        // 1. CALCULATE PRIMARIES (Heliocentric)
        // 1. CALCULATE HARMONIC POSITIONS (Pure Framework)
        const computedPrimaries = primaries.map(b => {
            let x = 0, y = 0, z = 0;
            
            // PURE HARMONIC CALCULATION
            // We ignore JPL orbital elements (eccentricity, mean anomaly) for positioning.
            // We use:
            // - Normalized Radius (Harmonic Grid)
            // - Harmonic Frequency (1/Period)
            // - Deterministic Phase (Golden Angle)
            
            const r = (b.meta?.true_radius_au || b.normalized_radius_au) * safeScaleFactor;
            
            // Calculate Current Angle:
            // Theta = InitialPhase + (Time * Frequency * 2PI)
            // Time is in seconds since J2000 (or any epoch, as long as consistent)
            const theta = (b.initial_phase || 0) + (secondsSinceJ2000 * b.orbital_freq * 2 * Math.PI);
            
            // 2D Harmonic Plane (Flat)
            // If we want 3D Harmonic structure later, we apply inclination here based on Phi.
            // For now, consistent with user request: "Orbital Geometry... change this to cosmic compass math"
            // We assuming a flat reference plane for the "Perfect" model, or simple inclination.
            
            x = center + r * Math.cos(theta);
            y = center - r * Math.sin(theta); // Inverse Y-axis for Prograde (Counter-Clockwise)
            z = 0;
            
            // OPTIONAL: Simple Harmonic Eccentricity (if strict circle is too boring)
            // if (b.eccentricity) { ... apply Kepler equation with harmonic e ... }
            // But strict circular harmonic is likely the "Perfect" baseline.

            // Store for children
            // Map by Name AND ID just in case
            if (b.name) positions.set(b.name, { x, y, z });
            if (b.id) positions.set(b.id, { x, y, z });

            return {
                ...b,
                x, y, z
            };
        });

        // 2. CALCULATE MOONS (Geocentric / Local)
        const computedMoons = moons.map(b => {
             // Find Parent Position
             // Parent ID from OctaveBody is just the Name (e.g. "Earth") in current impl
             const parentPos = positions.get(b.parentBodyId || "") || positions.get("Earth"); // Fallback? No, if no parent found, maybe orbit sun?
             
             let x = 0, y = 0, z = 0;
             
             if (parentPos) {
                 // LOCAL ORBIT
                 // Use local_radius_au if available, otherwise we have a problem because radius_au was heliocentric
                 // But wait, in OctaveBody generation, we populated local_radius_au with the Moon's semi-major axis (e.g. 0.00257 AU)
                 // And passed it to RenderableBody.
                 
                 const effectiveRadiusAU = b.local_radius_au || (b.meta?.true_radius_au || 0); // Logic gap: true_radius_au was heliocentric.
                 // If local_radius_au is missing, this will result in a huge orbit around the planet. 
                 // However, we just added local_radius_au throughout the chain.
                 
                 const rPixels = effectiveRadiusAU * safeScaleFactor;
                 
                // MOON PHASE FIX: 
                // Moons share the same 'Level' as their parent, so 'initial_phase' (derived from level) is identical.
                // We must add a unique offset so they distribute around the planet.
                // Use Name Hash for deterministic spread.
                const moonHash = b.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                const moonPhase = (moonHash % 360) * (Math.PI / 180);

                 // Calculate Angle
                 // theta = initial + unique_offset + t * freq
                 const theta = b.initial_phase + moonPhase + (secondsSinceJ2000 * b.orbital_freq * 2 * Math.PI);
                 
                 // Position = Parent + Local
                 // Scale: Moons need to be visible. 
                 // If we use true scale, they might be inside the planet dot.
                 // We might need a visual multiplier for moons in this view?
                 // For now, adhere to "Pure Harmonic" but maybe ensure rPixels >= min_visibility?
                 
                 // Apply MOON_SCALE for visibility if needed, or keeping it real?
                 // User wants "Perfect Model".
                 
                x = parentPos.x + rPixels * Math.cos(theta);
                y = parentPos.y - rPixels * Math.sin(theta); // Inverse Y-axis for Prograde
                z = parentPos.z; // Coplanar with parent for now (simplification)
            } else {
                // ORPHAN MOON HANDLING
                // If we can't find the parent, we shouldn't draw it at the Solar Center.
                // It creates a "Big Ball" of orphans at 0,0 or at the normalized radius.
                // Better to hide them or place them at the parent's generic framework slot?
                // For now, let's just create a valid position based on Normalized Radius but offset.
                
                 const theta = b.initial_phase + (secondsSinceJ2000 * b.orbital_freq * 2 * Math.PI);
                 // If it's a moon, it shouldn't be heliocentric radius 0.x AU. 
                 // It implies data issue.
                 // Let's hide it (x=0, y=0) or keep previous logic but minimizing "Big Ball" effect.
                 
                 x = center; // Hide in sun if orphan
                 y = center;
                 z = 0;
            }

             return {
                 ...b,
                 x, y, z
             };
        });

        return [...computedPrimaries, ...computedMoons];
    }


    public generateHarmonicSystem(mode: 'clock' | 'all' | 'control' = 'clock', octave: number = 1, precision: number | Set<number> = 1): { bodies: RenderableBody[], systemScale: string, shadowCount: number } {
        
        let physicalBodies: HarmonicBody[] = [];
        let systemScaleLabel = "";
        let normalizationFactor = 1.0;
        let shadowCountLocal = 0;

        // --- 1. GENERATE RAW DATA ---
        if (mode === 'control') {
            // CONTROL MODE: Real Solar System
            // NORMALIZE: Fit entire system (Pluto/Kuiper ~40 AU) into 1.0 unit radius
            systemScaleLabel = "1.0 AU";
            const SYSTEM_LIMIT_AU = 40.0;
            normalizationFactor = 1.0 / SYSTEM_LIMIT_AU;

            // Build pure harmonic orbital bodies based strictly on framework levels
            const CLASSICAL_LEVELS = [
                { name: "Mercury", level: 5, color: "#8C7853", radius_km: 2439.7, isRetrograde: false },
                { name: "Venus", level: 13.5, color: "#FFC649", radius_km: 6051.8, isRetrograde: true },
                { name: "Earth", level: 90, color: "#4A90E2", radius_km: 6371.0, isRetrograde: false },
                { name: "Mars", level: 49, color: "#E27B58", radius_km: 3389.5, isRetrograde: false },
                { name: "Ceres", level: 56, color: "#9E9E9E", radius_km: 473.0, isRetrograde: false },
                { name: "Jupiter", level: 64, color: "#C88B3A", radius_km: 69911.0, isRetrograde: false },
                { name: "Saturn", level: 78, color: "#FAD5A5", radius_km: 58232.0, isRetrograde: false },
                { name: "Uranus", level: 86, color: "#4FD0E7", radius_km: 25362.0, isRetrograde: true },
                { name: "Neptune", level: 92, color: "#4169E1", radius_km: 24622.0, isRetrograde: false },
                { name: "Pluto", level: 98, color: "#D1C4E9", radius_km: 1188.3, isRetrograde: false }
            ];

            physicalBodies = CLASSICAL_LEVELS.map(planet => {
                 // 1. DERIVE RADIUS
                 // Use the framework's native Phi-based distance mapping
                 const radius_au = CosmicRecursionEngine.levelToRadius(planet.level);

                 // 2. DERIVE FREQUENCY (72:226 Circle Engine Math)
                 // The framework asserts 1 degree of precession = 72 years
                 // Therefore, standard "Earth" (Base Anchor) period is 365.25 days
                 // For all other bodies, Kepler's Third Law mathematically links radius to period natively
                 // T^2 = a^3  =>  T = sqrt(a^3)  (where T is in Earth Years, a is in AU)
                 const period_years = Math.sqrt(Math.pow(radius_au, 3));
                 const period_days = period_years * 365.256;
                 // Set retrograde natively inside the framework variables
                 const period_sec = (planet.isRetrograde ? -1 : 1) * period_days * 86400;

                 // We need to calculate N-index for them too
                 // f_eff = 1/period. n_eff = log(f/F_sys)/log(PHI)
                 // Using Earth's orbital period as a reference for F_sys (1 year)
                 // F_sys = 1 / (365.25 * 86400) Hz
                 const F_SYS_REF_HZ = 1 / (365.25 * 86400); // Approx 3.17e-8 Hz
                 const f_real = 1 / period_sec;
                 const n_real = Math.log(f_real / F_SYS_REF_HZ) / Math.log(this.phi);

                 return {
                    id: "harmonic_" + planet.name,
                    name: planet.name,
                    level_ref: planet.level,
                    radius_au: radius_au,
                    period_sec: period_sec,
                    eccentricity: 0.0, // Perfect circles in the pure harmonic model
                    color: planet.color,
                    geometry: 'Ellipse',
                    base_freq: f_real, // Use calculated real frequency
                    orbital_freq: f_real,
                    precession_rate: 0,
                    drag_factor: 1.0,
                    initial_phase: 0,
                    body_radius: 1.5 + (Math.log10(planet.radius_km) * 1.2),
                    consciousness: "", core_desire: "", archetype: "", spin_freq: 0, perturbation: { type: 'sine', strength: 0 },
                    
                    // 3D ORBITAL ELEMENTS (Essential for Accurate Pathing)
                    // The pure framework is a flat coplanar grid. No inclination.
                    inclination: 0.0,
                    longitude_asc_node: 0.0,
                    arg_perihelion: 0.0,
                    mean_anomaly_epoch: 0.0,
                    orbital_period_days: period_days,

                    // PHYSICAL METRICS
                    zodiac_angle: 0.0,
                    geometry_type: 'Conjunction',
                    intensity: 1.0, // Real objects are fully manifest
                    freq_hz: f_real,
                    harmonic_phase: n_real, // Add harmonic phase
                    
                    // METADATA
                    object_type: 'Planet'
                };
            });


        } else {
            // FRACTAL MODE: Recursive Generation
            const { bodies: octaveBodies, shadowCount: sCount } = getOctaveBodies(octave, precision);
            
            // 2. Determine Normalization Factor (The Slide Scale)
            // 2. Determine Normalization Factor (The Slide Scale)
            // Use CosmicRecursionEngine to determine the outer boundary of this octave in AU.
            // We normalize this Maximum Radius to 1.0 Unit for rendering.
            const boundary = CosmicRecursionEngine.getOctaveBoundary(octave);
            const systemRadiusForScale = boundary.maxRadius || 1;
            
            normalizationFactor = 1.0 / systemRadiusForScale;

            // Set Human-Readable Label
            // Generic Scale Labeling based on normalization factor
            if (Math.abs(systemRadiusForScale - 1) < 0.1) systemScaleLabel = "1.0 AU (Solar)";
            else if (systemRadiusForScale < 1e-10) systemScaleLabel = "Atomic Scale"; // Subatomic
            else systemScaleLabel = "10^" + Math.round(Math.log10(systemRadiusForScale)) + " AU";

            // PURE FRAMEWORK LOGIC (User Request: "Calculate, Don't Cheat")
            // No arbitrary filtering or injection of missing planets.
            // Octave 11 shows exactly what the Harmonic Engine discovers.
            
            const renderableSystemBodies = octaveBodies.map((body, i) => {
                // SEED WITH REALITY (Visual Parity for Comparison)
                // Use the Mean Anomaly from J2000 as the starting phase.
                // This ensures Octave 2 starts at the same visual position as Control/JPL
                // but moves according to Framework Physics (Period = R^1.5).
                
                // We allow looking up the Initial Phase (J2000) for alignment,
                // but we DO NOT override the Radius or Period with JPL data.
                // The Radius comes from the Framework Discovery (octave_bodies.ts).
                
                // GET ORBITAL ORIENTATION (Geometry from Reality)
                // "Unification": Use Framework Physics (Period/Radius) but Real Geometry (Orientation)
                // PHASE CALCULATION
                // Theoretical bodies now have deterministic initial_phase from octave_bodies.ts
                // If it's a classical planet/moon, we override it with the perfect Grand Syzygy geometric anchor.
                let initialPhase = body.initial_phase || 0;
                
                // FORCE THE CLOSED LOOP EPOCH ALIGNMENT
                // If the framework knows about this literal body name for Syzygy locking:
                const grandPhase = getGrandSyzygyAngles(body.name);
                // getGrandSyzygyAngles returns 0 if there is a match or fallback. Since we mapped all 
                // classical planets to 0 to form a straight radial line (Syzygy), we use it.
                // We're completely wiping external J2000 observation bias here.
                initialPhase = grandPhase;
                
                // For "Snapshot" generation (no time evolution), we just use initial_phase
                // If we want dynamic time, we'd need simTime passed in.
                // Assuming this is for Debug List (Static-ish)
                const currentAngleDeg = (initialPhase * 180 / Math.PI) % 360;

                // N-Index Calculation
                // F_sys = 1 / (365.25 * 86400) Hz (Earth's orbital frequency)
                const F_SYS_REF_HZ = 1 / (365.25 * 86400); // Approx 3.17e-8 Hz
                const n_calc = Math.log((body.freq_hz || F_SYS_REF_HZ) / F_SYS_REF_HZ) / Math.log(this.phi);

                // SIMPLIFIED: No internal JPL lookup. 
                // We rely on 'octave_bodies.ts' to have injected the real phase/inclination if available.
                // This makes the Engine "Generic" and "Data-Driven".
                const effectivePhase = initialPhase;
 
                // CALCULATE PHYSICS FROM RADIUS
                // P = R^1.5 (Kepler's 3rd Law)
                // STRICT FRAMEWORK COMPLIANCE: Use Framework Radius (radius_au)
                // External Data (real_radius) is for Identification & Alignment ONLY.
                const r = body.radius_au;
                const periodYears = Math.pow(r, 1.5);
                const periodDays = periodYears * 365.256; 

                // HARMONIC PHYSICS GENERATION
                // Purely algorithmic, based on position and scale.
                const physics = PhysicsEngine.calculateHarmonicProperties(r, body.level, body.discovery_subOctive || 1);

                return {
                    id: "o" + octave + "_l" + body.level + "_" + body.name,
                    name: body.name,
                    level_ref: body.level,
                    level: body.level, // EXPLICIT LEVEL FOR DEBUG
                    radius_au: r,
                    theoretical_radius_au: body.radius_au, // PRESERVE FRAMEWORK RADIUS
                    period_sec: periodDays * 86400,
                    
                    eccentricity: body.eccentricity,
                    color: body.color,
                    geometry: 'Ellipse',
                    base_freq: body.freq_hz,
                    orbital_freq: 1 / (periodDays * 86400),
                    precession_rate: 0,
                    drag_factor: 1.0,
                    initial_phase: effectivePhase,
                    
                    // PASS GEOMETRY TO RENDERER / DYNAMICS
                    inclination: body.inclination || 0,
                    longitude_asc_node: body.longitude_asc_node || 0,
                    arg_perihelion: body.arg_perihelion || 0,
                    mean_anomaly_epoch: body.mean_anomaly_epoch || 0,
                    orbital_period_days: periodDays, // Store calculated period

                    // RESTORED ESSENTIAL PROPERTIES
                    normalized_radius_au: r,
                    meta: {
                        true_radius_au: body.radius_au,
                        radius_txt: body.radius_au.toFixed(4),
                        period_s: periodDays * 86400,
                        period_txt: periodDays.toFixed(2) + " d",
                        type: body.object_type || "Resonance",
                        freq_hz: body.freq_hz || 0,
                        constellation: (body as any).constellation
                    },

                    // PHYSICAL METRICS (Calculated)
                    zodiac_angle: ((currentAngleDeg % 360) + 360) % 360,
                    geometry_type: this.getGeometryType(currentAngleDeg),
                    intensity: (body.alignment || 0) / 100, // Normalized form
                    freq_hz: body.freq_hz,
                    harmonic_phase: n_calc,

                    // HARMONIC DENSITY SCALING:
                    // Use Schumann-anchored volumetric radius for physical parity.
                    // HARMONIC DENSITY SCALING:
                    // Use Schumann-anchored volumetric radius for physical parity.
                    mass_kg: physics.mass_kg,
                    density_gcm3: physics.density_gcm3,
                    composition: physics.composition,
                    electromagnetic_field_tesla: physics.electromagnetic_field_tesla,
                    
                    // PASS THROUGH STRUCTURAL METADATA (Crucial for Filtering)
                    object_type: body.object_type, // Map 'type' from octave_bodies to 'object_type'
                    // FIX: Parent ID must match the generated ID schema (o{octave}_l{level}_{Name})
                    // Since Moons share the same Level as their parent, we can reconstruct it.
                    parentBodyId: body.parentBodyId ? ("o" + octave + "_l" + body.level + "_" + body.parentBodyId) : undefined,
                    local_radius_au: body.local_radius_au,
                    catalogName: body.catalogName,
                    discovery_subOctive: body.discovery_subOctive,
                    auto_discovered: body.auto_discovered,
                    
                    isHarmonicEcho: body.isHarmonicEcho,
                    echoMatches: body.echoMatches,
                    real_radius: body.real_radius,
                    status: body.status,
                    discovery_source: body.discovery_source,
                    discoverer: body.discoverer,
                    alignment: body.alignment,

                    // VISUAL PROPERTIES
                    body_radius: CosmicRecursionEngine.calculateHarmonicVisualRadius(body.diameter_km),
                    perturbation: { type: 'sine', strength: 0 } as any,
                    spin_freq: body.spin_freq || 0,
                    
                    // PLACEHOLDERS
                    consciousness: "", 
                    core_desire: "", 
                    archetype: "",

                    // METADATA - Pass Object Type
                    // object_type removed to fix duplicate key error
                };
            });

            physicalBodies = renderableSystemBodies as any[];
            shadowCountLocal = sCount;
        }

        // --- 2. NORMALIZE (The Lens) ---
        const renderableBodies: RenderableBody[] = physicalBodies.map(b => {
            const visualRadiusAU = b.radius_au * normalizationFactor;
            
            // Format labels intelligently
            let radiusTxt = b.radius_au.toExponential(2) + " AU";
            
            // If roughly 1.0 (Solar System Scale), use decimal
            if (Math.abs(normalizationFactor - 1.0) < 0.001) {
                radiusTxt = b.radius_au.toFixed(2) + " AU";
            }
            
            return {
                id: b.id,
                name: b.name,
                normalized_radius_au: visualRadiusAU,
                theoretical_radius_au: b.theoretical_radius_au, // Pass through
                visual_radius: b.body_radius,
                radius_au: b.radius_au, // EXPOSE AT TOP LEVEL (Fixes UI "0 AU")
                color: b.color,
                meta: {
                    true_radius_au: b.radius_au,
                    period_s: b.period_sec,
                    period_txt: (b.period_sec / 86400).toFixed(1) + 'd',
                    radius_txt: radiusTxt,
                    type: b.object_type || 'Unknown',
                    freq_hz: b.freq_hz,
                    constellation: (b as any).constellation
                },
                normalized_period: b.period_sec, 
                eccentricity: b.eccentricity,
                initial_phase: b.initial_phase || 0, // Ensure number
                orbital_freq: b.orbital_freq,  
                spin_freq: b.spin_freq || 0,
                precession_rate: b.precession_rate,
                
                inclination: b.inclination,
                longitude_asc_node: b.longitude_asc_node,
                arg_perihelion: b.arg_perihelion,
                mean_anomaly_epoch: b.mean_anomaly_epoch,
                orbital_period_days: b.orbital_period_days,

                // UI Metadata Pass-through
                level: b.level, // NEW: Debug level
                level_ref: b.level_ref,
                object_type: b.object_type,
                base_freq: b.freq_hz,
                distance_pc: b.distance_pc,
                spectral_type: b.spectral_type,
                period_sec: b.period_sec,
                is_theoretical: b.is_theoretical, // Pass visual flag to renderer

                auto_discovered: b.auto_discovered,
                parentBodyId: b.parentBodyId, // Pass through
                alignment: b.alignment,       // Pass through
                local_radius_au: b.local_radius_au, // Pass through
                isHarmonicEcho: b.isHarmonicEcho,
                echoMatches: b.echoMatches,
                discovery_subOctive: b.discovery_subOctive, // Pass through
                real_radius: b.real_radius, // PASS THROUGH
                status: b.status, // PASS THROUGH
                discovery_source: b.discovery_source, // PASS THROUGH
                discoverer: b.discoverer, // PASS THROUGH

                // NEW METRICS PASS-THROUGH
                geometry_type: b.geometry_type,
                zodiac_angle: b.zodiac_angle,
                intensity: b.intensity,
                freq_hz: b.freq_hz,
                harmonic_phase: b.harmonic_phase, // Pass through
                
                // PHYSICS DATA PASS-THROUGH
                mass_kg: b.mass_kg,
                density_gcm3: b.density_gcm3,
                composition: b.composition,
                electromagnetic_field_tesla: b.electromagnetic_field_tesla
            };
        });

        return {
            bodies: renderableBodies,
            systemScale: systemScaleLabel,
            shadowCount: shadowCountLocal
        };
    }

    private parseScientific(str: string | undefined): number {
        if (!str || str.toLowerCase().includes('n/a')) return 1;
        const superscripts: Record<string, string> = {
            '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
            '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
            '⁻': '-', '⁺': '+'
        };
        let normalized = str.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, m => superscripts[m]);
        normalized = normalized.replace(/×10/g, 'e');
        const match = normalized.match(/=\s*([+\-]?[\d\.e]+)/i) || normalized.match(/([+\-]?[\d\.e]+)/i);
        return match ? parseFloat(match[1]) : 1;
    }

    /**
     * Helper: Convert Angle (0-360) to Geometry Type (Aspect)
     */
    private getGeometryType(angle: number): string {
        const norm = ((angle % 360) + 360) % 360;
        
        // Major Aspects (Orb 10 degrees)
        // Returns "SYMBOL Name"
        if (norm < 10 || norm > 350) return "☌ Conjunction"; // 0
        if (Math.abs(norm - 180) < 10) return "☍ Opposition"; // 180
        if (Math.abs(norm - 120) < 10 || Math.abs(norm - 240) < 10) return "△ Trine"; // 120
        if (Math.abs(norm - 90) < 10 || Math.abs(norm - 270) < 10) return "□ Square"; // 90
        if (Math.abs(norm - 60) < 10 || Math.abs(norm - 300) < 10) return "✱ Sextile"; // 60
        
        return "-";
    }
}

// Helper to avoid circular dependency if needed, but locally computed is fine.
const arrayOfScale: Record<number, number> = {};
