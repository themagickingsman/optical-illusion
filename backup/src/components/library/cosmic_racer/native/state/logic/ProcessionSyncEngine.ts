export interface VarianceScore {
    year: number;
    exactDate?: string;
    variance_deg: number;
    alignmentType: 'Start/End' | 'Half-Cycle' | 'None';
}

export class ProcessionSyncEngine {
    private static _instance: ProcessionSyncEngine;

    // GALACTIC ANCHORS (J2000 Approximate Ecliptic Coordinates)
    // Sirius (Octave 12 Anchor): Longitude ~104°
    private static readonly SIRIUS_LON = 104.0; 
    
    // Galactic Center (Octave 13 Anchor): Sagittarius A*, Longitude ~270°
    private static readonly GALACTIC_CORE_LON = 270.0;

    private constructor() {}

    public static get instance(): ProcessionSyncEngine {
        if (!this._instance) {
            this._instance = new ProcessionSyncEngine();
        }
        return this._instance;
    }

    /**
     * The Precession Rate is approx 1 degree every 71.6 years.
     * Over time, Earth's vernal equinox shifts relative to the stationary galactic anchors.
     */
    private getVernalEquinoxLongitude(year: number): number {
        // Vernal Equinox is 0° at J2000.
        // It retrogrades (moves backwards) ~1.396° per century.
        const yearsFromJ2000 = year - 2000;
        const shift = (yearsFromJ2000 / 71.6);
        let lon = (360.0 - shift) % 360.0;
        if (lon < 0) lon += 360;
        return lon;
    }

    /**
     * Calculates the Macro-Kinematic Angular Variance for a given year.
     * It checks the geometric alignment between the Equinox (Earth), Sirius (Star), and the Core (Galaxy).
     */
    public calculateVarianceForYear(year: number): VarianceScore {
        const equinoxLon = this.getVernalEquinoxLongitude(year);
        
        // Calculate diff between Earth vector and Galactic Core 
        let diffCore = Math.abs(equinoxLon - ProcessionSyncEngine.GALACTIC_CORE_LON);
        if (diffCore > 180) diffCore = 360 - diffCore;

        // Start/End Trigger: Max Alignment (Variance approaches 0)
        // Half-Cycle Trigger: Max Opposition (Variance approaches 180, so diff is 90 from orthogonal?)
        // Let's rely directly on the 0/180 axis.
        
        // When Vernal Equinox points exactly at Galactic Core (or opposite)
        const varianceTo0 = diffCore;            // Direct Alignment
        const varianceTo180 = Math.abs(180 - diffCore); // Direct Opposition

        let variance = varianceTo0;
        let type: 'Start/End' | 'Half-Cycle' | 'None' = 'None';

        if (varianceTo0 < 10) {
            variance = varianceTo0;
            type = 'Start/End';
        } else if (varianceTo180 < 10) {
            variance = varianceTo180;
            type = 'Half-Cycle';
        } else {
            variance = Math.min(varianceTo0, varianceTo180);
        }

        return {
            year,
            variance_deg: variance,
            alignmentType: type
        };
    }

    /**
     * Converts a fractional year (e.g., 2024.5) to a JS Date object.
     */
    private fractionalYearToDate(fractionalYear: number): Date {
        const year = Math.floor(fractionalYear);
        const remainder = fractionalYear - year;
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInYear = isLeapYear ? 366 : 365;
        
        // Milliseconds from start of the year
        const msInYear = daysInYear * 24 * 60 * 60 * 1000;
        const msOffset = remainder * msInYear;

        // JS Dates don't handle negative years well directly for 0 AD vs 1 BC.
        // For visual display, we just construct it relative to January 1st.
        const date = new Date(Date.UTC(year, 0, 1));
        
        // If it's a BCE year, we need to manually adjust 
        if (year <= 0) {
           date.setUTCFullYear(year); 
        }
        
        date.setTime(date.getTime() + msOffset);
        return date;
    }

    /**
     * Sweeps deep time to find the exact date (via binary search refining)
     * of absolute minimum variance.
     */
    public sweepDeepTime(startYear: number, endYear: number, stepRange: number = 10): VarianceScore[] {
        const results: VarianceScore[] = [];
        
        // COARSE SWEEP
        for (let y = startYear; y <= endYear; y += stepRange) {
            const score = this.calculateVarianceForYear(y);
            if (score.alignmentType !== 'None' && score.variance_deg < 1.0) {
                 results.push(score);
            }
        }
        
        // FINE REFINEMENT (Binary Search for absolute minimum)
        const refinedResults = results.map(coarseScore => {
            let bestYear = coarseScore.year;
            let bestVariance = coarseScore.variance_deg;
            
            // Search +/- stepRange with 0.001 year resolution (approx 8 hours)
            for (let fineY = coarseScore.year - stepRange; fineY <= coarseScore.year + stepRange; fineY += 0.001) {
                const fineScore = this.calculateVarianceForYear(fineY);
                if (fineScore.variance_deg < bestVariance) {
                    bestVariance = fineScore.variance_deg;
                    bestYear = fineY;
                }
            }
            
            const exactDateObj = this.fractionalYearToDate(bestYear);
            // Format: "Month DD"
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const exactStr = `${monthNames[exactDateObj.getUTCMonth()]} ${exactDateObj.getUTCDate()}`;

            return {
                year: Math.round(bestYear), // Keep the rounded year for standard display
                exactDate: exactStr,
                variance_deg: bestVariance,
                alignmentType: coarseScore.alignmentType
            };
        });
        
        // Filter duplicates that might arise from adjoining search boundaries
        const uniqueResults = [];
        const seenYears = new Set();
        
        for (const res of refinedResults.sort((a, b) => a.variance_deg - b.variance_deg)) {
            if (!seenYears.has(res.year)) {
                uniqueResults.push(res);
                seenYears.add(res.year);
            }
        }

        return uniqueResults;
    }
}
