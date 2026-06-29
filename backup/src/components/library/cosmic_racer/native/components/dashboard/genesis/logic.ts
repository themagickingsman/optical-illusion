export interface Officer {
    id: string;
    name: string;
    generation: number;
    role: string;
    age: number;          // Enters service at 17
    serviceYears: number; // Max 33 before mandatory retirement
    maxLifespan: number;  // Max 150. If age > 50 but < max, they are in the High Council / Legends Pool
    bondLevel: number;    // Trade alliance standing
    avatar?: string;      // Portrait image path
    stats: {
        combat: number;
        mining: number;
        speed: number;
    };
    affinities: Record<string, { level: number; xp: number }>;
    mutations: string[];
    parentIdA?: string;
    parentIdB?: string;
}

export const MUTATIONS = [
    { id: "M_VOIDBORN", name: "Voidborn", chance: 0.05, effect: "+50% speed in Octaves 1-3" },
    { id: "M_DEEPMINER", name: "Deep Miner", chance: 0.10, effect: "Double ore extraction" },
    { id: "M_HARMONIC", name: "Harmonic Sight", chance: 0.05, effect: "Reveals hidden nodes" },
    { id: "M_IMMORTAL", name: "Enduring Cells", chance: 0.15, effect: "+30 years max lifespan" },
    { id: "M_DIPLOMAT", name: "Golden Tongue", chance: 0.10, effect: "Double Bond XP rate" }
];

export const GENESIS_CONSTANTS = {
    ENTRY_AGE: 17,
    MANDATORY_RETIREMENT_AGE: 50,
    MAX_SERVICE_YEARS: 33,
    MAX_FEDERATION_AGE: 150,
    BASE_BOND: 0,
    XP_PER_DEPLOY: 10,
    XP_FOR_LEVEL_BUMP: 50 // xp gap per affinity level
};

function generateName(alphaName: string, omegaName: string, generation: number): string {
    const prefixes = ["Arc", "Zae", "Val", "Kael", "Lyra", "Orion", "Nova", "Pax", "Sol", "Voss"];
    const lastNameA = alphaName.split(" ")[1] || alphaName;
    const lastNameB = omegaName.split(" ")[1] || omegaName;
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${Math.random() > 0.5 ? lastNameA : lastNameB} ${'I'.repeat(Math.min(3, generation))}`;
}

export function breedOfficers(alpha: Officer, omega: Officer): Officer {
    const childGen = Math.max(alpha.generation, omega.generation) + 1;
    
    const variance = () => 1.0 + (Math.random() * 0.15);
    const avgStat = (a: number, b: number) => ((a + b) / 2) * variance();
    
    const childAffinities: Record<string, { level: number; xp: number }> = {};
    const allOctaves = new Set([...Object.keys(alpha.affinities), ...Object.keys(omega.affinities)]);
    
    allOctaves.forEach(oct => {
        const aLvl = alpha.affinities[oct]?.level || 0;
        const oLvl = omega.affinities[oct]?.level || 0;
        const inheritedLvl = Math.max(1, Math.floor(Math.max(aLvl, oLvl) + (Math.min(aLvl, oLvl) * 0.2)));
        childAffinities[oct] = { level: inheritedLvl, xp: 0 };
    });

    const childMutations: string[] = [];
    MUTATIONS.forEach(m => {
        if (Math.random() < m.chance) childMutations.push(m.name);
    });

    // Determine Lifespan (weighted towards 80-100, but can hit 150 or tragically 18)
    const baseLifespan = Math.floor(Math.random() * (150 - 18 + 1)) + 18;
    const finalLifespan = Math.min(GENESIS_CONSTANTS.MAX_FEDERATION_AGE, baseLifespan + (childMutations.includes("Enduring Cells") ? 30 : 0));

    return {
        id: `off_${Math.random().toString(36).substr(2, 9)}`,
        name: generateName(alpha.name, omega.name, childGen),
        generation: childGen,
        role: ["Commander", "Tactical", "Engineering", "Science"][Math.floor(Math.random() * 4)],
        age: GENESIS_CONSTANTS.ENTRY_AGE,
        serviceYears: 0,
        maxLifespan: finalLifespan,
        bondLevel: 0, // Must leech from Seniors!
        stats: {
            combat: parseFloat(avgStat(alpha.stats.combat, omega.stats.combat).toFixed(2)),
            mining: parseFloat(avgStat(alpha.stats.mining, omega.stats.mining).toFixed(2)),
            speed: parseFloat(avgStat(alpha.stats.speed, omega.stats.speed).toFixed(2)),
        },
        affinities: childAffinities,
        mutations: childMutations,
        parentIdA: alpha.id,
        parentIdB: omega.id
    };
}
