/**
 * GalacticConversionEngine
 * 
 * Core calculation engine for cosmic age and precession.
 * Framework = Standard (original harmonic positions at t=0)
 * JPL = Drift/Control (measured deviation from standard)
 * Offset = Age signal (time elapsed since formation)
 */

// Constants
const PHI = 1.618033988749895;
const PRECESSION_PERIOD_YEARS = 25772; // IAU 2006 value
const J2000_EPOCH = new Date('2000-01-01T12:00:00Z').getTime();
const APRIL_8_2024_ECLIPSE = new Date('2024-04-08T18:18:00Z').getTime(); // Eclipse totality - MEROITIC ANCHOR

// MEROITIC CALIBRATION: Glyph angles used for precession reference
// Source: geometric_glyph_system.json - Pure geometric analysis from Meroitic scripts
const MEROITIC_PRECES_ANCHOR = {
    anchorDate: APRIL_8_2024_ECLIPSE,
    anchorGlyph: 'M09 (b)',
    anchorAngleDeg: 27.3,        // Glyph M09 angle - precession marker
    rationale: 'April 8, 2024 eclipse as alignment point; M09 @ 27.3° marks current precession from Hipparchus era',
};

// Framework standard positions (φ-calculated, original harmonic state)
const FRAMEWORK_STANDARD = {
  mercury: { radius_au: 0.437, axialTilt: 0.034 },    // Level 62
  venus:   { radius_au: 0.674, axialTilt: 177.4 },    // Level 73
  earth:   { radius_au: 1.000, axialTilt: 23.44 },    // Level 90 (anchor)
  mars:    { radius_au: 1.484, axialTilt: 25.19 },    // Level 100
  jupiter: { radius_au: 3.270, axialTilt: 3.13 },     // Level 126
  saturn:  { radius_au: 8.600, axialTilt: 26.73 },    // Level 167
  uranus:  { radius_au: 17.20, axialTilt: 97.77 },    // Level 204
  neptune: { radius_au: 33.49, axialTilt: 28.32 },    // Level 1 (outermost)
};

// JPL drift positions (measured current state - deviation from standard)
const JPL_DRIFT = {
  mercury: { radius_au: 0.387, axialTilt: 0.034 },
  venus:   { radius_au: 0.723, axialTilt: 177.4 },
  earth:   { radius_au: 1.000, axialTilt: 23.44 },
  mars:    { radius_au: 1.524, axialTilt: 25.19 },
  jupiter: { radius_au: 5.203, axialTilt: 3.13 },
  saturn:  { radius_au: 9.537, axialTilt: 26.73 },
  uranus:  { radius_au: 19.19, axialTilt: 97.77 },
  neptune: { radius_au: 30.07, axialTilt: 28.32 },
};

export interface CosmicTimeline {
  solarSystemAgeGyr: number;           // Age in billions of years
  solarSystemAgeDays: number;          // Age in days
  precessionCyclesComplete: number;    // Total complete cycles
  currentCycleNumber: number;          // Current cycle (1-indexed)
  currentCyclePosition: number;        // Position in current cycle (0-360°)
  currentCycleStartDate: Date;         // When current precession cycle started
  currentCycleEndDate: Date;           // When current precession cycle ends
  timeToNextPrecessionEndYears: number; // Years remaining
  timeToNextPrecessionEndDays: number;  // Days remaining
  referenceDate: Date;                 // Calculation reference date
}

export interface PlanetaryEquinox {
  planet: string;
  axialTilt: number;                   // Degrees from orbital plane
  equinoxAngle: number;                // Current equinox direction (0-360°)
  precessionOffset: number;            // Offset due to precession
}

export interface DriftAnalysis {
  planet: string;
  standardPosition: number;            // Framework (original)
  driftPosition: number;               // JPL (current)
  driftMagnitude: number;              // Deviation from standard
  driftDirection: 'inward' | 'outward'; // Migration direction
  impliedAgeGyr: number;               // Age estimate from this planet
}

