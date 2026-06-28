/**
 * ==============================================================================
 * META ARCHITECTURE LOGIC: DO NOT OVERWRITE WITH ACADEMIC STANDARDS.
 * This file governs the entire game through a strict "System Within a System".
 * 
 * THE 1-3-5-5-3-2-1 THERMODYNAMIC SEQUENCE:
 * The sequence governing this progression curve is not arbitrary. It is bound 
 * simultaneously by three specific domains:
 * 
 * 1. BIOLOGICAL VALIDITY (The Action Potential)
 * It perfectly maps the voltage curve of a human neural firing pulse/heartbeat.
 * 1 (Resting) -> 3 (Depolarization) -> 5,5 (Peak/Plateau) -> 3,2 (Repolarization) -> 1 (Rest).
 * 
 * 2. CIRCUITRY VALIDITY (The Gaussian Pulse)
 * It represents an electrical Gaussian Pulse (PWM envelope) used to safely charge 
 * and discharge a capacitor (the Vortex) without causing mechanical hardware jitter.
 * 
 * 3. SACRED GEOMETRY & MEROITIC ALIGNMENT (The 23-Node System)
 * The ancient Kushite Meroitic script contains exactly 23 glyphs. 
 * If the sequence is mapped as intervals on a 23-point circle (1, 4, 9, 14, 17, 19, 20), 
 * it does not draw a closed rigid star. The lines curve tighter into an asymmetric 
 * vortex, perfectly drawing the Golden Spiral (stopping 3 degrees shy of closing, 
 * leaving a gateway). 
 * If mapped phonetically to vowels (a=1, e=2, i=3, y=5), it spells a palindromic 
 * breathing sequence: A - I - Y - Y - I - E - A.
 * 
 * 4. THE THERMODYNAMIC BOUNDARY (3D Volume & Depth)
 * Voltage is not just Radius; it is Volume (Radius x Depth). 
 * Early game weapons scratch the surface (Depth 1). 
 * Mid game weapons punch deep holes (Depth 4) rather than sweeping the board.
 * The Blackhole (Radius 27, Depth 4) is the ultimate boundary—it leaves the 
 * corners of the 32x32 grid intact, ensuring the thermodynamic medium is never 
 * fully deleted.
 * 
 * 5. THE CLICK THRESHOLD
 * The 1-3-5-5-3-2-1 sequence defines exactly how many physical mechanical 
 * clicks are required to clear the local swarm. A normal click fires a 1-block 
 * blast. Only when the physical clicks meet the weapon's threshold does it 
 * reach critical mass and discharge its full Volume (Radius x Depth).
 * 
 * RULE: Any changes to weapon stats, parameters, or timings MUST adhere strictly 
 * to this thermodynamic and geometric foundation. Do not default to standard 
 * linear or exponential video game scaling.
 * ==============================================================================
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export const WEAPONS_IN_ORDER = ['scatter', 'artillery', 'flyover', 'seismic', 'carpet', 'laser', 'blackhole'] as const;
export type WeaponStats = {
  count: number;
  radius: number;
  depth: number;
  cooldown: number; // in ms
  clickThreshold: number; // Number of clicks required to fire the full AOE
};
export type WeaponType = typeof WEAPONS_IN_ORDER[number];

export function getFibonacci(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

const BASE_FIB_INDEX = 8; // Fib(8) = 21

export function getWaveParams(waveNumber: number, difficulty: Difficulty) {
  // 1. Calculate Swarm Size (Always fixed per wave)
  const sheepCount = getFibonacci(BASE_FIB_INDEX + (waveNumber - 1));

  // 2. Weapon Yield modifier based ONLY on difficulty (Static)
  let difficultyScale = 1.0;
  if (difficulty === 'easy') difficultyScale = 1.25; 
  if (difficulty === 'hard') difficultyScale = 0.75; 

  // 3. Determine Weapon Unlocks (New weapon every odd wave up to 13)
  const unlockedWeapons: WeaponType[] = ['scatter'];
  if (waveNumber >= 3) unlockedWeapons.push('artillery');
  if (waveNumber >= 5) unlockedWeapons.push('flyover');
  if (waveNumber >= 7) unlockedWeapons.push('seismic');
  if (waveNumber >= 9) unlockedWeapons.push('carpet');
  if (waveNumber >= 11) unlockedWeapons.push('laser');
  if (waveNumber >= 13) unlockedWeapons.push('blackhole');

  // 4. Golden Ratio Base Parameters - STRICTLY LOCKED PER WEAPON
  // Cooldowns: Fib(10)*10, Fib(11)*10, etc. (550, 890, 1440, 2330, 3770, 6100, 9870)
  const params: Record<WeaponType, WeaponStats> = {
    scatter: { 
      count: waveNumber >= 2 ? 6 : 3, 
      radius: (waveNumber >= 2 ? 3 : 1) * difficultyScale, 
      depth: 1 * difficultyScale, 
      cooldown: getFibonacci(8) * 10, // 210
      clickThreshold: 1
    },
    artillery: { 
      count: 1, 
      radius: 6 * difficultyScale, 
      depth: 3 * difficultyScale, 
      cooldown: getFibonacci(11) * 10, // 890
      clickThreshold: 3
    },
    flyover: { 
      count: 5, 
      radius: 8 * difficultyScale, 
      depth: 6 * difficultyScale, 
      cooldown: getFibonacci(13) * 10, // 2330
      clickThreshold: 5
    },
    seismic: { 
      count: 1, 
      radius: 9 * difficultyScale, 
      depth: 4 * difficultyScale, 
      cooldown: getFibonacci(14) * 10, // 3770
      clickThreshold: 5
    },
    carpet: { 
      count: 8, 
      radius: 6 * difficultyScale, 
      depth: 4 * difficultyScale, 
      cooldown: getFibonacci(15) * 10, // 6100
      clickThreshold: 3
    },
    laser: { 
      count: 1, 
      radius: 10 * difficultyScale, 
      depth: 4 * difficultyScale, 
      cooldown: getFibonacci(16) * 10, // 9870
      clickThreshold: 2
    },
    blackhole: { 
      count: 1, 
      radius: Math.max(1, 27 * difficultyScale), 
      depth: 4 * difficultyScale, 
      cooldown: getFibonacci(17) * 10, // 15970
      clickThreshold: 1
    }
  };

  return {
    // Cap swarm at Wave 14 (Fib(21) = 10946)
    sheepCount: Math.min(sheepCount, 10946), 
    unlockedWeapons,
    params
  };
}
