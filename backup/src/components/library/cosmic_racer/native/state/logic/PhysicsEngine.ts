/**
 * PHYSICS ENGINE
 * 
 * Provides generalized physical property estimation for celestial bodies
 * based on their orbital tier, radius, and available metadata.
 */

export class PhysicsEngine {
    // ── CONSTANTS ──
    static readonly EARTH_MASS_KG = 5.972e24;
    static readonly EARTH_RADIUS_KM = 6371;
    static readonly JUPITER_MASS_KG = 1.898e27;
    static readonly JUPITER_RADIUS_KM = 69911;
    static readonly SUN_MASS_KG = 1.989e30;
    
    // ── DENSITY GRADIENTS (g/cm³) ──
    static readonly DENSITY_INNER_ROCK = 5.5; // Earth-like
    static readonly DENSITY_MARS_LIKE = 3.9;
    static readonly DENSITY_ASTEROID = 2.5;
    static readonly DENSITY_GAS_GIANT = 1.3;
    static readonly DENSITY_ICE_GIANT = 1.6;
    static readonly DENSITY_ICE = 1.0;
    static readonly DENSITY_POROUS_ICE = 0.6; // Comets/Small Moons

    /**
     * Estimates the physical properties of a body based on its orbital parameters and type.
     * @param radius_au Distance from primary (or Sun)
     * @param type Object type (Planet, Moon, Asteroid, etc.)
     * @param tier Precision Tier (1-3) - Higher tiers usually imply smaller objects
     */
    static calculatePhysicalProperties(radius_au: number, type: string, tier: number = 1) {
        const diameter_km = this.estimateDiameter(radius_au, type, tier);
        const { density_gcm3, composition } = this.estimateDensityAndComposition(radius_au, type);

        const radius_cm = (diameter_km / 2) * 100000;
        const volume_cm3 = (4/3) * Math.PI * Math.pow(radius_cm, 3);
        const mass_kg = (volume_cm3 * density_gcm3) / 1000; // g -> kg

        const em_field_tesla = this.estimateEMField(mass_kg, type, radius_au);

        return {
            diameter_km,
            mass_kg,
            density_gcm3,
            composition,
            electromagnetic_field_tesla: em_field_tesla
        };
    }

    /**
     * Heuristic for object size based on Type and Location
     */
    private static estimateDiameter(radius_au: number, type: string, tier: number): number {
        if (type === 'Star' || type === 'Binary Star') return 1_000_000;
        
        let baseSize = 0;
        
        switch (type) {
            case 'Planet':
                if (radius_au > 5 && radius_au < 30) baseSize = 50000;
                else if (radius_au < 2) baseSize = 6000;
                else baseSize = 10000;
                break;
            case 'Dwarf Planet':
                baseSize = 1500;
                break;
            case 'Moon':
                baseSize = 500;
                break;
            case 'Asteroid':
            case 'TNO':
            case 'Centaur':
                baseSize = 100;
                break;
            case 'Comet':
                baseSize = 10;
                break;
            default:
                baseSize = 50; 
        }

        if (tier === 2) baseSize *= 0.1;
        if (tier >= 3) baseSize *= 0.01;

        if (baseSize < 1) baseSize = 1;

        return baseSize;
    }

