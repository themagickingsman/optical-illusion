import snapshot from '../data/harmonicResonanceAPI.json';
import { RenderableBody } from '../../state/science/HarmonicResonanceEngine';
import { getGrandSyzygyAngles } from '../../state/science/CosmicEpochSolver';

/**
 * SnapshotAdapter
 *
 * Provides direct access to harmonicResonanceAPI.json in a format
 * optimized for the CosmicClock simulation (flat arrays of raw framework nodes).
 *
 * This ALWAYS returns raw framework data with names like "Predicted Orbit".
 * Name resolution (matching to real science catalog bodies) is handled by
 * UnifiedCosmicCatalog — NOT here.
 */

const GOLDEN_ANGLE = 2 * Math.PI / (((1 + Math.sqrt(5)) / 2) ** 2); // ≈ 137.508°

export const SnapshotAdapter = {
    /**
     * getOctaveData
     * Returns raw framework bodies for an octave, sorted by radius,
     * with golden angle spiral phases for predicted nodes.
     */
    getOctaveData: (octave: number | string): RenderableBody[] => {
        const fullSnapshot = snapshot as any;
        const octaveData = fullSnapshot.octaves?.[octave];
        if (!octaveData) {
            console.warn(`[SnapshotAdapter] No data found for Octave ${octave}`);
            return [];
        }

        // The Snapshot is CUMULATIVE: Tier 15 contains ALL bodies (Tier 1-15).
        const flatBodies = (octaveData as any)['15'] as RenderableBody[];
        if (!flatBodies) {
            console.warn(`[SnapshotAdapter] No Tier 15 data for Octave ${octave}. Flattening.`);
            return Object.values(octaveData).flat() as RenderableBody[];
        }

        const sorted = flatBodies.slice().sort((a, b) => (a.radius_au || 0) - (b.radius_au || 0));
        let spiralIndex = 0;

        return sorted.map(b => {
            const isPredicted = b.name === 'Predicted Orbit' || (b as any).status === 'predicted';
            let phase: number;
            if (isPredicted) {
                phase = (spiralIndex * GOLDEN_ANGLE) % (2 * Math.PI);
                spiralIndex++;
            } else {
                phase = getGrandSyzygyAngles(b.name);
            }
            return {
                ...b,
                level: (b as any).level,
                color: (b.color === '#ffffff' && (b as any).compass_hex) ? (b as any).compass_hex : b.color,
                initial_phase: phase
            };
        });
    },

    /**
     * getFoundationBodies
     * Extracts the 7 canonical Solar Wanderer bodies from any octave by fractal proportion.
     */
    getFoundationBodies: (octave: number | string): RenderableBody[] => {
        const fullSnapshot = snapshot as any;
        const octaveData = fullSnapshot.octaves?.[octave];
        if (!octaveData) return [];

        const flatBodies = (octaveData['15'] || Object.values(octaveData).flat()) as RenderableBody[];
        if (!flatBodies || flatBodies.length === 0) return [];

        const TRUE_FOUNDATION_AU = [0.00257, 0.387, 0.723, 1.0, 1.524, 5.203, 9.537];
        const o11Data = fullSnapshot.octaves?.['11']?.['15'] as RenderableBody[] || [];

        const normalizedStandards = TRUE_FOUNDATION_AU.map((targetAu, idx) => {
            let closestMatch = o11Data[0];
            let minDiff = Infinity;
            for (const body of o11Data) {
                const bodyAu = body.radius_au ?? (body as any).meta?.true_radius_au;
                if (bodyAu === undefined) continue;
                const diff = Math.abs(bodyAu - targetAu);
                if (diff < minDiff) { minDiff = diff; closestMatch = body; }
            }
            return { norm: closestMatch.normalized_radius_au, isMoon: idx === 0 };
        });

        const results: RenderableBody[] = [];
        normalizedStandards.forEach(std => {
            let geometricMatch = flatBodies[0];
            let minDiff = Infinity;
            for (const body of flatBodies) {
                const diff = Math.abs((body as any).normalized_radius_au - std.norm);
                if (diff < minDiff) { minDiff = diff; geometricMatch = body; }
            }
            if (geometricMatch) {
                results.push({
                    ...geometricMatch,
                    level: (geometricMatch as any).level,
                    color: (geometricMatch.color === '#ffffff' && (geometricMatch as any).compass_hex)
                        ? (geometricMatch as any).compass_hex
                        : geometricMatch.color,
                    initial_phase: getGrandSyzygyAngles(geometricMatch.name)
                });
            }
        });

        return results;
    },

    /**
     * getOctaves — returns all available octave keys.
     */
    getOctaves: (): string[] => {
        return Object.keys((snapshot as any).octaves || {});
    },
};

// PRE-COMPUTED EXPORTS
export const FLAT_OCTAVE_0  = SnapshotAdapter.getOctaveData(0);
export const FLAT_OCTAVE_1  = SnapshotAdapter.getOctaveData(1);
export const FLAT_OCTAVE_2  = SnapshotAdapter.getOctaveData(2);
export const FLAT_OCTAVE_3  = SnapshotAdapter.getOctaveData(3);
export const FLAT_OCTAVE_4  = SnapshotAdapter.getOctaveData(4);
export const FLAT_OCTAVE_5  = SnapshotAdapter.getOctaveData(5);
export const FLAT_OCTAVE_6  = SnapshotAdapter.getOctaveData(6);
export const FLAT_OCTAVE_7  = SnapshotAdapter.getOctaveData(7);
export const FLAT_OCTAVE_8  = SnapshotAdapter.getOctaveData(8);
export const FLAT_OCTAVE_9  = SnapshotAdapter.getOctaveData(9);
export const FLAT_OCTAVE_10 = SnapshotAdapter.getOctaveData(10);
export const FLAT_OCTAVE_11 = SnapshotAdapter.getOctaveData(11);
export const FLAT_OCTAVE_12 = SnapshotAdapter.getOctaveData(12);
export const FLAT_OCTAVE_13 = SnapshotAdapter.getOctaveData(13);
export const FLAT_OCTAVE_14 = SnapshotAdapter.getOctaveData(14);
