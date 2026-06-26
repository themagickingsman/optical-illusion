import {
  FLAT_OCTAVE_0,
  FLAT_OCTAVE_1,
  FLAT_OCTAVE_2,
  FLAT_OCTAVE_3,
  FLAT_OCTAVE_4,
  FLAT_OCTAVE_5,
  FLAT_OCTAVE_6,
  FLAT_OCTAVE_7,
  FLAT_OCTAVE_8,
  FLAT_OCTAVE_9,
  FLAT_OCTAVE_10,
  FLAT_OCTAVE_11,
  FLAT_OCTAVE_12,
  FLAT_OCTAVE_13,
  FLAT_OCTAVE_14,
} from "./SnapshotAdapter";
import bakedCatalog from "../data/cosmic_catalog_snapshot.json";

export interface OctaveBody {
  name: string;
  color: string;
  worldR: number; // game world orbit radius (200-7000)
  baseAngle: number; // initial orbital angle
  orbSpeed: number; // radians/frame
  r: number; // visual dot radius
  isSource: boolean; // delivery / refuel target (Earth equivalent)
  au: number; // for distance label
  texture?: any; // cached low-poly canvas render
  hasDistressBeacon?: boolean;
}

// Baked catalog octaves with real science names (same source as useCosmicData)
const _BAKED = (bakedCatalog as any)?.octaves as
  | Record<string, any[]>
  | undefined;

// Fallback: raw snapshot for octaves missing from baked catalog
export const ALL_FLAT_OCTAVES = [
  FLAT_OCTAVE_0,
  FLAT_OCTAVE_1,
  FLAT_OCTAVE_2,
  FLAT_OCTAVE_3,
  FLAT_OCTAVE_4,
  FLAT_OCTAVE_5,
  FLAT_OCTAVE_6,
  FLAT_OCTAVE_7,
  FLAT_OCTAVE_8,
  FLAT_OCTAVE_9,
  FLAT_OCTAVE_10,
  FLAT_OCTAVE_11,
  FLAT_OCTAVE_12,
  FLAT_OCTAVE_13,
  FLAT_OCTAVE_14,
];

