const fs = require('fs');
let tgPath = 'src/components/library/TerrainGenerator.tsx';
let tgCode = fs.readFileSync(tgPath, 'utf8');

tgCode = tgCode.replace(
  /else if \(wpType === 'seismic'\) \{\s*\/\* DEBUG:(.|\n)*?return;\s*\}/m,
  `else if (wpType === 'seismic') params = { radius: seismicRadiusRef.current, depth: seismicDepthRef.current, delay: seismicDelayRef.current, speed: seismicSpeedRef.current, partSpeed: seismicPartSpeedRef.current, count: seismicCountRef.current };`
);
fs.writeFileSync(tgPath, tgCode);
console.log('done');
