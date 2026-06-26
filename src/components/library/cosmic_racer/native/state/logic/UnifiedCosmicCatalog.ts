import { SolarSystemBody, ALL_OCTAVES, getLevelsForPrecision } from '../../state/science/recursion_levels';
import { OctaveBody } from '../../state/science/octave_bodies';
import { SnapshotAdapter } from './SnapshotAdapter';

/**
 * Unified Cosmic Catalog
 * Aggregates all "Known Science" data sources into a single queryable service.
 * Maps traditional science catalogs to Cosmic Octaves.
 */

// Partial<SolarSystemBody> is problematic due to strict union types on 'type'.
// We will define the interface explicitly to avoid conflicts.
export interface CatalogEntry {
    octave: number;
    frameworkLevel?: number; 
    frameworkMatch?: OctaveBody; // Required Framework Node (Now Optional for Unmatched Items)
    scienceMatch?: SolarSystemBody; // Optional Science Object
    
    // Core fields for UI
    name: string;
    type: string; // Relaxed to string to allow 'Theoretical' etc.
    semi_major_axis_au: number;
    mass_kg?: number;
    density_gcm3?: number;
    electromagnetic_field_tesla?: number;
    source?: string;
}

// ── Fractal Type Normalizer ───────────────────────────────────────────────────
// For any octave, maps unmatched framework nodes to intuitive UI filter types.
// Science-matched bodies always keep their real catalog type.
//
// The 7 Solar Wanderer normalized_radius_au values from Octave 11 are the fractal
// reference. Any node in any octave at one of these proportional positions is
// classified as 'Planet' — consistent across all octaves and all filter buttons.

// TRUE_FOUNDATION_AU: Moon through Saturn (the 7 original Solar Wanderers)
const TRUE_FOUNDATION_AU = [0.00257, 0.387, 0.723, 1.0, 1.524, 5.203, 9.537];

// Lazily computed once from Octave 11 raw data
let _foundationNorms: number[] | null = null;
function getFoundationNorms(): number[] {
    if (_foundationNorms) return _foundationNorms;
    const o11Raw = SnapshotAdapter.getOctaveData('11');
    _foundationNorms = TRUE_FOUNDATION_AU.map(targetAu => {
        let best = o11Raw[0];
        let minD = Infinity;
        for (const b of o11Raw) {
            const d = Math.abs((b.radius_au ?? 0) - targetAu);
            if (d < minD) { minD = d; best = b; }
        }
        return (best as any).normalized_radius_au as number ?? 0;
    });
    return _foundationNorms;
}

function normalizeObjectType(
    scienceType: string | undefined,
    tier: number,
    normalizedRadius: number
): string {
    // Science-matched bodies always keep their real catalog type
    if (scienceType && scienceType !== 'Node' && scienceType !== 'Predicted Orbit') {
        return scienceType;
    }
    // Tier 1 = the central anchor body of the octave (the "Sun" equivalent)
    if (tier <= 1) return 'Star';
    // Check if this node sits at one of the 7 fractal planet positions (±3% tolerance)
    const norms = getFoundationNorms();
    const isPlanetClass = norms.some(norm => norm > 0 && Math.abs(normalizedRadius - norm) / norm < 0.03);
    if (isPlanetClass) return 'Planet';
    // Tier-based fallback for remaining unmatched nodes
    if (tier <= 3)  return 'Moon';
    if (tier <= 6)  return 'Asteroid';
    if (tier <= 9)  return 'Centaur';
    if (tier <= 12) return 'TNO';
    return 'Node/Trojan';
}

export class UnifiedCosmicCatalog {