export function buildOctaveBodies(octave: number): OctaveBody[] {
  const MAX = 12;
  const INNER = 300;
  const OUTER = 6800;
  const octCol =
    (
      {
        0: "#22d3ee",
        1: "#38bdf8",
        2: "#6366f1",
        3: "#8b5cf6",
        4: "#a855f7",
        5: "#d946ef",
        6: "#ec4899",
        7: "#f43f5e",
        8: "#fbbf24",
        9: "#f59e0b",
        10: "#ea580c",
        11: "#ef4444",
        12: "#e11d48",
        13: "#be123c",
        14: "#881337",
      } as Record<number, string>
    )[octave] ?? "#4488ff";

  // PRIMARY: baked catalog snapshot (has real science names for all octaves)
  const bakedBodies = _BAKED?.[String(octave)] ?? [];

  // Use real named bodies only — no "Predicted Orbit" / unnamed fallback
  const realBodies = bakedBodies.filter(
    (b: any) =>
      b.name &&
      b.name !== "Predicted Orbit" &&
      b.status !== "predicted" &&
      (b.object_type === "Planet" ||
        b.object_type === "Dwarf Planet" ||
        b.object_type === "Star" ||
        b.isSource ||
        b.name.toLowerCase().includes("sun")),
  );

  // FALLBACK: raw snapshot bodies with matched names (e.g. solar system oct 11)
  const fallbackBodies =
    realBodies.length === 0
      ? (ALL_FLAT_OCTAVES[octave] || []).filter(
          (b: any) =>
            b.status === "matched" && b.name && b.name !== "Predicted Orbit",
        )
      : [];

  const getAu = (b: any): number =>
    b.radius_au ||
    b.meta?.true_radius_au ||
    b.meta?.local_radius_au ||
    Number(b.id) ||
    0;

  const pool = (realBodies.length > 0 ? realBodies : fallbackBodies)
    .sort((a: any, b: any) => getAu(a) - getAu(b)) // innermost first
    .slice(0, MAX);

  // If no real named bodies exist for this octave, return empty (no rings/dots)
  if (pool.length === 0) return [];

  const auVals = pool.map(getAu).filter((n: number) => n > 0);
  if (auVals.length === 0) return [];

  const auMin = Math.min(...auVals);
  const auMax = Math.max(...auVals);
  const logMin = Math.log(Math.max(auMin, 1e-300));
  const logMax = Math.log(Math.max(auMax, 1e-300));
  const logRange = logMax - logMin || 1;
  const toWorldR = (au: number) => {
    // Phase 10 Exponential Planetary Scaling
    if (octave === 11) return Math.pow(Math.max(au, 0.001), 0.6) * 3500;
    
    if (au <= 0) return INNER;
    const t = (Math.log(Math.max(au, 1e-300)) - logMin) / logRange;
    return INNER + Math.min(1, Math.max(0, t)) * (OUTER - INNER);
  };

  // Source body: named body closest to mid-range (Earth-equivalent)
  let sourceIdx = 0;
  let bestDist = Infinity;
  pool.forEach((b: any, i: number) => {
    const au = getAu(b);
    const t =
      auVals.length > 1
        ? (Math.log(Math.max(au, 1e-300)) - logMin) / logRange
        : 0.5;
    if (Math.abs(t - 0.5) < bestDist) {
      bestDist = Math.abs(t - 0.5);
      sourceIdx = i;
    }
  });

  // Size proportional to real physical size
  const getRad = (b: any): number =>
    b.meta?.real_radius || b.radius_au || getAu(b);
  const radVals = pool.map(getRad).filter((n: number) => n > 0);
  const rMin = radVals.length > 0 ? Math.min(...radVals) : 1;
  const rMax = radVals.length > 0 ? Math.max(...radVals) : 1;

  const parsedBodies = pool.map((b: any, i: number) => {
    const au = getAu(b);
    const wR = toWorldR(au);
    const label = (b.name as string).toUpperCase().slice(0, 20);

    // Map realistic pastel colors based on names FIRST, otherwise fallback to existing color or hash
    let col = "#ffffff";
    const nLower = label.toLowerCase();
    if (nLower.includes("sun")) col = "#ffdd88";
    else if (nLower.includes("mercury")) col = "#cccccc";
    else if (nLower.includes("venus")) col = "#ffccaa";
    else if (nLower.includes("earth"))
      col = "#99ccff"; // pastel blue
    else if (nLower.includes("mars"))
      col = "#ff9988"; // pastel red
    else if (nLower.includes("jupiter")) col = "#eeddcc";
    else if (nLower.includes("saturn")) col = "#ffeecc";
    else if (nLower.includes("uranus")) col = "#aaddff";
    else if (nLower.includes("neptune")) col = "#88aaff";
    else if (nLower.includes("pluto")) col = "#eeeeee";
    else {
      col = (b as any).compass_hex || b.color;
      if (!col) {
        // Procedural pastel color from name
        let hash = 0;
        for (let c = 0; c < label.length; c++)
          hash = label.charCodeAt(c) + ((hash << 5) - hash);
        const hue = Math.abs(hash % 360);
        col = `hsl(${hue}, 75%, 75%)`;
      }
    }

    // Phase 10 Massive Planet Geometry
    const rad = getRad(b);
    const sizeT = rMax > rMin ? (rad - rMin) / (rMax - rMin) : 0;
    const visualR = 60 + Math.pow(sizeT, 0.75) * 240; // scales from 60 to 300

    const isSun = nLower.includes("sun");
    
    return {
      name: label,
      color: col,
      worldR: isSun ? 0 : wR,
      baseAngle: ((b as any).initial_phase as number) ?? i * 1.047,
      orbSpeed: isSun ? 0 : (-0.00022 / Math.max(1, Math.sqrt(wR / 400))),
      r: visualR,
      isSource: i === sourceIdx,
      au,
    } as OctaveBody;
  });

  // Ensure the Sun exists in the Solar System (Octave 11) because it gets filtered out if it was named 'Predicted Orbit' in the data
  if (octave === 11 && !parsedBodies.find((b: any) => b.name === "SUN")) {
      parsedBodies.unshift({
          name: "SUN",
          color: "#ffdd88",
          worldR: 0,
          baseAngle: 0,
          orbSpeed: 0,
          r: 200,
          isSource: false,
          au: 0
      } as OctaveBody);
  }

  return parsedBodies;
}

