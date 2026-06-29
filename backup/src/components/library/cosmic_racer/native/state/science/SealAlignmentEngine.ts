/**
 * Solomon's 44 Planetary Pentacles - Alignment Configuration Engine
 * 
 * Maps the 44 "Pentacles" (Hardware Resonators) to the 23-character 
 * Meroitic/KJV 1611 root linguistic phase-shift gears.
 * 
 * Simulates how the combination of 44 static plates and 23 rotor teeth 
 * perfectly aligns with the Golden Ratio orbital resonance of the Cosmic Compass.
 */

// 1. The 44 Hardware Plates (The Pentacles)
export interface PlanetarySeal {
    id: string;
    planet: string;
    count: number; // Number of pentacles for this planet
    metal: string; // The physical resonance medium (conductor)
    function: string; // The network protocol it executes
    baseFrequencyHz: number; // Derived from Octave 11 orbital resonance
}

export const THE_44_PENTACLES: PlanetarySeal[] = [
    { id: "SAT", planet: "Saturn", count: 7, metal: "Lead", function: "Restriction / Signal Dampener (Faraday Cage)", baseFrequencyHz: 147.85 },
    { id: "JUP", planet: "Jupiter", count: 7, metal: "Tin", function: "Expansion / Bandwidth Multiplier", baseFrequencyHz: 183.58 },
    { id: "MAR", planet: "Mars", count: 7, metal: "Iron", function: "Protection / Harmonic Shielding", baseFrequencyHz: 144.72 },
    { id: "SUN", planet: "Sun", count: 6, metal: "Gold", function: "Power / Central Node Processor", baseFrequencyHz: 126.22 },
    { id: "VEN", planet: "Venus", count: 5, metal: "Copper", function: "Attraction / Signal Receiver", baseFrequencyHz: 221.23 },
    { id: "MER", planet: "Mercury", count: 5, metal: "Mercury/Alloy", function: "Communication / High-Speed Transmission", baseFrequencyHz: 141.27 },
    { id: "MOO", planet: "Moon", count: 6, metal: "Silver", function: "Reflection / Refraction Relay", baseFrequencyHz: 210.42 },
    // 7+7+7+6+5+5+6 = 43. The 44th is the "Great Pentacle" (The Master Key)
    { id: "MSTR", planet: "Universal", count: 1, metal: "Electrum", function: "Master Sync / Theurgia Gateway", baseFrequencyHz: 432.00 }
];

// 2. The 23 Rotor Teeth (The Linguistic Code)
// Mapping the Meroitic / KJV 1611 23-letter alphabet as phase shift gears
// Phase shifts are offset by Phi (1.618) to simulate the Antikythera irrational gear drift.
const PHI = 1.618033988749895;

export const generateRotorTeeth = () => {
    const teeth = [];
    let currentPhase = 0;
    for (let i = 0; i < 23; i++) {
        teeth.push({
            toothIndex: i + 1,
            phaseShiftDegrees: currentPhase % 360,
            resonanceMultiplier: 1 + (i * (PHI - 1) / 23)
        });
        currentPhase += (360 / 23) * PHI; // Irrational step size
    }
    return teeth;
};

export const ROTOR_23_TEETH = generateRotorTeeth();

// 3. The Alignment Engine
export interface AlignmentResult {
    seal: PlanetarySeal;
    rotorTooth: number;
    alignedFrequency: number;
    phaseMarginOfError: number;
    isResonant: boolean;
}

/**
 * Calculates the harmonic alignment of a specific seal against a specific rotor tooth.
 * In a perfect machine, certain alignments will strike a pure phi-resonance (Margin < 0.01)
 */
export const calculateAlignment = (sealId: string, toothIndex: number): AlignmentResult | null => {
    const seal = THE_44_PENTACLES.find(s => s.id === sealId);
    const tooth = ROTOR_23_TEETH.find(t => t.toothIndex === toothIndex);

    if (!seal || !tooth) return null;

    // The physical frequency of the metal plate multiplied by the linguistic gear tooth
    const activeFrequency = seal.baseFrequencyHz * tooth.resonanceMultiplier;
    
    // Check if the resulting frequency is a harmonic of Phi (Base 432 scaled by Phi)
    const phiTarget = 432 / Math.pow(PHI, Math.floor(Math.log(432/activeFrequency) / Math.log(PHI)));
    const error = Math.abs(activeFrequency - phiTarget);

    return {
        seal,
        rotorTooth: toothIndex,
        alignedFrequency: activeFrequency,
        phaseMarginOfError: error,
        isResonant: error < 1.0 // If the error is less than 1Hz, the components have "locked"
    };
};

/**
 * Sweeps all 44 Pentacles across all 23 Rotor Teeth to find the master Cosmic Alignments
 */
export const findMasterAlignments = () => {
    const alignments: AlignmentResult[] = [];
    
    THE_44_PENTACLES.forEach(seal => {
        // Since there are multiple versions of each planet's pentacle, we simulate 
        // passing through the rotor for EACH unique pentacle geometry.
        for (let p = 1; p <= seal.count; p++) {
            ROTOR_23_TEETH.forEach(tooth => {
                const align = calculateAlignment(seal.id, tooth.toothIndex);
                if (align && align.isResonant) {
                    alignments.push({
                        ...align,
                        seal: { ...align.seal, function: `${align.seal.function} (Seal v${p})` }
                    });
                }
            });
        }
    });

    return alignments;
};
