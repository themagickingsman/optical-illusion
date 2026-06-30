const fs = require('fs');

// 1. Update WeaponEngine.ts
let wePath = 'src/components/library/weapons/WeaponEngine.ts';
let weCode = fs.readFileSync(wePath, 'utf8');

// Fix the RingGeometry
weCode = weCode.replace(
  /const pGeo = new THREE\.RingGeometry\(0\.1, 0\.4, 32\);/,
  'const pGeo = new THREE.RingGeometry(0.8, 1.0, 64);'
);

// Fix the scale logic for seismic
weCode = weCode.replace(
  /const scale = 1 \+ clampedProgress \* p\.radius;/g,
  'const scale = clampedProgress * p.radius || 0.001;'
);

fs.writeFileSync(wePath, weCode);

// 2. Update TerrainGenerator.tsx
let tgPath = 'src/components/library/TerrainGenerator.tsx';
let tgCode = fs.readFileSync(tgPath, 'utf8');

// Fix the innerRadius condition
tgCode = tgCode.replace(
  /if \(dist <= radius && dist >= innerRadius\) \{/g,
  'if (dist <= radius && dist > innerRadius) {'
);

fs.writeFileSync(tgPath, tgCode);
console.log('Done!');
