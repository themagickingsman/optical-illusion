export interface FluidMedium {
    name: string;
    density: number; // kg/m^3
    speedOfSound: number; // m/s
    compressibility: number; // Pa^-1
}

export interface TargetElement {
    symbol: string;
    name: string;
    atomicNumber: number;
    density: number; // kg/m^3 (approx true density)
    compressibility: number; // Pa^-1 (approx)
    color: string;
    concentration_mg_per_L: number; // Ocean abundance
    pricePerKg: number; // Market value USD
}

export const FLUID_MEDIA: Record<string, FluidMedium> = {
    'SEAWATER': {
        name: 'Seawater',
        density: 1025,
        speedOfSound: 1531,
        compressibility: 4.4e-10 
    },
    'FRESHWATER': {
        name: 'Freshwater',
        density: 998,
        speedOfSound: 1481,
        compressibility: 4.6e-10
    }
};

export const TARGET_ELEMENTS: Record<string, TargetElement> = {
    'Au': { symbol: 'Au', name: 'Gold', atomicNumber: 79, density: 19300, compressibility: 5.5e-12, color: '#eab308', concentration_mg_per_L: 0.000004, pricePerKg: 65000 },
    'Pt': { symbol: 'Pt', name: 'Platinum', atomicNumber: 78, density: 21450, compressibility: 3.6e-12, color: '#e2e8f0', concentration_mg_per_L: 0.0000005, pricePerKg: 30000 },
    'Ag': { symbol: 'Ag', name: 'Silver', atomicNumber: 47, density: 10490, compressibility: 1.0e-11, color: '#cbd5e1', concentration_mg_per_L: 0.0003, pricePerKg: 750 },
    'Cu': { symbol: 'Cu', name: 'Copper', atomicNumber: 29, density: 8960, compressibility: 7.3e-12, color: '#d97706', concentration_mg_per_L: 0.0009, pricePerKg: 8.5 },
    'U': { symbol: 'U', name: 'Uranium', atomicNumber: 92, density: 19050, compressibility: 8.9e-12, color: '#22c55e', concentration_mg_per_L: 0.0033, pricePerKg: 130 },
    'Li': { symbol: 'Li', name: 'Lithium', atomicNumber: 3, density: 534, compressibility: 8.5e-11, color: '#fca5a5', concentration_mg_per_L: 0.17, pricePerKg: 15 },
    'Nd': { symbol: 'Nd', name: 'Neodymium', atomicNumber: 60, density: 7010, compressibility: 3.1e-11, color: '#c084fc', concentration_mg_per_L: 0.00028, pricePerKg: 50 },
    'Ta': { symbol: 'Ta', name: 'Tantalum', atomicNumber: 73, density: 16690, compressibility: 5.0e-12, color: '#94a3b8', concentration_mg_per_L: 0.000002, pricePerKg: 150 },
    'W': { symbol: 'W', name: 'Tungsten', atomicNumber: 74, density: 19250, compressibility: 3.2e-12, color: '#475569', concentration_mg_per_L: 0.0001, pricePerKg: 35 },
    'Pd': { symbol: 'Pd', name: 'Palladium', atomicNumber: 46, density: 12023, compressibility: 5.3e-12, color: '#f1f5f9', concentration_mg_per_L: 0.0000005, pricePerKg: 35000 }
};

// --- PHYSICS CALCULATIONS ---

// 1. Calculate Wavelength (lambda = c / f)
export const calculateWavelength = (speedOfSound: number, frequencyHz: number): number => {
    return speedOfSound / frequencyHz;
};

// 2. Gor'kov Contrast Factor (Phi_G)
// Phi_G = (ρ_p - ρ_f) / (ρ_p + 2ρ_f)  -  (κ_p - κ_f) / κ_f
export const calculateGorkovContrast = (
    particleDensity: number, fluidDensity: number,
    particleCompressibility: number, fluidCompressibility: number
): number => {
    const densityTerm = (particleDensity - fluidDensity) / (particleDensity + 2 * fluidDensity);
    const compressibilityTerm = (particleCompressibility - fluidCompressibility) / fluidCompressibility;
    return densityTerm - compressibilityTerm;
};

// 3. Acoustic Radiation Force Approximation (1D)
// F_ARF is proportional to Phi_G * sin(2kz), pushing particles to nodes if Phi_G > 0
export const calculateAcousticForceVector = (
    z: number, // Normalized position (0 to 1) between two antinodes
    wavelength: number,
    phiG: number,
    amplitudeMultiplier: number
): number => {
    // k = 2 * PI / wavelength
    const k = (2 * Math.PI) / wavelength;
    // We simplify the massive constant block into an amplitude multiplier for the visualization
    return -amplitudeMultiplier * phiG * Math.sin(2 * k * z);
};
