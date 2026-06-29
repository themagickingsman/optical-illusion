export function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

export function buildNoise(gridW: number, gridH: number, octaves: number, seed: number, maxH = 5, roughness = 1.5): number[][] {
  const rand = lcg(seed);
  // Base white-noise lattice
  const lat = Array.from({ length: gridH + 1 }, () =>
    Array.from({ length: gridW + 1 }, () => rand())
  );
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smooth = (t: number) => t * t * (3 - 2 * t);

  const sample = (nx: number, ny: number) => {
    const ix = Math.floor(nx) % (gridW + 1), iy = Math.floor(ny) % (gridH + 1);
    const fx = nx - Math.floor(nx), fy = ny - Math.floor(ny);
    const tl = lat[iy][ix], tr = lat[iy][(ix + 1) % (gridW + 1)];
    const bl = lat[(iy + 1) % (gridH + 1)][ix], br = lat[(iy + 1) % (gridH + 1)][(ix + 1) % (gridW + 1)];
    return lerp(lerp(tl, tr, smooth(fx)), lerp(bl, br, smooth(fx)), smooth(fy));
  };

  const heights: number[][] = [];
  let min = Infinity, max = -Infinity;
  for (let y = 0; y < gridH; y++) {
    heights.push([]);
    for (let x = 0; x < gridW; x++) {
      let v = 0, amp = 1, freq = 1, total = 0;
      for (let o = 0; o < octaves; o++) {
        v += sample(x / gridW * freq * 4, y / gridH * freq * 4) * amp;
        total += amp; amp *= 0.5; freq *= 2;
      }
      const n = v / total;
      heights[y].push(n);
      if (n < min) min = n;
      if (n > max) max = n;
    }
  }
  // Remap → 1..maxH with optional roughness power curve
  for (let y = 0; y < gridH; y++)
    for (let x = 0; x < gridW; x++) {
      const normalized = (heights[y][x] - min) / (max - min); // 0..1
      const curved     = Math.pow(normalized, roughness);       // power curve
      heights[y][x] = Math.round(1 + curved * (maxH - 1));
    }
  return heights;
}
