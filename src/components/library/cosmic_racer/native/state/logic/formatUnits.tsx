import React from 'react';

// Theme for matching Catalog/Clock colors
const THEME = {
    muted: '#94a3b8',
};

/**
 * Formats a raw Astronomical Unit (AU) distance into a human-readable string
 * scaled appropriately for the specific framework octave.
 * 
 * @param au The raw distance in Astronomical Units
 * @param octave The current framework octave (0-14)
 * @returns React Node with formatted value and styled unit suffix
 */
export const formatRadius = (au: number, octave: number): React.ReactNode => {
    // Return empty if invalid
    if (au === undefined || au === null || isNaN(au) || au <= 0) {
        return <span style={{fontSize:'0.7rem', color:'#f87171'}}>NO DATA</span>;
    }

    // 1 AU = 1.496e11 meters
    const meters = au * 1.496e11;

    // OCTAVE 0-4: QUANTUM / ATOMIC (use Meters scientific)
    if (octave <= 4) {
        return (
            <span>
                {meters.toExponential(4)} <span style={{ fontSize: '0.8rem', color: THEME.muted }}>m</span>
            </span>
        );
    }

    // OCTAVE 5-7: MICRO (Nanometers / Micrometers)
    if (octave >= 5 && octave <= 7) {
        if (meters < 1e-6) {
            const nm = meters * 1e9;
            return <span>{nm.toFixed(2)} <span style={{ fontSize: '0.8rem', color: THEME.muted }}>nm</span></span>;
        } else {
            const um = meters * 1e6;
            return <span>{um.toFixed(2)} <span style={{ fontSize: '0.8rem', color: THEME.muted }}>μm</span></span>;
        }
    }

    // OCTAVE 8: HUMAN SCALE (Meters)
    if (octave === 8) {
        return <span>{meters.toFixed(2)} <span style={{ fontSize: '0.8rem', color: THEME.muted }}>m</span></span>;
    }

    // OCTAVE 9-10: PLANETARY / SATELLITE (Kilometers)
    if (octave === 9 || octave === 10) {
        const km = meters / 1000;
        return (
            <span>
                {km.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span style={{ fontSize: '0.8rem', color: THEME.muted }}>km</span>
            </span>
        );
    }

    // OCTAVE 11-12: SOLAR (AU)
    if (octave === 11 || octave === 12) {
         return (
            <span>
                {au.toFixed(4)} <span style={{ fontSize: '0.8rem', color: THEME.muted }}>AU</span>
            </span>
        );
    }

    // OCTAVE 13+: GALACTIC (Light Years)
    if (octave >= 13) {
        // 1 LY = 63241 AU
        const ly = au / 63241;
        return (
            <span>
                {ly.toFixed(2)} <span style={{ fontSize: '0.8rem', color: THEME.muted }}>ly</span>
            </span>
        );
    }

    return <span>{au.toFixed(4)} <span style={{ fontSize: '0.8rem', color: THEME.muted }}>AU</span></span>;
};

/**
 * Formats standard density string preventing overflow in UI panels.
 */
export const formatDensity = (density_gcm3: number | undefined | null): React.ReactNode => {
    if (density_gcm3 === undefined || density_gcm3 === null || isNaN(density_gcm3)) {
         return <span>- <span style={{fontSize:'0.7rem', fontWeight: 600}}>G/CC</span></span>;
    }
    
    // Switch to scientific if too large/small
    if (density_gcm3 > 9999 || (density_gcm3 < 0.01 && density_gcm3 > 0)) {
        return <span>{density_gcm3.toExponential(1)} <span style={{fontSize:'0.7rem', fontWeight: 600}}>G/CC</span></span>;
    }
    
    return <span>{density_gcm3.toFixed(1)} <span style={{fontSize:'0.7rem', fontWeight: 600}}>G/CC</span></span>;
}

/**
 * Returns a plaintext string (no React Nodes) for the formatted unit, used for string interpolation.
 */
export const formatRadiusString = (au: number, octave: number): string => {
    if (au === undefined || au === null || isNaN(au) || au <= 0) {
        return "NO DATA";
    }

    const meters = au * 1.496e11;

    if (octave <= 4) {
        return `${meters.toExponential(4)} m`;
    }

    if (octave >= 5 && octave <= 7) {
        if (meters < 1e-6) {
            return `${Number((meters * 1e9).toFixed(2))} nm`;
        } else {
            return `${Number((meters * 1e6).toFixed(2))} μm`;
        }
    }

    if (octave === 8) {
        return `${Number(meters.toFixed(2))} m`;
    }

    if (octave === 9 || octave === 10) {
        const km = meters / 1000;
        return `${km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
    }

    if (octave === 11 || octave === 12) {
         return `${Number(au.toFixed(4))} AU`;
    }

    if (octave >= 13) {
        return `${Number((au / 63241).toFixed(2))} ly`;
    }

    return `${Number(au.toFixed(4))} AU`;
};
