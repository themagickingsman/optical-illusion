// Geometric Assets Data Structure (CPM Configuration)
export type GeometricAsset = {
    level: number;
    name: string;
    description: string;
    source?: string;
    k_L: number; // Scaling Constant
    frequency: number; // Frequency (Hz)
    identity: string;
    color: string;
};

export const CPM_ASSETS: Record<string, GeometricAsset> = {
    TETRAHEDRON: {
        level: 1,
        name: 'Tetrahedron',
        description: 'High volume, low individual value. The basic building block.',
        source: 'Mined from common green asteroids in outer Octaves 12-15.',
        k_L: 1.51e-63,
        frequency: 0.16,
        identity: 'The Penny',
        color: '#22d3ee'
    },
    CUBE: {
        level: 10,
        name: 'Cube',
        description: 'Foundation of structural upgrades.',
        source: 'Mined from dense blue asteroids in mid-rim Octaves 10-14.',
        k_L: 4.37e-31,
        frequency: 0.68,
        identity: 'The Brick',
        color: '#38bdf8'
    },
    ICOSAHEDRON: {
        level: 30,
        name: 'Icosahedron',
        description: 'High-velocity utility for speed and fuel.',
        source: 'Extracted from rare violet anomalies in Octaves 8-12.',
        k_L: 2.24e-13,
        frequency: 1.78,
        identity: 'The Fuel',
        color: '#8b5cf6'
    },
    DODECAHEDRON: {
        level: 50,
        name: 'Dodecahedron',
        description: 'Store of value for mid-tier engineering.',
        source: 'Forged in the extreme pressures of inner core Octaves 5-9.',
        k_L: 0.388,
        frequency: 4.66,
        identity: 'The Reserve',
        color: '#a855f7'
    },
    FLOWER_OF_LIFE: {
        level: 100,
        name: 'Flower of Life',
        description: 'Whale-tier infrastructure component.',
        source: 'Synthesized from pure dimensional resonance in Octaves 1-4.',
        k_L: 4.37e19,
        frequency: 31.94,
        identity: 'The Bank',
        color: '#ec4899'
    },
    RARE: {
        level: 80,
        name: 'Tier 6 Rare Mineral',
        description: 'Trans-dimensional isotope found only in Octave 13.',
        source: 'Found exclusively circulating anomalous rifts in Octave 13.',
        k_L: 1.12e12,
        frequency: 18.4,
        identity: 'The Catalyst',
        color: '#fcd34d'
    }
};

// Calculate Resonance Price: Sum of (count * frequency * k_L)
export function calculateResonancePrice(requirements: { asset: string; count: number }[]): number {
    return requirements.reduce((total, req) => {
        const asset = CPM_ASSETS[req.asset];
        if (!asset) return total;
        return total + (req.count * asset.frequency * asset.k_L);
    }, 0);
}

export interface MarketItem {
    id: string;
    name: string;
    type: string;
    octave?: number;
    requirements: { asset: string; count: number }[];
}



// The 15 Cosmic Compass Octaves
export const OCTAVES = [
    { id: 1, name: 'The Void', role: 'Scout / Recon', focus: 'Speed & Stealth' },
    { id: 2, name: 'Quantum', role: 'Data / Cyber', focus: 'Electronic Warfare' },
    { id: 3, name: 'Material', role: 'Extraction', focus: 'Mining & Tractor' },
    { id: 4, name: 'Chemical', role: 'Refining', focus: 'Synthesis' },
    { id: 5, name: 'Structure', role: 'Logistics', focus: 'Massive Cargo' },
    { id: 6, name: 'Biological', role: 'Bio-Harvester', focus: 'Organic Processing' },
    { id: 7, name: 'Kinetic', role: 'Interceptor', focus: 'Agility & Combat' },
    { id: 8, name: 'Electromagnetic', role: 'Energy Weapons', focus: 'Shields & EMP' },
    { id: 9, name: 'Thermodynamic', role: 'Heavy Ordnance', focus: 'Plasma & Heat' },
    { id: 10, name: 'Planetary', role: 'Orbital Strike', focus: 'Siege Warfare' },
    { id: 11, name: 'Stellar', role: 'Solar Harvester', focus: 'Energy Collection' },
    { id: 12, name: 'Galactic', role: 'Cruiser', focus: 'Deep Space Patrol' },
    { id: 13, name: 'Quasar', role: 'Carrier', focus: 'Fighter Deployment' },
    { id: 14, name: 'Universal', role: 'Dreadnought', focus: 'Fleet Command' },
    { id: 15, name: 'Source', role: 'Titan', focus: 'Ultimate Annihilation' }
];

