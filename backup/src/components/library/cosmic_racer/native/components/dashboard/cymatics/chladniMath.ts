// chladniMath.ts

/**
 * Hybrid Physical-Mathematical Chladni Engine
 * 
 * Accurately maps the dynamic geometrical topology (n, m) of a physical 1'x1' 
 * Chladni metal plate driven at the center. Combines theoretical continuity 
 * with undeniable observed experimental realities (anchors).
 */

export const BRUSSPUP_BENCHMARKS = [
    { baseHz: 7.83, n: 1, m: 1, sign: 1 },  // Cosmic Compass Fundamental
    { baseHz: 345, n: 3, m: 4, sign: 1 },  // 4-Sided Star w/ Inner Square
    { baseHz: 1033, n: 1, m: 2, sign: -1 }, // Foundation Cross
    { baseHz: 1820, n: 1, m: 3, sign: 1 }, // 3x3 Grid
    { baseHz: 2041, n: 1, m: 4, sign: -1 }, // 4x4 Grid
    { baseHz: 2465, n: 2, m: 3, sign: 1 }, // Grid Ring
    { baseHz: 2828, n: 2, m: 4, sign: -1 }, // Cellular
    { baseHz: 3349, n: 4, m: 5, sign: 1 }, // Hex Grid (Distinct from 345 Hz)
    { baseHz: 3975, n: 3, m: 5, sign: -1 }  // Diamond Grid
];

export const getChladniModes = (hz: number) => {
    // 1. Exact Match Handling
    const exactMatch = BRUSSPUP_BENCHMARKS.find(b => Math.abs(b.baseHz - hz) < 0.5);
    if (exactMatch) {
        return { n: exactMatch.n, m: exactMatch.m, sign: exactMatch.sign };
    }

    // 2. Physical Interpolation Handling
    // If the input frequency is not an exact known empirical anchor, we mathematically
    // interpolate between the two closest known physical bounds to simulate the metallic stretch.
    let lowerAnchor = BRUSSPUP_BENCHMARKS[0];
    let upperAnchor = BRUSSPUP_BENCHMARKS[BRUSSPUP_BENCHMARKS.length - 1];
    let isExtrapolating = false;

    if (hz < lowerAnchor.baseHz) {
        // Below lowest known bound (Base resonance approaching 0)
        upperAnchor = lowerAnchor;
        lowerAnchor = { baseHz: 0.1, n: 0.1, m: 0.1, sign: 1 };
    } else if (hz > upperAnchor.baseHz) {
        // Above highest known bound
        lowerAnchor = upperAnchor;
        isExtrapolating = true;
    } else {
        // Find surrounding bounds
        for (let i = 0; i < BRUSSPUP_BENCHMARKS.length - 1; i++) {
            if (hz >= BRUSSPUP_BENCHMARKS[i].baseHz && hz <= BRUSSPUP_BENCHMARKS[i + 1].baseHz) {
                lowerAnchor = BRUSSPUP_BENCHMARKS[i];
                upperAnchor = BRUSSPUP_BENCHMARKS[i + 1];
                break;
            }
        }
    }

    // 3. Mathematical Blending
    let interpN, interpM;
    
    if (isExtrapolating) {
        // Linear scaling based on final empirical ratio
        const freqRatio = hz / upperAnchor.baseHz;
        interpN = upperAnchor.n * Math.sqrt(freqRatio);
        interpM = upperAnchor.m * Math.sqrt(freqRatio);
    } else {
        // Interpolate exactly between boundaries
        const range = upperAnchor.baseHz - lowerAnchor.baseHz;
        const mappedProgress = (hz - lowerAnchor.baseHz) / range;
        
        interpN = lowerAnchor.n + mappedProgress * (upperAnchor.n - lowerAnchor.n);
        interpM = lowerAnchor.m + mappedProgress * (upperAnchor.m - lowerAnchor.m);
    }

    // Default to the sign phase of the closest lower physical anchor to maintain additive/subtractive logic
    const sign = lowerAnchor.sign;

    return { 
        n: Number(interpN.toFixed(3)), 
        m: Number(interpM.toFixed(3)), 
        sign 
    };
};