    /**
     * Get all Framework Nodes for a specific octave, enriched with Known Science matches.
     * @param octave The octave index (0-14)
     */
    public static getCatalogByOctave(octave: number): CatalogEntry[] {
        // Fetch Framework Data (The Grid) from the pre-calculated JSON output
        const frameworkData = SnapshotAdapter.getOctaveData(octave.toString());

        // PRE-CALCULATE ACCURATE TIER MAPPINGS
        // The JSON snapshot defaults to tier: 15 for generated objects, but we need
        // strict precision depth routing.
        const levelToTier = new Map<string, number>();
        for (let p = 15; p >= 1; p--) {
            getLevelsForPrecision(p).forEach(l => {
                const key = Number(l).toFixed(2);
                levelToTier.set(key, p);
            });
        }

        // PRE-PASS: Enforce 1-to-1 Matching
        // Since there are many framework nodes in a dense 15-tier cluster, multiple 
        // nodes can fall within 15% of a single real-world body. We must ensure 
        // a real-world body is only assigned to its absolute mathematical closest node.
        const fwToScience = new Map<string, SolarSystemBody>();
        const usedFwIds = new Set<string>();

        const activeCatalog = ALL_OCTAVES[octave] || [];
        
        const fwRadii = frameworkData.map(fw => (fw as any).local_radius_au || (fw as any).radius_au || (fw as any).meta?.true_radius_au || 0).filter(r => r > 0);
        const fwMin = fwRadii.length > 0 ? Math.min(...fwRadii) : 0;
        const fwMax = fwRadii.length > 0 ? Math.max(...fwRadii) : 0;
        
        const catRadii = activeCatalog.map(b => b.semi_major_axis_au!).filter(r => r !== undefined);
        const catMin = catRadii.length > 0 ? Math.min(...catRadii) : 0;
        const catMax = catRadii.length > 0 ? Math.max(...catRadii) : 0;

        // Determine if scales are totally disjoint (i.e. empirical sizes dont map to the identical AU scale)
        let isDisjoint = false;
        if (catMin > 0 && fwMin > 0 && Math.max(catMin / fwMin, fwMin / catMin) > 1000) {
            isDisjoint = true;
        }

        // We use a competitive map to ensure purely 1-to-1 assignments
        const scienceToFw = new Map<string, { fwId: string, diff: number }>();

        frameworkData.forEach(fwBody => {
            const fw = fwBody as any;
            const fwRadius = fw.local_radius_au || fw.radius_au || fw.meta?.true_radius_au || 0;
            if (fwRadius === 0 || !fw.id) return;

            let closestBody: SolarSystemBody | null = null;
            let minDiff = Infinity;

            // EXACT NAME MATCH
            const exactBody = activeCatalog.find(b => b.name === fw.name);
            if (exactBody) {
                closestBody = exactBody;
                minDiff = 0; // Exact match signifies 0 deviation priority
            } else {
                let fwRelativePos = 0;
                if (isDisjoint && fwMax > fwMin) {
                    fwRelativePos = Math.log(fwRadius / fwMin) / Math.log(fwMax / fwMin);
                }

                activeCatalog.forEach(body => {
                    if (body.semi_major_axis_au === undefined) return;
                    
                    // PREVENT THEFT: DO not match if this body is explicitly named in the framework elsewhere
                    if (frameworkData.some(otherFw => (otherFw as any).name === body.name && (otherFw as any).id !== fw.id)) return;

                    // TYPE PRIORITY: Major planets always beat Trojans/Asteroids in competitive matching.
                    // A small priority multiplier lowers the effective diff ratio for Planet/Dwarf Planet,
                    // preventing Trojan co-orbitals from stealing Jupiter's framework node.
                    const isPrimaryBody = (body.type === 'Planet' || body.type === 'Dwarf Planet');
                    const priorityScale = isPrimaryBody ? 0.8 : 1.0;

                    if (isDisjoint) {
                        let bodyRelativePos = 0;
                        if (catMax > catMin) {
                            bodyRelativePos = Math.log(body.semi_major_axis_au / catMin) / Math.log(catMax / catMin);
                        }
                        const diff = Math.abs(fwRelativePos - bodyRelativePos) * priorityScale;
                        if (diff < minDiff) { minDiff = diff; closestBody = body; }
                    } else {
                        // For non-disjoint (Solar System), find absolute closest
                        let diffRatio = fwRadius > body.semi_major_axis_au ? fwRadius / body.semi_major_axis_au : body.semi_major_axis_au / fwRadius;
                        diffRatio *= priorityScale;
                        if (diffRatio < minDiff) { minDiff = diffRatio; closestBody = body; }
                    }
                });
            }

            if (closestBody) {
                // To prevent multiple nodes from grabbing Earth, we only lock it if we are the best suitor
                const prev = scienceToFw.get(closestBody.name);
                if (!prev || minDiff < prev.diff) {
                    scienceToFw.set(closestBody.name, { fwId: fw.id, diff: minDiff });
                }
            }
        });

        // Resolve competitive assignments into the final forward map
        scienceToFw.forEach((matchInfo, bodyName) => {
             const body = activeCatalog.find(b => b.name === bodyName);
             if (body) {
                 fwToScience.set(matchInfo.fwId, body);
                 usedFwIds.add(matchInfo.fwId);
             }
        });

        // Map Framework Entries directly, ensuring the UI hook receives the full payload
        const results: CatalogEntry[] = frameworkData.map((fwBody, index) => {
            const fw = fwBody as any;

            // Grab the absolute closest 1-to-1 match assigned during the pre-pass
            let scienceMatch: SolarSystemBody | undefined = fw.id ? fwToScience.get(fw.id) : undefined;
            
            // Calculate exact alignment percentages
            // For Moons, we evaluate their local orbit against the framework's mathematical local orbit.
            const fwRadius = fw.local_radius_au || fw.radius_au || fw.meta?.true_radius_au || 0;
            const matchDiff = scienceMatch && scienceMatch.semi_major_axis_au !== undefined 
                ? Math.abs(scienceMatch.semi_major_axis_au - fwRadius) 
                : Infinity;

            if (scienceMatch) {
                 // Calculate alignment percentage using a relaxed logarithmic dimensional ratio
                 let alignment = 100;
                 if (isDisjoint) {
                     // In disjoint (synthetic) scales, calculating percentage by linear AU diff is meaningless. 
                     // Compare relative positions within the octave.
                     let bodyRelativePos = 0;
                     let fwRelativePos = 0;
                     
                     if (catMax > catMin && scienceMatch.semi_major_axis_au !== undefined) {
                         bodyRelativePos = Math.log(scienceMatch.semi_major_axis_au / catMin) / Math.log(catMax / catMin);
                     }
                     if (fwMax > fwMin && fwRadius > 0) {
                         fwRelativePos = Math.log(fwRadius / fwMin) / Math.log(fwMax / fwMin);
                     }
                     const diff = Math.abs(bodyRelativePos - fwRelativePos);
                     
                     // 100% minus the structural variance
                     alignment = 100 - (diff * 100);
                 } else {
                     // For exact physical clusters (Solar system), use the tighter linear threshold
                     if (matchDiff > 0 && fwRadius > 0 && scienceMatch.semi_major_axis_au! > 0) {
                         const ratio = Math.min(fwRadius, scienceMatch.semi_major_axis_au!) / Math.max(fwRadius, scienceMatch.semi_major_axis_au!);
                         alignment = Math.pow(ratio, 0.5) * 100;
                     } else if (matchDiff > 0) {
                         alignment = 0;
                     }
                 }
                 
                 if (alignment < 0) alignment = 0;
                 if (alignment > 100) alignment = 100;

                 // STRICT UI MATCHING GATE: Stop forcing absurd matches!
                 if (alignment < 60) {
                     // The deviation is mathematically too large to consider this a structural twin.
                     scienceMatch = undefined; 
                     fw.alignment = undefined;
                 } else {
                     fw.alignment = alignment;
                 
                     // Intentionally DO NOT overwrite fw.name here to keep the framework column pure
                     if ((scienceMatch as any).color) {
                         fw.color = (scienceMatch as any).color;
                     }
                 }
            } else {
                 fw.alignment = undefined;
            }

            const frameworkName = fw.name || `Resonance Node`;
            
            // If science match exists, override name with the real-world observed name, 
            // since this is a 1-to-1 catalog mapping
            const finalName = scienceMatch ? scienceMatch.name : frameworkName;

            // DYNAMIC TIER RESOLUTION
            // The JSON snapshot assigns a flat 'tier' and 'discovery_subOctive', which breaks UI depth filters.
            const fwLevel = fw.level !== undefined ? Number(fw.level) : 0;
            const lookupKey = fwLevel.toFixed(2);
            const accurateTier = levelToTier.get(lookupKey) || 15;
            fw.tier = accurateTier;
            (fw as any).discovery_subOctive = accurateTier;

            return {
                name: finalName,
                semi_major_axis_au: fw.radius_au || 0,
                type: normalizeObjectType(
                    scienceMatch ? scienceMatch.type : undefined,
                    accurateTier,
                    (fw as any).normalized_radius_au ?? 0
                ),
                source: scienceMatch ? scienceMatch.source : (fw.discovery_source || 'Cosmic Compass Framework'),
                octave: octave,
                color: (fw as any).compass_hex || fw.color,
                frameworkMatch: fw, // Crucial: useCosmicData.ts spreads this entire object into the UI
                frameworkLevel: fw.level,
                scienceMatch: scienceMatch
            };
        }).sort((a, b) => {
            const rA = a.frameworkMatch?.local_radius_au || a.frameworkMatch?.radius_au || a.semi_major_axis_au;
            const rB = b.frameworkMatch?.local_radius_au || b.frameworkMatch?.radius_au || b.semi_major_axis_au;
            return rA - rB;
        });

        return results;
    }

    /**
     * Get a consolidated list of all known science objects across all octaves.
     */
    public static getAllKnownScience(): Record<number, CatalogEntry[]> {
        const result: Record<number, CatalogEntry[]> = {};
        // Populate all Octaves 1-14
        for (let i = 1; i <= 14; i++) {
            result[i] = this.getCatalogByOctave(i);
        }
        return result;
    }

    /**
     * Search for a body by name across all catalogs.
     */
    public static search(query: string): CatalogEntry[] {
        const q = query.toLowerCase();
        let all: CatalogEntry[] = [];
        
        // Aggregating all 14 Octaves might be heavy, but it's the only way to be "Unified"
        for (let i = 1; i <= 14; i++) {
            all = all.concat(this.getCatalogByOctave(i));
        }
        
        return all.filter(b => 
            b.name.toLowerCase().includes(q) || 
            (b.scienceMatch && b.scienceMatch.name.toLowerCase().includes(q))
        );
    }
}
