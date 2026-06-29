import { useMemo } from 'react';
import { ALL_OCTAVES } from '../../../../state/science/recursion_levels';
import { AU_IN_METERS } from '../../../../state/science/catalogs/unit_converter';
import { SolarSystemBody } from '../../../../state/science/recursion_levels';

// ─── OctaveEntry ─────────────────────────────────────────────────────────────
export interface OctaveEntry {
    id: string;
    index: number;
    octave: number;
    name: string;
    radius_au: number;
    real_radius_au: number;
    alignment: number;
    type: string;
    source: string;
    status: 'verified' | 'matched' | 'predicted';
    is_base_level: boolean;
    subOctave: number;
    freq_hz: number;
    freq_display: string;
    scale_label: string;
    meta?: Record<string, unknown>;  // raw catalog meta (resonant_freq_ghz, size_nm, etc.)
}

// ─── Octave metadata ─────────────────────────────────────────────────────────
export const OCTAVE_META: Record<number, { label: string; domain: string; color: string; unit: string }> = {
    0:  { label: 'OCT-0',  domain: 'Planck / Quantum Foam',        color: '#ec4899', unit: 'ħ' },
    1:  { label: 'OCT-1',  domain: 'String / Superstring',          color: '#f43f5e', unit: 'fm' },
    2:  { label: 'OCT-2',  domain: 'QCD / Strong Force',            color: '#f43f5e', unit: 'fm' },
    3:  { label: 'OCT-3',  domain: 'Atomic Nucleus',                color: '#f97316', unit: 'fm' },
    4:  { label: 'OCT-4',  domain: 'Electron Orbitals / UV-Vis',    color: '#818cf8', unit: 'nm' },
    5:  { label: 'OCT-5',  domain: 'Molecular Bonds / IR',          color: '#a78bfa', unit: 'nm/µm' },
    6:  { label: 'OCT-6',  domain: 'Bio-molecular / Viral',         color: '#f97316', unit: 'nm' },
    7:  { label: 'OCT-7',  domain: 'Cellular / Bacterial',          color: '#14b8a6', unit: 'µm' },
    8:  { label: 'OCT-8',  domain: 'Neural / EM Biosphere',         color: '#22c55e', unit: 'Hz–GHz' },
    9:  { label: 'OCT-9',  domain: 'Planetary / Schumann',          color: '#f59e0b', unit: 'km' },
    10: { label: 'OCT-10', domain: 'Lunar / Magnetosphere',         color: '#38bdf8', unit: 'km' },
    11: { label: 'OCT-11', domain: 'Solar System',                  color: '#fcd34d', unit: 'AU' },
    12: { label: 'OCT-12', domain: 'Interstellar / Oort Cloud',     color: '#fb923c', unit: 'AU' },
    13: { label: 'OCT-13', domain: 'Stellar Neighbourhood',         color: '#f87171', unit: 'ly' },
    14: { label: 'OCT-14', domain: 'Galactic / Cosmic',             color: '#e879f9', unit: 'kpc' },
};

// ─── Physical constants ───────────────────────────────────────────────────────
const C_LIGHT   = 2.998e8;
const C_SOUND   = 343;
const C_SEISMIC = 5000;
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;

// ─── Scale label ─────────────────────────────────────────────────────────────
function auToScaleLabel(radius_au: number, octave: number): string {
    const m = radius_au * AU_IN_METERS;
    if (octave <= 7) {
        const nm = m / 1e-9;
        if (nm < 0.001) return `${(nm * 1e6).toFixed(2)} am`;
        if (nm < 1)     return `${(nm * 1000).toFixed(2)} pm`;
        if (nm < 1000)  return `${nm.toFixed(1)} nm`;
        const um = nm / 1000;
        if (um < 1000)  return `${um.toFixed(1)} µm`;
        return `${(um / 1000).toFixed(2)} mm`;
    }
    if (octave <= 10) {
        const km = m / 1000;
        if (km < 0.001) return `${m.toFixed(2)} m`;
        if (km < 1e6)   return `${km.toFixed(1)} km`;
        return `${(km / 1e6).toFixed(2)} Mkm`;
    }
    if (octave <= 12) return `${radius_au.toFixed(4)} AU`;
    if (octave === 13) return `${(radius_au / 63241).toFixed(2)} ly`;
    return `${(radius_au / 206265).toFixed(2)} pc`;
}

// ─── Frequency derivation ────────────────────────────────────────────────────
function derivedFreqHz(radius_au: number, octave: number): number {
    const lambda_m = radius_au * AU_IN_METERS;
    if (lambda_m <= 0) return 0;
    if (octave <= 7)   return C_LIGHT / lambda_m;
    if (octave === 8)  return C_SOUND / lambda_m;
    if (octave === 9)  return C_SEISMIC / lambda_m;
    if (octave === 10) return C_LIGHT / lambda_m;
    return 1 / (Math.pow(Math.max(radius_au, 1e-30), 1.5) * SECONDS_PER_YEAR);
}

// ─── Format frequency ────────────────────────────────────────────────────────
export function formatFreq(hz: number): string {
    const a = Math.abs(hz);
    if (a >= 1e15) return `${(hz / 1e15).toFixed(2)} PHz`;
    if (a >= 1e12) return `${(hz / 1e12).toFixed(2)} THz`;
    if (a >= 1e9)  return `${(hz / 1e9).toFixed(2)} GHz`;
    if (a >= 1e6)  return `${(hz / 1e6).toFixed(2)} MHz`;
    if (a >= 1e3)  return `${(hz / 1e3).toFixed(2)} kHz`;
    if (a >= 1)    return `${hz.toFixed(3)} Hz`;
    if (a >= 1e-3) return `${(hz * 1e3).toFixed(3)} mHz`;
    if (a > 0)     return `${hz.toExponential(2)} Hz`;
    return '0 Hz';
}

