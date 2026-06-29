"use client";
import React from "react";

// ── Geometric polygon asteroid shapes (clip-path) ─────────────────────────────
const SHAPES = [
  'polygon(50% 0%,75% 8%,100% 21%,94% 50%,100% 79%,69% 100%,31% 100%,6% 78%,0% 47%,12% 21%)',
  'polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)',
  'polygon(50% 0%,85% 12%,100% 40%,90% 70%,65% 100%,35% 95%,10% 80%,0% 50%,15% 20%)',
  'polygon(10% 20%,40% 0%,80% 5%,100% 30%,90% 70%,60% 100%,20% 90%,0% 60%)',
  'polygon(50% 0%,95% 30%,80% 90%,20% 95%,5% 35%)',
  'polygon(0% 15%,35% 0%,75% 8%,100% 35%,95% 70%,70% 100%,30% 100%,5% 75%)',
  'polygon(15% 0%,85% 5%,100% 40%,85% 100%,20% 95%,0% 60%,5% 25%)',
  'polygon(5% 5%,95% 0%,100% 90%,5% 100%)',
  'polygon(30% 0%,100% 20%,95% 70%,60% 100%,0% 80%,5% 30%)',
  'polygon(50% 0%,80% 15%,100% 50%,70% 100%,30% 100%,0% 55%,20% 15%)',
];

// ── Seeded deterministic random helpers ───────────────────────────────────────
// Returns 0–1 float for given seed + index + offset
function seededRand(seed: number, idx: number, offset: number = 0): number {
  const s0 = (seed === 0 ? 12345 : seed);
  let s = ((s0 * 0x19660d + idx * 0x3c6ef35f + offset * 0x9e3779b9) ^ (idx << 13)) >>> 0;
  s = (s ^ (s >> 17)) >>> 0;
  s = (s ^ (s <<  5)) >>> 0;
  return (s >>> 0) / 0xffffffff;
}

function seededShape(seed: number, idx: number): number {
  return Math.floor(seededRand(seed, idx, 0) * SHAPES.length);
}

export interface AsteroidLayerConfig {
  speed:        number;
  opacity:      number;
  color:        string;
  rotation:     number;
  rotSpeed:     number;   // spin speed multiplier (1 = ~8s per revolution on front layer)
  geometrySeed: number;
  yOffset:      number;
  sizeScale:    number;
}

export const DEFAULT_FRONT: AsteroidLayerConfig = {
  speed: 1.0, opacity: 0.85, color: '#4a5568', rotation: 0, rotSpeed: 1.0,
  geometrySeed: 0, yOffset: 0, sizeScale: 1.0,
};
export const DEFAULT_MID: AsteroidLayerConfig = {
  speed: 1.0, opacity: 0.60, color: '#2d3748', rotation: 0, rotSpeed: 1.0,
  geometrySeed: 0, yOffset: 0, sizeScale: 1.0,
};
export const DEFAULT_BACK: AsteroidLayerConfig = {
  speed: 1.0, opacity: 0.40, color: '#1e3a5f', rotation: 0, rotSpeed: 1.0,
  geometrySeed: 0, yOffset: 0, sizeScale: 1.0,
};

// [top%, w, h, shapeIdx, baseRot, baseDur_s, negDelay_s]
// baseDelta removed — rotation is now continuous spin, not delta-during-travel
const FRONT_DATA = [
  [  8, 148, 112, 0,  15,  8.5,  -2.1],
  [ 54, 125,  96, 2, -22, 11.0,  -5.8],
  [ 82, 100,  76, 4,  38,  7.0,  -1.2],
  [ 30, 158, 120, 1, -12,  9.5,  -7.4],
] as const;

// MID: tightened to 31–68%
const MID_DATA = [
  [ 31, 62, 48, 1,  22, 22.0,  -5.0],
  [ 36, 78, 60, 3, -14, 29.0, -12.5],
  [ 33, 55, 42, 0,  30, 19.5,  -8.0],
  [ 38, 85, 66, 2, -20, 33.0,  -3.5],
  [ 34, 50, 38, 4,  12, 25.5, -18.0],
  [ 44, 68, 52, 2,  18, 26.0, -15.0],
  [ 48, 58, 44, 1, -28, 31.0,  -6.5],
  [ 46, 80, 62, 3,  14, 21.0, -10.0],
  [ 50, 52, 40, 0, -18, 36.0,  -2.0],
  [ 47, 72, 55, 5,  24, 23.5, -20.0],
  [ 58, 65, 50, 4,  26, 24.0,  -9.0],
  [ 63, 58, 44, 5, -15, 27.5,  -4.5],
  [ 55, 75, 58, 1,  32, 20.5, -14.0],
  [ 60, 60, 46, 2, -22, 33.0,  -7.0],
  [ 65, 70, 54, 0,  10, 28.0, -17.5],
] as const;

// BACK: centred belt 40–57%
const BACK_DATA = [
  [ 42, 32, 24, 2,  10,  78.0, -10.0],
  [ 46, 26, 20, 0, -18,  92.0, -25.0],
  [ 50, 36, 28, 4,  25,  82.0, -42.0],
  [ 44, 28, 22, 1, -12,  98.0, -16.0],
  [ 53, 22, 17, 3,  16,  86.0, -58.0],
  [ 48, 34, 26, 5, -20,  72.0, -32.0],
  [ 41, 24, 18, 2,   8, 102.0,  -6.0],
  [ 55, 30, 23, 1, -15,  90.0, -47.0],
  [ 43, 38, 29, 4,  28,  76.0, -64.0],
  [ 49, 20, 15, 0, -10,  95.0, -22.0],
  [ 52, 32, 25, 3,  18, 112.0, -38.0],
  [ 45, 26, 20, 5, -24,  80.0, -54.0],
  [ 57, 28, 22, 2,  14,  88.0, -12.0],
  [ 40, 22, 17, 1,  -8, 106.0, -70.0],
] as const;

