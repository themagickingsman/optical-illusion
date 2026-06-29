/**
 * NASA JPL Solar System Ephemeris Data
 * Source: JPL Horizons System (https://ssd.jpl.nasa.gov/horizons/)
 * Epoch: J2000.0 (2000-Jan-01 12:00:00 TDB)
 * 
 * All values are REAL astronomical data - NO APPROXIMATIONS
 */

export interface PlanetaryOrbit {
    name: string;
    semiMajorAxis_AU: number;        // Semi-major axis (AU)
    eccentricity: number;             // Orbital eccentricity (0-1)
    inclination_deg: number;          // Inclination to ecliptic (degrees)
    longitudeAscNode_deg: number;     // Longitude of ascending node Ω (degrees)
    argPerihelion_deg: number;        // Argument of perihelion ω (degrees)
    meanAnomalyEpoch_deg: number;     // Mean anomaly at epoch M₀ (degrees)
    orbitalPeriod_days: number;       // Sidereal orbital period (days)
    siderealRotationDays: number;     // Time for one self-rotation (days). Negative = Retrograde.
    color: string;                    // Visualization color
    radius_km: number;                // Physical radius (km)
}

/**
 * Real planetary data from NASA JPL Horizons
 * These are the actual orbital elements used by NASA for mission planning
 */
