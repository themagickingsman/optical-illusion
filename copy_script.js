const fs = require('fs');
const path = require('path');

const srcDir = '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/app/(cms)/cosmic_racers';
const destDir = '/Users/uxmagicman/Desktop/optical_illusions';

const filesToCopy = [
  { src: path.join(srcDir, 'TerrainGenerator.tsx'), dest: path.join(destDir, 'src/components/library/TerrainGenerator.tsx') },
  { src: path.join(srcDir, 'PCSSHelper.ts'), dest: path.join(destDir, 'src/components/library/PCSSHelper.ts') },
  { src: path.join(srcDir, 'FlockEngine.ts'), dest: path.join(destDir, 'src/lib/FlockEngine.ts') },
  { src: path.join(srcDir, 'TerrainMath.ts'), dest: path.join(destDir, 'src/lib/TerrainMath.ts') },
  { src: path.join(srcDir, 'arn_terrain_v1.json'), dest: path.join(destDir, 'public/terrain_config.json') },
];

filesToCopy.forEach(({ src, dest }) => {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  } catch (err) {
    console.error(`Failed to copy ${src} to ${dest}:`, err);
  }
});