    /**
     * Heuristic for Density & Composition based on Solar System location
     */
    private static estimateDensityAndComposition(radius_au: number, type: string): { density_gcm3: number, composition: string } {
        if (type === 'Star') return { density_gcm3: 1.4, composition: 'Hydrogen, Helium Plasma' };
        if (type === 'Neutron Star') return { density_gcm3: 1e14, composition: 'Neutron Degenerate Matter' };
        if (type === 'Black Hole') return { density_gcm3: 1e18, composition: 'Singularity' };

        let density = 1.0;
        let comp = 'Unknown';

        if (radius_au < 2.0) {
             density = this.DENSITY_INNER_ROCK;
             comp = 'Silicates, Iron, Nickel';
             if (type === 'Asteroid') {
                  density = this.DENSITY_MARS_LIKE;
                  comp = 'Stony, Carbonaceous';
             }
        } 
        else if (radius_au >= 2.0 && radius_au < 5.0) {
            density = 2.8;
            comp = 'Carbonaceous, Silicates, Ice Traces';
        }
        else if (radius_au >= 5.0 && radius_au < 15.0) {
            if (type === 'Planet' || type === 'Star') {
                density = this.DENSITY_GAS_GIANT;
                comp = 'Hydrogen, Helium';
            } else {
                density = 1.2;
                comp = 'Water Ice, Silicates, Tholins';
            }
        }
        else if (radius_au >= 15.0 && radius_au < 30.0) {
            if (type === 'Planet' || type === 'Star') {
                density = this.DENSITY_ICE_GIANT;
                comp = 'Ices (Water, Ammonia, Methane), Rock';
            } else {
                density = 1.5;
                comp = 'Water Ice, Rock, Nitrogen Ice';
            }
        }
        else {
            density = 1.8;
            comp = 'Nitrogen Ice, Water Ice, Rock';
            
            if (type === 'Comet' || type === 'TNO') {
                density = 1.0;
                comp = 'Porous Ice, Dust, Tholins';
            }
        }

        if (type === 'Moon') {
            density *= 0.8;
            if (density < 0.6) density = 0.6;
        }

        return { density_gcm3: Number(density.toFixed(3)), composition: comp };
    }

    private static estimateEMField(mass_kg: number, type: string, radius_au: number): number {
        if (type !== 'Planet' && type !== 'Star') return 0;

        const massRatio = mass_kg / this.EARTH_MASS_KG;
        
        if (massRatio > 100) return 4e-4;
        if (massRatio > 10) return 2e-5;
        if (massRatio > 0.5) return 3e-5;
        if (massRatio > 0.05) return 1e-9;

        return 0;
    }

    static calculateHarmonicProperties(radius_au: number, level: number, tier: number) {
        const phi = 1.618033988749895;
        let density = 5.514 * Math.pow(radius_au, -phi / 2);

        let composition = "Unknown Resonance";
        if (density > 4.0) composition = "Dense Core (Fe, Ni, Si, O)";
        else if (density > 2.5) composition = "Rocky Mantle (Silicates, C)";
        else if (density > 1.0) composition = "Gas Giant (H, He, NH3)";
        else composition = "Icy/Porous Volatiles";

        if (tier > 1) {
            density *= 0.8;
            composition += " Fragment";
        }

        const terrestrialWave = 1.0 * Math.exp(-Math.pow(Math.log(radius_au / 0.9), 2) / 0.15);
        const jovianDiv = radius_au < 5.2 ? 0.08 : 0.3;
        const jovianWave = 317 * Math.exp(-Math.pow(Math.log(radius_au / 5.2), 2) / jovianDiv);
        const iceWave = 15 * Math.exp(-Math.pow(Math.log(radius_au / 25), 2) / 0.5);
        
        let mass_earth_masses = terrestrialWave + jovianWave + iceWave;
        
        if (mass_earth_masses < 1e-10) {
            mass_earth_masses = 1e-10 * Math.pow(radius_au, 1.5);
            if (mass_earth_masses < 1e-20) mass_earth_masses = 1e-20; 
        }

        mass_earth_masses = mass_earth_masses / Math.pow(10, tier - 1);
        const mass_kg = mass_earth_masses * this.EARTH_MASS_KG;

        let b_field = 3e-5 * mass_earth_masses * Math.pow(radius_au, -phi);
        if (b_field < 1e-25) b_field = 1e-25;

        return {
            mass_kg: mass_kg,
            density_gcm3: Number(density.toFixed(2)),
            composition: composition,
            electromagnetic_field_tesla: b_field
        };
    }
}

export const OCTAVE_COLORS: Record<number, string> = {
    0: '#22d3ee', // Cyan (Macro)
    1: '#22d3ee',
    2: '#6366f1', // Indigo (Planetary)
    3: '#8b5cf6', // Violet
    4: '#a855f7', // Purple
    5: '#d946ef', // Fuchsia
    6: '#ec4899', // Pink
    7: '#f43f5e', // Rose (Micro)
    8: '#fbbf24', // Amber
    9: '#f59e0b', // Orange
    10: '#ea580c', // Orange-Red
    11: '#ef4444', // Red (Nano)
    12: '#dc2626',
    13: '#b91c1c',
    14: '#991b1b'
};
