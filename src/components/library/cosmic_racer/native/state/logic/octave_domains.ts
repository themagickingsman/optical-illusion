/**
 * OCTAVE_DOMAINS
 * Single source of truth for octave names used across the catalog page,
 * catalog modal, and simulation HUD.
 *
 * Each octave has:
 *  - `scientific`: The resonant-frequency science name (primary display)
 *  - `descriptor`: The cosmological layer descriptor (subtitle, smaller text)
 */
export interface OctaveDomain {
    scientific: string;  // e.g. "PRIMORDIAL FIELD"
    descriptor: string;  // e.g. "Void"
}

export const OCTAVE_DOMAINS: Record<number, OctaveDomain> = {
    0:  { scientific: 'PRIMORDIAL FIELD',     descriptor: 'Void' },
    1:  { scientific: 'QUANTUM FOAM',          descriptor: 'Quantum' },
    2:  { scientific: 'STRONG NUCLEAR FORCE',  descriptor: 'Subatomic' },
    3:  { scientific: 'ATOMIC NUCLEUS',        descriptor: 'Atomic' },
    4:  { scientific: 'ELECTRON ORBITALS',     descriptor: 'Elemental' },
    5:  { scientific: 'MOLECULAR BONDS',       descriptor: 'Molecular' },
    6:  { scientific: 'DNA & PROTEINS',        descriptor: 'Genetic' },
    7:  { scientific: 'CELLULAR MECHANICS',    descriptor: 'Cellular' },
    8:  { scientific: 'NEURAL OSCILLATIONS',   descriptor: 'Biological' },
    9:  { scientific: 'PLANETARY CAVITY',      descriptor: 'Ecological' },
    10: { scientific: 'LUNAR ORBITALS',        descriptor: 'Planetary' },
    11: { scientific: 'SOLAR SYSTEM',          descriptor: 'Solar' },
    12: { scientific: 'OORT CLOUD',            descriptor: 'Galactic' },
    13: { scientific: 'CONSTELLATIONS',        descriptor: 'Universal' },
    14: { scientific: 'MILKY WAY',             descriptor: 'Metaversal' },
};

/** Helper: returns "SCIENTIFIC NAME" for a given octave */
export function getOctaveScientificName(octave: number): string {
    return OCTAVE_DOMAINS[octave]?.scientific ?? `OCTAVE ${octave}`;
}

/** Helper: returns the short descriptor (e.g. "Solar", "Void") */
export function getOctaveDescriptor(octave: number): string {
    return OCTAVE_DOMAINS[octave]?.descriptor ?? '';
}