type Row = readonly number[];

interface LayerProps {
  id:       string;
  data:     readonly Row[];
  cfg:      AsteroidLayerConfig;
  zIndex:   number;
  // base spin period in seconds (before rotSpeed multiplier)
  baseSpinPeriod: number;
}

function AsteroidLayer({ id, data, cfg, zIndex, baseSpinPeriod }: LayerProps) {
  const { speed, opacity, color, rotation, rotSpeed, geometrySeed, yOffset, sizeScale } = cfg;

  // Use a stable seed — if 0, use a deterministic fallback so geometry always varies
  const seed = geometrySeed === 0 ? 31337 : geometrySeed;

  // Build keyframes: translate only on outer wrapper, continuous spin on inner
  const kf = data.map((a, i) => {
    // Per-asteroid seeded travel speed variation: ×0.55 – ×1.45
    const speedVar  = 0.55 + seededRand(seed, i, 2) * 0.90;
    const actualDur = Math.max(0.5, (a[5] as number) / (speed * speedVar));

    // Per-asteroid spin: period varies 0.6×–1.8× of baseSpinPeriod, driven by rotSpeed
    const spinVar   = 0.6 + seededRand(seed, i, 3) * 1.2;
    const spinDir   = seededRand(seed, i, 4) > 0.5 ? 1 : -1;
    const spinPer   = Math.max(0.5, (baseSpinPeriod * spinVar) / Math.max(0.05, rotSpeed));

    return (
      // Outer: translate only (will-change:transform, no clip-path)
      `@keyframes nca_${id}_${i}_s${seed}{` +
        `0%{transform:translateX(115vw)}` +
        `100%{transform:translateX(-115vw)}` +
      `}` +
      // Inner: continuous spin (no will-change — clip-path safe)
      `@keyframes ncaSpin_${id}_${i}_s${seed}{` +
        `from{transform:rotate(${rotation}deg)}` +
        `to{transform:rotate(${rotation + spinDir * 360}deg)}` +
      `}` +
      // Travel animation
      `.nca_${id}_${i}_s${seed}{` +
        `animation:nca_${id}_${i}_s${seed} ${actualDur}s linear infinite ${a[6]}s` +
      `}` +
      // Spin animation
      `.ncaS_${id}_${i}_s${seed}{` +
        `animation:ncaSpin_${id}_${i}_s${seed} ${spinPer}s linear infinite` +
      `}`
    );
  }).join('');

  return (
    <div style={{ position:'absolute', inset:0, zIndex, pointerEvents:'none', opacity }}>
      <style>{kf}</style>
      <div style={{ position:'absolute', inset:0 }}>
        {data.map((a, i) => {
          const shapeIdx = seededShape(seed, i);

          // Per-asteroid seeded size variation: ×0.5 – ×1.8 on top of sizeScale
          const sizeVar = 0.5 + seededRand(seed, i, 1) * 1.3;
          const sw      = (a[1] as number) * sizeScale * sizeVar;
          const sh      = (a[2] as number) * sizeScale * sizeVar;
          const topAdj  = (a[0] as number) + yOffset;

          return (
            // Outer: translate
            <div
              key={`${i}_${seed}`}
              className={`nca_${id}_${i}_s${seed}`}
              style={{
                position:   'absolute',
                top:        `${topAdj}%`,
                left:       0,
                width:      sw,
                height:     sh,
                willChange: 'transform',
              }}
            >
              {/* Middle: spin wrapper (no will-change so clip-path works) */}
              <div
                className={`ncaS_${id}_${i}_s${seed}`}
                style={{ width:'100%', height:'100%' }}
              >
                {/* Inner: solid color with clip-path */}
                <div style={{
                  width:      '100%',
                  height:     '100%',
                  background: color,
                  clipPath:   SHAPES[shapeIdx],
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface NexusAsteroidsProps {
  fieldOpacity?: number;
  orbColor?:     string;
  front?:        Partial<AsteroidLayerConfig>;
  mid?:          Partial<AsteroidLayerConfig>;
  back?:         Partial<AsteroidLayerConfig>;
  layers?:       'all' | 'back' | 'mid-front' | 'front' | 'mid';
}

export default function NexusAsteroids({
  fieldOpacity = 1,
  orbColor:     _orbColor = '#3b82f6',   // kept for API compat, no longer used for gradient
  front = {},
  mid   = {},
  back  = {},
  layers = 'all',
}: NexusAsteroidsProps) {
  const showBack  = layers === 'all' || layers === 'back';
  const showMid   = layers === 'all' || layers === 'mid-front' || layers === 'mid';
  const showFront = layers === 'all' || layers === 'mid-front' || layers === 'front';

  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity: fieldOpacity }}>
      {/* z:2 = just above WebGL canvas (z:1) */}
      {showBack  && <AsteroidLayer id="back"  data={BACK_DATA}  cfg={{ ...DEFAULT_BACK,  ...back  }} zIndex={2}    baseSpinPeriod={30} />}
      {showMid   && <AsteroidLayer id="mid"   data={MID_DATA}   cfg={{ ...DEFAULT_MID,   ...mid   }} zIndex={3}    baseSpinPeriod={18} />}
      {showFront && <AsteroidLayer id="front" data={FRONT_DATA} cfg={{ ...DEFAULT_FRONT, ...front }} zIndex={9000} baseSpinPeriod={10} />}
    </div>
  );
}
