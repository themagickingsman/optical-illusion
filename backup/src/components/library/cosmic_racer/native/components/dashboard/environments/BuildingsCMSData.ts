import { useState, useEffect } from 'react';

export interface BuildingArchetype {
    id: string;             // Raw tracking ID (e.g. "struct_hq")
    name: string;           // Display Name (e.g. "Headquarters")
    description: string;    // Display Description
    category: string;       // Legacy category mapping (e.g. "Headquarters", "Docking Station")

    // Construction Logic
    costCredits: number;    // Octave 11 Photons or base currency
    costMinerals: number;   // Raw ore requirement
    costFood: number;       // Agricultural requirement
    costPopulation: number; // Labor requirement
    buildTimeSec: number;   // Seconds to construct natively

    // Operational Bounds
    powerDraw: number;      // Negative = draws power, Positive = generates power
    populationCapacity: number; 
    foodGeneration: number;

    // GPU Engine Rendering Properties
    meshColor: string;
    geometryType: 'CYLINDER' | 'BOX' | 'SPHERE' | 'HEXAGON_PRISM';
    scaleRadius: number;    // Multiplier against hexSize
    scaleHeight: number;    // Height in WebGL Units
}

// 1:1 Parity Mapping from the hardcoded AsteroidsGame HexBuildingMenu logic
export const DEFAULT_BUILDINGS_DB: BuildingArchetype[] = [
    { id: "struct_hq", name: "Headquarters", description: "Provides +25 Starting Colonists. Minimum Workers: 5. Provides Base Population Cap (+10). Drains -30 ⚡/s", category: "Headquarters", costCredits: 2100, costMinerals: 0, costFood: 0, costPopulation: 5, buildTimeSec: 25, powerDraw: 30, populationCapacity: 10, foodGeneration: 0, meshColor: "#38bdf8", geometryType: "HEXAGON_PRISM", scaleRadius: 0.8, scaleHeight: 40 },
    { id: "struct_power_plant", name: "Power Plant", description: "Minimum Workers: 10. Generates +50 ⚡/s", category: "Power Plant", costCredits: 500, costMinerals: 0, costFood: 0, costPopulation: 10, buildTimeSec: 10, powerDraw: -50, populationCapacity: 0, foodGeneration: 0, meshColor: "#ef4444", geometryType: "BOX", scaleRadius: 0.6, scaleHeight: 20 },
    { id: "struct_hydroponics", name: "Hydroponics Farm", description: "Minimum Workers: 10. Produces +5 🌾/s. Drains -10 ⚡/s", category: "Hydroponics Farm", costCredits: 800, costMinerals: 0, costFood: 0, costPopulation: 10, buildTimeSec: 15, powerDraw: 10, populationCapacity: 0, foodGeneration: 5, meshColor: "#4ade80", geometryType: "CYLINDER", scaleRadius: 0.7, scaleHeight: 15 },
    { id: "struct_research", name: "Research Lab", description: "Minimum Workers: 20. Produces +5 ⚛️/s. Drains -20 ⚡/s", category: "Research Lab", costCredits: 1300, costMinerals: 0, costFood: 0, costPopulation: 20, buildTimeSec: 20, powerDraw: 20, populationCapacity: 0, foodGeneration: 0, meshColor: "#3b82f6", geometryType: "BOX", scaleRadius: 0.8, scaleHeight: 30 },
    { id: "struct_residential", name: "Residential Quarters", description: "Houses civilian population. Provides Population Cap (+100). Drains -5 ⚡/s", category: "Residential Quarters", costCredits: 800, costMinerals: 0, costFood: 100, costPopulation: 0, buildTimeSec: 15, powerDraw: 5, populationCapacity: 100, foodGeneration: 0, meshColor: "#a78bfa", geometryType: "BOX", scaleRadius: 0.7, scaleHeight: 25 },
    { id: "struct_barracks", name: "Barracks", description: "Minimum Workers: 20. Trains Planetary Defense Troops. Drains -10 ⚡/s", category: "Barracks", costCredits: 5500, costMinerals: 0, costFood: 890, costPopulation: 20, buildTimeSec: 30, powerDraw: 10, populationCapacity: 0, foodGeneration: 0, meshColor: "#ef4444", geometryType: "BOX", scaleRadius: 0.9, scaleHeight: 20 },
    { id: "struct_recharge", name: "Recharge Station", description: "Minimum Workers: 15. Orbital refueling matrix. Drains -20 ⚡/s.", category: "Recharge Station", costCredits: 8900, costMinerals: 0, costFood: 0, costPopulation: 15, buildTimeSec: 25, powerDraw: 20, populationCapacity: 0, foodGeneration: 0, meshColor: "#facc15", geometryType: "CYLINDER", scaleRadius: 0.5, scaleHeight: 35 },
    { id: "struct_storage", name: "Storage Silo", description: "Minimum Workers: 5. Expands planetary cargo capacity by +15,000 slots. Drains -5 ⚡/s.", category: "Storage Silo", costCredits: 2100, costMinerals: 0, costFood: 0, costPopulation: 5, buildTimeSec: 15, powerDraw: 5, populationCapacity: 0, foodGeneration: 0, meshColor: "#475569", geometryType: "CYLINDER", scaleRadius: 0.8, scaleHeight: 40 },
    { id: "struct_docking", name: "Docking Station", description: "Minimum Workers: 25. Permits physical Ship Hangar Swapping on this planet. Drains -40 ⚡/s.", category: "Docking Station", costCredits: 8900, costMinerals: 0, costFood: 0, costPopulation: 25, buildTimeSec: 40, powerDraw: 40, populationCapacity: 0, foodGeneration: 0, meshColor: "#3b82f6", geometryType: "SPHERE", scaleRadius: 0.9, scaleHeight: 20 },
    { id: "struct_market", name: "Marketplace", description: "Minimum Workers: 10. Global Trading Hub for exchanging materials and modules. Drains -15 ⚡/s.", category: "Marketplace", costCredits: 3400, costMinerals: 0, costFood: 0, costPopulation: 10, buildTimeSec: 20, powerDraw: 15, populationCapacity: 0, foodGeneration: 0, meshColor: "#f59e0b", geometryType: "HEXAGON_PRISM", scaleRadius: 0.7, scaleHeight: 15 },
    { id: "struct_fuel_res", name: "Fuel Resonator", description: "Minimum Workers: 50. Projects structural integrity, doubling global Ship Fuel Range. Drains -50 ⚡/s.", category: "Fuel Resonator", costCredits: 14400, costMinerals: 0, costFood: 0, costPopulation: 50, buildTimeSec: 45, powerDraw: 50, populationCapacity: 0, foodGeneration: 0, meshColor: "#c084fc", geometryType: "CYLINDER", scaleRadius: 0.6, scaleHeight: 50 },
    { id: "struct_shield", name: "Shield Generator", description: "Minimum Workers: 100. Projects a planetary defense grid. Drains -100 ⚡/s.", category: "Shield Generator", costCredits: 23300, costMinerals: 0, costFood: 0, costPopulation: 100, buildTimeSec: 60, powerDraw: 100, populationCapacity: 0, foodGeneration: 0, meshColor: "#06b6d4", geometryType: "SPHERE", scaleRadius: 0.8, scaleHeight: 30 },
    { id: "struct_stabilizer", name: "Stabilizer Node", description: "Minimum Workers: 200. Anchors the planetary shield to the sub-atomic realm. Drains -250 ⚡/s.", category: "Stabilizer Node", costCredits: 37700, costMinerals: 0, costFood: 0, costPopulation: 200, buildTimeSec: 90, powerDraw: 250, populationCapacity: 0, foodGeneration: 0, meshColor: "#d946ef", geometryType: "HEXAGON_PRISM", scaleRadius: 0.5, scaleHeight: 60 },
    { id: "struct_dyson", name: "Dyson Node", description: "Minimum Workers: 500. Massive stellar energy lattice frame. Drains -1000 ⚡/s.", category: "Dyson Node", costCredits: 61000, costMinerals: 0, costFood: 0, costPopulation: 500, buildTimeSec: 120, powerDraw: 1000, populationCapacity: 0, foodGeneration: 0, meshColor: "#eab308", geometryType: "SPHERE", scaleRadius: 1.2, scaleHeight: 80 }
];

export function useBuildingsCMS() {
    const [buildingsDB, setBuildingsDB] = useState<BuildingArchetype[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('arn_cms_buildings_db');
            if (stored) {
                setBuildingsDB(JSON.parse(stored));
            } else {
                setBuildingsDB(DEFAULT_BUILDINGS_DB);
            }
        } catch (e) {
            console.error("Failed to load CMS DB", e);
            setBuildingsDB(DEFAULT_BUILDINGS_DB);
        }
    }, []);

    const saveDatabase = (newDB: BuildingArchetype[]) => {
        setBuildingsDB(newDB);
        localStorage.setItem('arn_cms_buildings_db', JSON.stringify(newDB));
        
        // Globally dispatch a custom event if 3D engines need to re-mount immediately
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('arn_cms_buildings_updated'));
        }
    };

    return { buildingsDB, saveDatabase };
}