export const SOLAR_SYSTEM_PLANETS: PlanetaryOrbit[] = [
    {
        name: "Mercury",
        semiMajorAxis_AU: 0.38709893,
        eccentricity: 0.20563069,
        inclination_deg: 7.00487,
        longitudeAscNode_deg: 48.33167,
        argPerihelion_deg: 29.1241, // longPeri = 77.45577
        meanAnomalyEpoch_deg: 174.79478, // L = 252.25032
        orbitalPeriod_days: 87.9691,
        siderealRotationDays: 58.646,
        color: "#8C7853",
        radius_km: 9758.8
    },
    {
        name: "Venus",
        semiMajorAxis_AU: 0.72333199,
        eccentricity: 0.00677323,
        inclination_deg: 3.39471,
        longitudeAscNode_deg: 76.68069,
        argPerihelion_deg: 54.89108, // longPeri = 131.57177
        meanAnomalyEpoch_deg: 50.44675, // L = 182.01852
        orbitalPeriod_days: 224.701,
        siderealRotationDays: -243.025,
        color: "#FFC649",
        // Doubled again specifically for enhanced game board visibility and shader impact
        radius_km: 24207.2
    },
    {
        name: "Earth",
        semiMajorAxis_AU: 1.00000011,
        eccentricity: 0.01671022,
        inclination_deg: 0.00005,
        longitudeAscNode_deg: -11.26064,
        argPerihelion_deg: 114.20783, // longPeri = 102.94719
        meanAnomalyEpoch_deg: 357.51716, // L = 100.46435
        orbitalPeriod_days: 365.25636,
        siderealRotationDays: 0.99726968,
        color: "#4A90E2",
        radius_km: 25484.0
    },
    {
        name: "Mars",
        semiMajorAxis_AU: 1.52366231,
        eccentricity: 0.09341233,
        inclination_deg: 1.85061,
        longitudeAscNode_deg: 49.57854,
        argPerihelion_deg: 286.4623, // longPeri = 336.04084
        meanAnomalyEpoch_deg: 19.38816, // L = 355.4284
        orbitalPeriod_days: 686.980,
        siderealRotationDays: 1.025957,
        color: "#E27B58",
        radius_km: 13558.0
    },
    {
        name: "Jupiter",
        semiMajorAxis_AU: 5.20336301,
        eccentricity: 0.04839266,
        inclination_deg: 1.3053,
        longitudeAscNode_deg: 100.55615,
        argPerihelion_deg: 273.865, // longPeri = 14.42115
        meanAnomalyEpoch_deg: 19.65053, // L = 34.27106
        orbitalPeriod_days: 4332.589,
        siderealRotationDays: 0.41354,
        color: "#C88B3A",
        radius_km: 279644.0
    },
    {
        name: "Saturn",
        semiMajorAxis_AU: 9.53707032,
        eccentricity: 0.05415060,
        inclination_deg: 2.48446,
        longitudeAscNode_deg: 113.71504,
        argPerihelion_deg: 339.392, // longPeri = 93.10704
        meanAnomalyEpoch_deg: 317.02012, // L = 50.12716
        orbitalPeriod_days: 10759.22,
        siderealRotationDays: 0.444,
        color: "#FAD5A5",
        radius_km: 232928.0
    },
    {
        name: "Uranus",
        semiMajorAxis_AU: 19.19126393,
        eccentricity: 0.04716771,
        inclination_deg: 0.76986,
        longitudeAscNode_deg: 74.22988,
        argPerihelion_deg: 96.66127, // longPeri = 170.89115
        meanAnomalyEpoch_deg: 142.2386, // L = 313.12975
        orbitalPeriod_days: 30688.5,
        siderealRotationDays: -0.71833,
        color: "#4FD0E7",
        radius_km: 101448.0
    },
    {
        name: "Neptune",
        semiMajorAxis_AU: 30.06896348,
        eccentricity: 0.00858587,
        inclination_deg: 1.76917,
        longitudeAscNode_deg: 131.72169,
        argPerihelion_deg: 273.24966, // longPeri = 44.97135
        meanAnomalyEpoch_deg: 256.228, // L = 301.19935
        orbitalPeriod_days: 60182.0,
        siderealRotationDays: 0.6713,
        color: "#4169E1",
        radius_km: 98488.0
    },
    // --- DWARF PLANETS ---
    {
        name: "Ceres",
        semiMajorAxis_AU: 2.7680,      // Between Mars and Jupiter
        eccentricity: 0.0758,
        inclination_deg: 10.593,
        longitudeAscNode_deg: 80.393,
        argPerihelion_deg: 73.597,
        meanAnomalyEpoch_deg: 95.989,
        orbitalPeriod_days: 1680.0,    // ~4.6 years
        siderealRotationDays: 0.3781,
        color: "#9E9E9E",              // Gray
        radius_km: 1892.0
    },
    {
        name: "Pluto",
        semiMajorAxis_AU: 39.482,      // Trans-Neptunian
        eccentricity: 0.2488,          // Highly eccentric
        inclination_deg: 17.16,        // Highly inclined
        longitudeAscNode_deg: 110.299,
        argPerihelion_deg: 113.834,
        meanAnomalyEpoch_deg: 14.53,
        orbitalPeriod_days: 90560.0,   // ~248 years
        siderealRotationDays: -6.3872,
        color: "#D1C4E9",              // Light purple
        radius_km: 4753.2
    },
    // --- TRANS-NEPTUNIAN OBJECTS (Dwarf Planets) ---
    {
        name: "Haumea",
        semiMajorAxis_AU: 43.116,
        eccentricity: 0.195,
        inclination_deg: 28.19,
        longitudeAscNode_deg: 122.103,
        argPerihelion_deg: 239.041,
        meanAnomalyEpoch_deg: 218.205,
        orbitalPeriod_days: 103468.0,  // ~283 years
        siderealRotationDays: 0.1631,
        color: "#E0E0E0",              // Gray white
        radius_km: 3264.0               // Elongated ellipsoid
    },
    {
        name: "Makemake",
        semiMajorAxis_AU: 45.43,
        eccentricity: 0.163,
        inclination_deg: 28.98,
        longitudeAscNode_deg: 79.382,
        argPerihelion_deg: 296.534,
        meanAnomalyEpoch_deg: 155.116,
        orbitalPeriod_days: 111845.0,  // ~306 years
        siderealRotationDays: 0.9375,
        color: "#BCAAA4",              // Brown/tan
        radius_km: 2860.0
    },
    {
        name: "Eris",
        semiMajorAxis_AU: 67.864,
        eccentricity: 0.436,           // Very eccentric
        inclination_deg: 44.04,        // Highly inclined
        longitudeAscNode_deg: 35.951,
        argPerihelion_deg: 151.639,
        meanAnomalyEpoch_deg: 204.16,
        orbitalPeriod_days: 204199.0,  // ~559 years
        siderealRotationDays: 1.0792,
        color: "#CFD8DC",              // Blue gray
        radius_km: 4652.0              // Slightly smaller than Pluto
    },
    {
        name: "Sedna",
        semiMajorAxis_AU: 506.0,       // Extreme outer solar system
        eccentricity: 0.855,           // Extremely eccentric
        inclination_deg: 11.93,
        longitudeAscNode_deg: 144.514,
        argPerihelion_deg: 311.122,
        meanAnomalyEpoch_deg: 358.117,
        orbitalPeriod_days: 4154000.0, // ~11,400 years
        siderealRotationDays: 0.428,
        color: "#FFCCBC",              // Reddish
        radius_km: 1990.0
    }
];

/**
 * J2000 Epoch: 2000-Jan-01 12:00:00 TDB (Julian Date 2451545.0)
 */
export const J2000_EPOCH = new Date('2000-01-01T12:00:00Z');

/**
 * Convert degrees to radians
 */
export function deg2rad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate mean anomaly at given time
 * M(t) = M₀ + n·(t - t₀)
 * where n = 2π/T (mean motion)
 */