// Precompute once at module load — O(1) per octave during render
export const OCTAVE_BODIES_MAP: Record<number, OctaveBody[]> = Object.fromEntries(
  Array.from({ length: 15 }, (_, i) => {
    const bodies = buildOctaveBodies(i);

    // --- DISTRESS CALL MISSION: Flag Furthest Body in Octave 11 ---
    if (i === 11 && bodies.length > 0) {
       const furthestBody = bodies.reduce((prev: any, current: any) => (prev.worldR > current.worldR) ? prev : current);
       if (furthestBody) {
          furthestBody.hasDistressBeacon = true;
       }
    }

    // --- MISSION 4: Inject Phantom Nodes into Octave 13 ---
    if (i === 13) {
      // Generate 3 random phantom planets deep in the constellation octave
      for (let p = 0; p < 3; p++) {
        bodies.push({
          name: `PHANTOM NODE ${["ALPHA", "BETA", "GAMMA"][p]}`,
          color: "#a855f7", // Modulator purple
          worldR: 3500 + Math.random() * 2500, // Outer edges
          baseAngle: Math.random() * Math.PI * 2,
          orbSpeed:
            (Math.random() < 0.5 ? 1 : -1) * (0.0001 + Math.random() * 0.0002),
          r: 45 + Math.random() * 20, // Medium size
          isSource: false,
          au: 1000 + Math.random() * 500,
          isPhantom: true, // Custom flag for modulator reveal
        } as OctaveBody & { isPhantom: boolean });
      }
      // Sort by worldR so rendering order (and orbital rings) still looks correct
      bodies.sort((a, b) => a.worldR - b.worldR);
    }

    return [i, bodies];
  }),
);

// Backwards-compat: octave 11 Earth lookup (still used by refuel/delivery logic)
const _OCT11 = OCTAVE_BODIES_MAP[11] ?? [];
// Mark Earth explicitly by name — not by distance heuristic
const _earthByName = _OCT11.find((b) => b.name.toLowerCase().includes("earth"));
export const SOLAR_BODIES = [
  ..._OCT11.map((b) => ({
    ...b,
    isEarth: _earthByName ? b === _earthByName : b.isSource,
  }))
];

export function buildAllOctaves(mode: 'LEGACY' | 'COMPASS' = 'LEGACY', screenWidth?: number): OctaveBody[] {
    if (mode === 'LEGACY') return SOLAR_BODIES;

    const PHI = 1.61803398875;
    
    // The Level 9 Screen-Width Framework: Earth is exactly 1 screen width away
    const fallbackWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const W = screenWidth || Math.max(390, fallbackWidth); // Floor at 390 to prevent breaking on tiny embeds
    
    const COMPASS_NODES: Record<string, number> = {
        'MERCURY': -8.0,
        'VENUS': -2.5,
        'EARTH': 0.0,
        'MARS': 3.5,
        'CERES': 8.5,
        'JUPITER': 13.5,
        'SATURN': 18.5,
        'URANUS': 24.5,
        'NEPTUNE': 28.5,
        'PLUTO': 30.5,
        'MAKEMAKE': 31.5,
        'ERIS': 35.0
    };

    return SOLAR_BODIES.map(b => {
        if (b.name === 'SUN') return { ...b, worldR: 0, au: 0 };
        
        let n = COMPASS_NODES[b.name.toUpperCase()];
        if (n === undefined) {
             // For any other bodies (asteroids, phantom nodes), snap them to the nearest N-node mathematically
             // We scale legacy to find approx node based on the original 3500 baseline.
             const normalizedLegacyWorldR = b.worldR * (3500 / 20000);
             n = Math.round(4 * (Math.log(Math.max(1, normalizedLegacyWorldR) / 3500) / Math.log(PHI)) * 2) / 2; // snap to half nodes
        }

        // Pure responsive mathematical boundary
        const newWorldR = W * Math.pow(PHI, n / 4);
        const newAu = newWorldR / W; // 1 AU = W worldR in compass scale
        
        // Responsive mesh sizing to prevent overlaps on smaller screens
        const baseVisualR = b.r || 60;
        const responsiveR = Math.max(8, (baseVisualR / 1280) * W);

        return {
            ...b,
            worldR: newWorldR,
            au: newAu,
            r: responsiveR
        };
    });
}