// Generate 17 ships per octave (15 * 17 = 255 Ships)
const generateShips = () => {
    const generatedShips: Record<string, any>[] = [];
    OCTAVES.forEach((octave, oIdx) => {
        // Base scaling by octave level
        const baseCost = Math.pow(2, oIdx); 
        
        for (let i = 1; i <= 17; i++) {
            generatedShips.push({
                id: `ship_o${octave.id}_v${i}`,
                name: `${octave.name} ${octave.role} Mk-${i}`,
                octave: octave.id,
                tier: `Octave ${octave.id} (${octave.name})`,
                role: octave.role,
                description: `A specialized ${octave.focus.toLowerCase()} vessel operating within Octave ${octave.id} resonance fields. Configuration ${i}/17.`,
                attributes: {
                    speed: oIdx < 5 ? 'High' : (oIdx < 10 ? 'Medium' : 'Low'),
                    cargo: oIdx >= 4 && oIdx <= 6 ? 'Massive' : (oIdx > 10 ? 'High' : 'Low'),
                    combat: oIdx >= 7 && oIdx <= 9 ? 'High' : (oIdx > 12 ? 'Massive' : 'Low'),
                    mining: oIdx === 3 ? 'Massive' : 'None'
                },
                // Procedurally scale requirements to ALWAYS have exactly 5 slots (like buildings)
                requirements: [
                    { asset: 'TETRAHEDRON', count: Math.floor(50000 * baseCost * (1 + (i * 0.1))) },
                    { asset: 'CUBE', count: Math.floor(1000 * Math.max(1, oIdx) * baseCost * (1 + (i * 0.1))) },
                    { asset: 'ICOSAHEDRON', count: Math.floor(250 * Math.max(1, oIdx - 2) * baseCost * (1 + (i * 0.1))) },
                    { asset: 'DODECAHEDRON', count: Math.floor(50 * Math.max(1, oIdx - 4) * baseCost * (1 + (i * 0.1))) },
                    { asset: 'FLOWER_OF_LIFE', count: Math.floor(5 * Math.max(1, oIdx - 6) * baseCost * (1 + (i * 0.1))) }
                ]
            });
        }
    });
    return generatedShips;
};

export const ALL_SHIPS = generateShips();

// Base Buildings with 5 material slots required for construction
export const BASE_BUILDINGS: Record<string, any> = {
    'Headquarters': {
        id: 'build_hq', name: 'Headquarters', description: 'Manage finance, manage resources, buy equipment',
        requirements: [ {asset: 'TETRAHEDRON', count: 100000}, {asset: 'CUBE', count: 5000}, {asset: 'ICOSAHEDRON', count: 250}, {asset: 'DODECAHEDRON', count: 10}, {asset: 'FLOWER_OF_LIFE', count: 1} ]
    },
    'Barracks': {
        id: 'build_barracks', name: 'Barracks', description: 'Train soldiers for Galactic ship duty',
        requirements: [ {asset: 'TETRAHEDRON', count: 75000}, {asset: 'CUBE', count: 3000}, {asset: 'ICOSAHEDRON', count: 100}, {asset: 'DODECAHEDRON', count: 5}, {asset: 'FLOWER_OF_LIFE', count: 1} ]
    },
    'Forge': {
        id: 'build_forge', name: 'Forge', description: 'Create weapons and gadgets',
        requirements: [ {asset: 'TETRAHEDRON', count: 85000}, {asset: 'CUBE', count: 4000}, {asset: 'ICOSAHEDRON', count: 150}, {asset: 'DODECAHEDRON', count: 8}, {asset: 'FLOWER_OF_LIFE', count: 1} ]
    },
    'Ship Builder': {
        id: 'build_ship_builder', name: 'Ship Builder', description: 'Build new ships',
        requirements: [ {asset: 'TETRAHEDRON', count: 120000}, {asset: 'CUBE', count: 8000}, {asset: 'ICOSAHEDRON', count: 400}, {asset: 'DODECAHEDRON', count: 15}, {asset: 'FLOWER_OF_LIFE', count: 2} ]
    },
    'Planet Council': {
        id: 'build_council', name: 'Planet Council', description: 'Diplomacy, trade, alliances',
        requirements: [ {asset: 'TETRAHEDRON', count: 50000}, {asset: 'CUBE', count: 2000}, {asset: 'ICOSAHEDRON', count: 50}, {asset: 'DODECAHEDRON', count: 3}, {asset: 'FLOWER_OF_LIFE', count: 1} ]
    },
    'Resource Production': {
        id: 'build_resource', name: 'Resource Production', description: 'Base component manufacturing',
        requirements: [ {asset: 'TETRAHEDRON', count: 60000}, {asset: 'CUBE', count: 2500}, {asset: 'ICOSAHEDRON', count: 80}, {asset: 'DODECAHEDRON', count: 4}, {asset: 'FLOWER_OF_LIFE', count: 1} ]
    }
};