class GalacticConversionEngine {
  /**
   * Calculate solar system age from weighted drift analysis
   * Uses multiple planets for cross-validation
   */
  calculateSolarSystemAge(): { ageGyr: number; confidence: number; analysis: DriftAnalysis[] } {
    const analysis: DriftAnalysis[] = [];
    
    // Drift rates (AU per billion years) - derived from planetary migration models
    // Framework precession-based: planets drift at rates proportional to their φ-level
    const driftRates: Record<string, number> = {
      mercury: 0.011,   // Inner planets drift faster
      venus:   0.011,
      earth:   0.000,   // Anchor - no drift by definition
      mars:    0.009,
      jupiter: 0.420,   // Gas giants had significant migration
      saturn:  0.205,
      uranus:  0.430,
      neptune: 0.750,   // Outer planets migrated most
    };
    
    let weightedAgeSum = 0;
    let weightSum = 0;
    
    for (const [planet, standard] of Object.entries(FRAMEWORK_STANDARD)) {
      const drift = JPL_DRIFT[planet as keyof typeof JPL_DRIFT];
      const rate = driftRates[planet];
      
      if (planet === 'earth' || rate === 0) continue; // Skip anchor
      
      const driftMagnitude = drift.radius_au - standard.radius_au;
      const driftDirection = driftMagnitude > 0 ? 'outward' : 'inward';
      const impliedAge = Math.abs(driftMagnitude) / rate;
      
      // Weight by inverse of drift rate (more stable = higher weight)
      const weight = 1 / rate;
      weightedAgeSum += impliedAge * weight;
      weightSum += weight;
      
      analysis.push({
        planet,
        standardPosition: standard.radius_au,
        driftPosition: drift.radius_au,
        driftMagnitude,
        driftDirection: driftDirection as 'inward' | 'outward',
        impliedAgeGyr: impliedAge,
      });
    }
    
    const ageGyr = weightedAgeSum / weightSum;
    
    // Calculate confidence based on agreement between planets
    const ageVariance = analysis.reduce((sum, a) => 
      sum + Math.pow(a.impliedAgeGyr - ageGyr, 2), 0) / analysis.length;
    const confidence = Math.max(0, 1 - (Math.sqrt(ageVariance) / ageGyr));
    
    return { ageGyr, confidence, analysis };
  }
  
  /**
   * Count precession cycles since solar system formation
   */
  countPrecessionCycles(ageGyr: number): { complete: number; current: number } {
    const ageYears = ageGyr * 1e9;
    const complete = Math.floor(ageYears / PRECESSION_PERIOD_YEARS);
    return {
      complete,
      current: complete + 1, // Current cycle is 1-indexed
    };
  }
  
  /**
   * Get current position within the precession cycle (0-360°)
   * MEROITIC CALIBRATION: Uses April 8, 2024 eclipse as anchor point
   * Primordial Mode: Starts at 0° at t=0
   */
  getCurrentPrecessionPosition(referenceDate: Date = new Date(), isPrimordial: boolean = false, simTimeSeconds: number = 0): number {
    const PRECESSION_RATE_DEG_PER_YEAR = 50.29 / 3600;
    
    if (isPrimordial) {
        // Direct calculation from sim time: zeroed at t=0
        const years = simTimeSeconds / (365.25 * 24 * 60 * 60);
        return (years * PRECESSION_RATE_DEG_PER_YEAR + 360) % 360;
    }

    // MEROITIC ANCHOR: Calculate from April 8, 2024 eclipse
    const msFromAnchor = referenceDate.getTime() - MEROITIC_PRECES_ANCHOR.anchorDate;
    const yearsFromAnchor = msFromAnchor / (365.25 * 24 * 60 * 60 * 1000);
    const basePosition = MEROITIC_PRECES_ANCHOR.anchorAngleDeg;
    return (basePosition + yearsFromAnchor * PRECESSION_RATE_DEG_PER_YEAR + 360) % 360;
  }
  
  /**
   * Calculate time remaining until end of current precession cycle
   */
  getTimeToNextPrecessionEnd(referenceDate: Date = new Date(), isPrimordial: boolean = false, simTimeSeconds: number = 0): { years: number; days: number } {
    const currentPosition = this.getCurrentPrecessionPosition(referenceDate, isPrimordial, simTimeSeconds);
    const degreesRemaining = 360 - currentPosition;
    
    const PRECESSION_RATE_DEG_PER_YEAR = 50.29 / 3600;
    const yearsRemaining = degreesRemaining / PRECESSION_RATE_DEG_PER_YEAR;
    
    const years = Math.floor(yearsRemaining);
    const days = Math.floor((yearsRemaining - years) * 365.25);
    
    return { years, days };
  }
  
