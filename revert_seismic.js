const fs = require('fs');

// Revert TerrainGenerator.tsx
let tgPath = 'src/components/library/TerrainGenerator.tsx';
let tgCode = fs.readFileSync(tgPath, 'utf8');

tgCode = tgCode.replace(
  /const triggerWeaponImpact = useCallback\(\(hx: number, hy: number, hz: number, radius: number, depth: number, partSpeedOverride\?: number, innerRadius: number = 0\) => \{/,
  'const triggerWeaponImpact = useCallback((hx: number, hy: number, hz: number, radius: number, depth: number, partSpeedOverride?: number) => {'
);

tgCode = tgCode.replace(
  /const dist = Math\.sqrt\(dx \* dx \+ dz \* dz\);\n\s*if \(dist <= radius && dist > innerRadius\) \{/,
  'if (Math.sqrt(dx * dx + dz * dz) <= radius) {'
);

fs.writeFileSync(tgPath, tgCode);


// Revert WeaponEngine.ts
let wePath = 'src/components/library/weapons/WeaponEngine.ts';
let weCode = fs.readFileSync(wePath, 'utf8');

// 1. Revert the constructor
weCode = weCode.replace(
  /  constructor\(\n    private scene: THREE\.Scene,\n    private onImpact: \(x: number, y: number, z: number, radius: number, depth: number, partSpeed\?: number, innerRadius\?: number\) => void\n  \) \{\}/,
  `  private scene: THREE.Scene;
  private onImpact: (x: number, y: number, z: number, radius: number, depth: number, partSpeed?: number) => void;

  constructor(scene: THREE.Scene, onImpact: (x: number, y: number, z: number, radius: number, depth: number, partSpeed?: number) => void) {
    this.scene = scene;
    this.onImpact = onImpact;
  }`
);

// 2. Revert the RingGeometry
weCode = weCode.replace(
  /const pGeo = new THREE\.RingGeometry\(0\.8, 1\.0, 64\);/,
  'const pGeo = new THREE.RingGeometry(0.1, 0.4, 32);'
);

// 3. Revert the seismic update logic block
const oldSeismicBlock = `      } else if (p.type === 'seismic') {
        p.mesh.visible = false; // Hide the 2D flat cylinder graphic
        const clampedProgress = Math.min(1.0, p.progress);
        const scale = 1 + clampedProgress * p.radius;
        p.mesh.scale.set(scale, scale, scale);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - clampedProgress;
        
        if (clampedProgress < 1.0) {
            const currentRadius = clampedProgress * p.radius;
            if (p.lastImpactRadius === undefined) p.lastImpactRadius = 0;
            
            if (currentRadius - p.lastImpactRadius >= 0.5) {
                this.onImpact(p.targetX, p.targetY, p.targetZ, currentRadius, p.depth, p.partSpeed);
                p.lastImpactRadius = currentRadius;
            }
        }`;

const currentSeismicBlockRegex = /      \} else if \(p\.type === 'seismic'\) \{\n        p\.mesh\.visible = true;\n        const clampedProgress = Math\.min\(1\.0, p\.progress\);\n        const scale = clampedProgress \* p\.radius \|\| 0\.001;\n        p\.mesh\.scale\.set\(scale, scale, scale\);\n        \(p\.mesh\.material as THREE\.MeshBasicMaterial\)\.opacity = 1 - clampedProgress;\n        \n        if \(clampedProgress < 1\.0\) \{\n            const r = \(typeof p\.radius === 'number' && !isNaN\(p\.radius\) && p\.radius > 0\) \? p\.radius : 8;\n            const d = \(typeof p\.depth === 'number' && !isNaN\(p\.depth\) && p\.depth > 0\) \? p\.depth : 3;\n            const ps = \(typeof p\.partSpeed === 'number' && !isNaN\(p\.partSpeed\)\) \? p\.partSpeed : 1;\n            \n            const currentRadius = clampedProgress \* r;\n            if \(p\.lastImpactRadius === undefined\) p\.lastImpactRadius = 0;\n            \n            if \(currentRadius - p\.lastImpactRadius >= 0\.5\) \{\n                console\.log\("Seismic Impact!", currentRadius\);\n                this\.onImpact\(p\.targetX, p\.targetY, p\.targetZ, currentRadius, d, ps, p\.lastImpactRadius\);\n                p\.lastImpactRadius = currentRadius;\n            \}\n        \}/;

weCode = weCode.replace(currentSeismicBlockRegex, oldSeismicBlock);

// 4. Revert the seismic cleanup block
const oldCleanupBlock = `        } else if (p.type === 'seismic') {
          // Final cleanup impact to ensure full radius is reached exactly
          this.onImpact(p.targetX, p.targetY, p.targetZ, p.radius, p.depth, p.partSpeed);
        }`;

const currentCleanupBlockRegex = /        \} else if \(p\.type === 'seismic'\) \{\n          \/\/ Final cleanup impact to ensure full radius is reached exactly\n          const r = \(typeof p\.radius === 'number' && !isNaN\(p\.radius\) && p\.radius > 0\) \? p\.radius : 8;\n          const d = \(typeof p\.depth === 'number' && !isNaN\(p\.depth\) && p\.depth > 0\) \? p\.depth : 3;\n          const ps = \(typeof p\.partSpeed === 'number' && !isNaN\(p\.partSpeed\)\) \? p\.partSpeed : 1;\n          this\.onImpact\(p\.targetX, p\.targetY, p\.targetZ, r, d, ps, p\.lastImpactRadius \|\| 0\);\n        \}/;

weCode = weCode.replace(currentCleanupBlockRegex, oldCleanupBlock);

fs.writeFileSync(wePath, weCode);

console.log('Revert completed successfully.');