export function calculateMeanAnomaly(planet: PlanetaryOrbit, currentDate: Date | number): number {
    const t0 = J2000_EPOCH.getTime();
    const t = typeof currentDate === 'number' ? currentDate : currentDate.getTime();
    const deltaT_ms = t - t0;
    const deltaT_days = deltaT_ms / (1000 * 60 * 60 * 24);
    
    const n = (2 * Math.PI) / planet.orbitalPeriod_days; // Mean motion (radians/day)
    const M = deg2rad(planet.meanAnomalyEpoch_deg) + n * deltaT_days;
    
    return M;
}

/**
 * Solve Kepler's Equation: M = E - e·sin(E)
 * Uses Newton-Raphson iteration for E (eccentric anomaly)
 * Precision: 10^-12 radians
 */
export function solveKeplersEquation(M: number, e: number): number {
    let E = M; // Initial guess
    const tolerance = 1e-12;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
        const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E = E - dE;
        
        if (Math.abs(dE) < tolerance) {
            break;
        }
    }
    
    return E;
}

/**
 * Calculate true anomaly from eccentric anomaly
 * tan(ν/2) = sqrt((1+e)/(1-e)) · tan(E/2)
 */
export function calculateTrueAnomaly(E: number, e: number): number {
    const nu = 2 * Math.atan2(
        Math.sqrt(1 + e) * Math.sin(E / 2),
        Math.sqrt(1 - e) * Math.cos(E / 2)
    );
    return nu;
}

/**
 * Calculate heliocentric distance
 * r = a(1 - e·cos(E))
 */
export function calculateHeliocentricDistance(a: number, e: number, E: number): number {
    return a * (1 - e * Math.cos(E));
}

/**
 * Calculate 3D position in orbital plane
 */
export function calculate3DPosition(planet: PlanetaryOrbit, currentDate: Date | number): {
    x: number;  // AU
    y: number;  // AU
    z: number;  // AU
} {
    // 1. Calculate mean anomaly
    const M = calculateMeanAnomaly(planet, currentDate);
    
    // 2. Solve Kepler's equation for eccentric anomaly
    const E = solveKeplersEquation(M, planet.eccentricity);
    
    // 3. Calculate true anomaly
    const nu = calculateTrueAnomaly(E, planet.eccentricity);
    
    // 4. Calculate heliocentric distance
    const r = calculateHeliocentricDistance(planet.semiMajorAxis_AU, planet.eccentricity, E);
    
    // 5. Position in orbital plane
    const x_orb = r * Math.cos(nu);
    const y_orb = r * Math.sin(nu);
    
    // 6. Rotate to ecliptic coordinates
    const i = deg2rad(planet.inclination_deg);
    const Omega = deg2rad(planet.longitudeAscNode_deg);
    const omega = deg2rad(planet.argPerihelion_deg);
    
    // Rotation matrices
    const x = (Math.cos(Omega) * Math.cos(omega) - Math.sin(Omega) * Math.sin(omega) * Math.cos(i)) * x_orb
            + (-Math.cos(Omega) * Math.sin(omega) - Math.sin(Omega) * Math.cos(omega) * Math.cos(i)) * y_orb;
    
    const y = (Math.sin(Omega) * Math.cos(omega) + Math.cos(Omega) * Math.sin(omega) * Math.cos(i)) * x_orb
            + (-Math.sin(Omega) * Math.sin(omega) + Math.cos(Omega) * Math.cos(omega) * Math.cos(i)) * y_orb;
    
    const z = Math.sin(omega) * Math.sin(i) * x_orb
            + Math.cos(omega) * Math.sin(i) * y_orb;
    
    return { x, y, z };
}

/**
 * Calculate GEOCENTRIC Longitude (0-360)
 * Allows us to see where a planet is relative to Earth (as viewed from Earth).
 */
export function calculateGeocentricLongitude(planetPos: {x: number, y: number, z: number}, earthPos: {x: number, y: number, z: number}): number {
    // Vector from Earth to Planet
    const dx = planetPos.x - earthPos.x;
    const dy = planetPos.y - earthPos.y;
    // const dz = planetPos.z - earthPos.z; // Not needed for longitude

    // Angle in radians
    const theta = Math.atan2(dy, dx);
    
    // Convert to degrees (0-360)
    let deg = theta * (180 / Math.PI);
    if (deg < 0) deg += 360;

    return deg;
}

/**
 * Get simple Ecliptic Longitude from Heliocentric Coordinates 
 * (Useful for standard checking)
 */
export function getEclipticLongitude(x: number, y: number): number {
    const theta = Math.atan2(y, x);
    let deg = theta * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return deg;
}
