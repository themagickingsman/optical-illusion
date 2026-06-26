const fs = require('fs');
const path = require('path');

const destDir = '/Users/uxmagicman/Desktop/optical_illusions';

const filesToCopy = [
  { src: '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/app/(cms)/cosmic_racers/TerrainGenerator.tsx', dest: path.join(destDir, 'src/components/library/TerrainGenerator.tsx') },
  { src: '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/app/(cms)/cosmic_racers/PCSSHelper.ts', dest: path.join(destDir, 'src/components/library/PCSSHelper.ts') },
  { src: '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/lib/FlockEngine.ts', dest: path.join(destDir, 'src/lib/FlockEngine.ts') },
  { src: '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/lib/TerrainMath.ts', dest: path.join(destDir, 'src/lib/TerrainMath.ts') }
];

filesToCopy.forEach(({ src, dest }) => {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`Copied ${path.basename(src)} to ${dest}`);
  } catch (err) {
    console.error(`Failed to copy ${src}:`, err.message);
  }
});

function findFile(dir, name) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === 'backups') continue;
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        const found = findFile(fullPath, name);
        if (found) return found;
      } else if (file === name) {
        return fullPath;
      }
    }
  } catch (e) {}
  return null;
}

const jsonSrc = findFile('/Users/uxmagicman/Desktop/cosmic_racing_game', 'arn_terrain_v1.json');
if (jsonSrc) {
  try {
    const dest = path.join(destDir, 'public/terrain_config.json');
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(jsonSrc, dest);
    console.log(`Copied ${jsonSrc} to ${dest}`);
  } catch (err) {
    console.error(`Failed to copy JSON:`, err.message);
  }
} else {
  console.log('arn_terrain_v1.json not found!');
}
