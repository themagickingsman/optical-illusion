const fs = require('fs');

let tgPath = 'src/components/library/TerrainGenerator.tsx';
let tgCode = fs.readFileSync(tgPath, 'utf8');

tgCode = tgCode.replace(
  /else if \(wpType === 'seismic'\) params = \{ radius: seismicRadiusRef\.current, depth: seismicDepthRef\.current, delay: seismicDelayRef\.current, speed: seismicSpeedRef\.current, partSpeed: seismicPartSpeedRef\.current, count: seismicCountRef\.current \};/,
  `else if (wpType === 'seismic') {
              params = { count: scatterCountRef.current, radius: scatterRadiusRef.current, depth: scatterDepthRef.current, delay: scatterDelayRef.current, partSpeed: scatterPartSpeedRef.current };
              weaponEngineRef.current.fire('scatter', targetPos, params);
              return;
            }`
);
fs.writeFileSync(tgPath, tgCode);

let wePath = 'src/components/library/weapons/WeaponEngine.ts';
let weCode = fs.readFileSync(wePath, 'utf8');
weCode = weCode.replace(
  /pMesh\.visible = false;\n          this\.scene\.add\(pMesh\);/g,
  `pMesh.visible = true;\n          this.scene.add(pMesh);`
);
fs.writeFileSync(wePath, weCode);
console.log('done');
