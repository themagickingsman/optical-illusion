const fs = require('fs');
const path = require('path');

const destDir = '/Users/uxmagicman/Desktop/optical_illusions';

const filesToCopy = [
  { src: '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/app/(cms)/cosmic_racers/TerrainGenerator.tsx', dest: path.join(destDir, 'src/components/library/TerrainGenerator.tsx') },
  { src: '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/app/(cms)/cosmic_racers/PCSSHelper.ts', dest: path.join(destDir, 'src/components/library/PCSSHelper.ts') },
  { src: '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/lib/FlockEngine.ts', dest: path.join(destDir, 'src/lib/FlockEngine.ts') },
  { src: '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/lib/TerrainMath.ts', dest: path.join(destDir, 'src/lib/TerrainMath.ts') },
  { src: '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/.data/arn_terrain_v1.json', dest: path.join(destDir, 'public/terrain_config.json') }
];

filesToCopy.forEach(({ src, dest }) => {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = fs.readFileSync(src);
    fs.writeFileSync(dest, data);
    console.log(`Copied ${path.basename(src)} to ${dest}`);
  } catch (err) {
    console.error(`Failed to copy ${src}:`, err.message);
  }
});