/**
 * Sub-octave recursion model:
 *   Sub-octave N  =  N × 15 objects  =  N levels of recursion
 *
 *   Level 1 (base): 15 catalog bodies (first 15 evenly spread)
 *   Level 2: base 15  +  15 geometric midpoints between adjacent pairs  = 30
 *   Level 3: level-2 set  +  15 new midpoints at largest gaps  = 45
 *   …
 *   Level 15: 225 objects total
 *
 * Returns objects tagged with which sub-octave level they first appear at.
 */
function buildSubOctaveEntries(
    octave: number,
    maxSubOctave: number,
    catalogFilter?: (body: SolarSystemBody) => boolean
): OctaveEntry[] {
    const allRaw: SolarSystemBody[] = (ALL_OCTAVES[octave] ?? [])
        .slice()
        .sort((a, b) => a.semi_major_axis_au - b.semi_major_axis_au);

    if (allRaw.length === 0) return [];

    // If a catalog filter is provided, apply it to limit base entries to that subset.
    // Predicted interpolated nodes are always untyped so they skip the filter.
    const raw = catalogFilter ? allRaw.filter(catalogFilter) : allRaw;
    // If filter produces nothing fall back to full catalog
    const basePool = raw.length > 0 ? raw : allRaw;

    // ── Level 1: pick up to 15 from basePool (all of them if <= 15) ───────────
    const BASE_COUNT = 15;
    const baseItems: { r: number; body: SolarSystemBody | null; subOctave: number }[] = [];

    if (basePool.length <= BASE_COUNT) {
        basePool.forEach(b => baseItems.push({ r: b.semi_major_axis_au, body: b, subOctave: 1 }));
    } else {
        for (let i = 0; i < BASE_COUNT; i++) {
            const idx = Math.round((i / (BASE_COUNT - 1)) * (basePool.length - 1));
            baseItems.push({ r: basePool[idx].semi_major_axis_au, body: basePool[idx], subOctave: 1 });
        }
    }

    // Consolidated set: sorted positions with sub-octave tag
    const positions = [...baseItems];

    // ── Levels 2–maxSubOctave: add 15 more per level ─────────────────────────
    for (let lvl = 2; lvl <= maxSubOctave; lvl++) {
        const sorted = positions.slice().sort((a, b) => a.r - b.r);
        const gaps: { lo: number; hi: number; gapLog: number }[] = [];
        for (let i = 0; i < sorted.length - 1; i++) {
            const lo = sorted[i].r, hi = sorted[i + 1].r;
            const gapLog = lo > 0 && hi > 0 ? Math.log(hi / lo) : hi - lo;
            gaps.push({ lo, hi, gapLog });
        }
        gaps.sort((a, b) => b.gapLog - a.gapLog);
        const topGaps = gaps.slice(0, BASE_COUNT);
        for (const { lo, hi } of topGaps) {
            const r = lo > 0 && hi > 0 ? Math.sqrt(lo * hi) : (lo + hi) / 2;
            positions.push({ r, body: null, subOctave: lvl });
        }
    }

    // ── Convert to OctaveEntry ────────────────────────────────────────────────
    positions.sort((a, b) => a.r - b.r);
    return positions.map((pos, idx) => {
        const fhz = derivedFreqHz(pos.r, octave);
        const isVerified = !!pos.body;
        const bodyMeta = (pos.body as any)?.meta as Record<string, unknown> | undefined;

        return {
            id: `oct${octave}-${idx}`,
            index: idx,
            octave,
            subOctave: pos.subOctave,
            name: pos.body?.name ?? `Harmonic Node ${formatFreq(fhz)}`,
            radius_au: pos.r,
            real_radius_au: pos.body?.semi_major_axis_au ?? pos.r,
            alignment: 100,
            type: pos.body?.type ?? 'Node',
            source: pos.body?.source ?? 'φ-Harmonic Framework · Sub-octave interpolation',
            status: pos.subOctave === 1
                ? (isVerified ? 'verified' : 'matched')
                : 'predicted',
            is_base_level: pos.subOctave === 1,
            freq_hz: fhz,
            freq_display: formatFreq(fhz),
            scale_label: auToScaleLabel(pos.r, octave),
            meta: bodyMeta,
        };
    });
}

// ─── Main hook ────────────────────────────────────────────────────────────────
/**
 * @param octaves        Which octaves to query
 * @param subOctave      Sub-octave level 1–15 (N = N×15 objects shown)
 * @param catalogFilter  Optional pre-filter applied to catalog bodies BEFORE
 *                       selecting the 15 base entries. Use this to restrict the
 *                       base pool to a specific type (e.g. Pathogen-only) so
 *                       the evenly-spaced sampling draws from the right subset.
 */
export function useOctaveEntries(
    octaves: number[],
    subOctave: number,
    catalogFilter?: (body: SolarSystemBody) => boolean
): OctaveEntry[] {
    return useMemo(() => {
        const clamp = Math.max(1, Math.min(15, subOctave));
        const all: OctaveEntry[] = [];
        for (const oct of octaves) {
            const entries = buildSubOctaveEntries(oct, clamp, catalogFilter);
            all.push(...entries.filter(e => e.subOctave <= clamp));
        }
        return all.sort((a, b) => a.octave - b.octave || a.radius_au - b.radius_au);
    }, [octaves.join(','), subOctave, catalogFilter]); // eslint-disable-line react-hooks/exhaustive-deps
}

export { auToScaleLabel };