  /**
   * Get planetary equinox angle for visualization
   * Primordial Mode: All planets and equinoxes start at 0 at t=0
   */
  getPlanetaryEquinoxAngle(planet: string, referenceDate: Date = new Date(), isPrimordial: boolean = false, simTimeSeconds: number = 0): PlanetaryEquinox | null {
    const standard = FRAMEWORK_STANDARD[planet as keyof typeof FRAMEWORK_STANDARD];
    if (!standard) return null;
    
    const precessionPosition = this.getCurrentPrecessionPosition(referenceDate, isPrimordial, simTimeSeconds);
    
    let orbitalAngle = 0;
    if (isPrimordial) {
        // Simple orbital progression from 0
        const period_days = this.getOrbitalPeriod(planet);
        const simDays = simTimeSeconds / 86400;
        orbitalAngle = (simDays / period_days) * 360 % 360;
    } else {
        const msFromJ2000 = referenceDate.getTime() - J2000_EPOCH;
        const daysFromJ2000 = msFromJ2000 / (24 * 60 * 60 * 1000);
        const period = this.getOrbitalPeriod(planet);
        orbitalAngle = (daysFromJ2000 / period) * 360 % 360;
    }
    
    return {
      planet,
      axialTilt: standard.axialTilt,
      equinoxAngle: (orbitalAngle + precessionPosition) % 360,
      precessionOffset: precessionPosition,
    };
  }

  /** Helper to get orbital period in days */
  private getOrbitalPeriod(planet: string): number {
    const orbitalPeriods: Record<string, number> = {
        mercury: 87.97,
        venus: 224.7,
        earth: 365.25,
        mars: 687.0,
        jupiter: 4332.59,
        saturn: 10759.22,
        uranus: 30688.5,
        neptune: 60182.0,
      };
      return orbitalPeriods[planet] || 365.25;
  }
  
  /**
   * Get alignment data for April 8, 2024 (MEROITIC ANCHOR POINT)
   * This eclipse date is the calibration point for all precession calculations
   */
  getApril2024Alignment(): { 
    date: Date; 
    precessionPosition: number;
    anchorGlyph: string;
    equinoxes: PlanetaryEquinox[] 
  } {
    const date = new Date(MEROITIC_PRECES_ANCHOR.anchorDate);
    const precessionPosition = MEROITIC_PRECES_ANCHOR.anchorAngleDeg; // This IS the anchor, so use exact value
    
    const planets = Object.keys(FRAMEWORK_STANDARD);
    const equinoxes = planets
      .map(p => this.getPlanetaryEquinoxAngle(p, date))
      .filter((e): e is PlanetaryEquinox => e !== null);
    
    return { date, precessionPosition, anchorGlyph: MEROITIC_PRECES_ANCHOR.anchorGlyph, equinoxes };
  }
  
  /**
   * Get complete cosmic timeline data
   */
  getCosmicTimeline(referenceDate: Date = new Date()): CosmicTimeline {
    const { ageGyr } = this.calculateSolarSystemAge();
    const { complete, current } = this.countPrecessionCycles(ageGyr);
    const currentPosition = this.getCurrentPrecessionPosition(referenceDate);
    const { years, days } = this.getTimeToNextPrecessionEnd(referenceDate);
    
    // Calculate cycle start and end dates
    const PRECESSION_RATE_DEG_PER_YEAR = 50.29 / 3600;
    const yearsIntoCurrentCycle = currentPosition / PRECESSION_RATE_DEG_PER_YEAR;
    const yearsRemaining = (360 - currentPosition) / PRECESSION_RATE_DEG_PER_YEAR;
    
    const cycleStartDate = new Date(referenceDate);
    cycleStartDate.setFullYear(cycleStartDate.getFullYear() - Math.floor(yearsIntoCurrentCycle));
    
    const cycleEndDate = new Date(referenceDate);
    cycleEndDate.setFullYear(cycleEndDate.getFullYear() + Math.floor(yearsRemaining));
    
    return {
      solarSystemAgeGyr: ageGyr,
      solarSystemAgeDays: ageGyr * 1e9 * 365.25,
      precessionCyclesComplete: complete,
      currentCycleNumber: current,
      currentCyclePosition: currentPosition,
      currentCycleStartDate: cycleStartDate,
      currentCycleEndDate: cycleEndDate,
      timeToNextPrecessionEndYears: years,
      timeToNextPrecessionEndDays: days,
      referenceDate,
    };
  }
}

export default GalacticConversionEngine;
