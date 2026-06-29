/**
 * unit_converter.ts
 * 
 * Strict universal dimensional converter for the Cosmic Compass Engine.
 * Converts real-world physical boundaries (fm, pm, nm, km, lightyears, parsecs)
 * directly into Astronomical Units (AU) to match the engine's scalar geometry framework.
 */

// Core Constants
export const AU_IN_METERS = 149597870700; // 1 AU = 1.495978707 × 10^11 meters
export const LY_IN_AU = 63241.077084266;  // 1 Lightyear = 63,241 AU
export const PC_IN_AU = 206264.806245;    // 1 Parsec = 206,265 AU

/**
 * Convert standard Metric magnitudes directly to AU.
 */
export const Units = {
    // ── Macro Scale ──
    fromParsecs: (pc: number): number => pc * PC_IN_AU,
    fromLightYears: (ly: number): number => ly * LY_IN_AU,
    fromKilometers: (km: number): number => (km * 1000) / AU_IN_METERS,
    
    // ── Human/Geospatial Scale ──
    fromMeters: (m: number): number => m / AU_IN_METERS,
    fromCentimeters: (cm: number): number => (cm / 100) / AU_IN_METERS,
    fromMillimeters: (mm: number): number => (mm / 1000) / AU_IN_METERS,
    
    // ── Micro/Biological Scale ──
    fromMicrometers: (um: number): number => (um * 1e-6) / AU_IN_METERS, // Cells, capillaries
    fromNanometers: (nm: number): number => (nm * 1e-9) / AU_IN_METERS,  // Proteins, DNA, ATP Motors
    
    // ── Quantum/Atomic Scale ──
    fromPicometers: (pm: number): number => (pm * 1e-12) / AU_IN_METERS, // Electron orbitals, atoms
    fromFemtometers: (fm: number): number => (fm * 1e-15) / AU_IN_METERS // Nucleons, quarks
};
