const fs = require('fs');

const source = '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/app/(cms)/cosmic_racers/TerrainGenerator.tsx';
const target = '/Users/uxmagicman/Desktop/optical_illusions/src/components/library/TerrainGenerator.tsx';

try {
  const data = fs.readFileSync(source, 'utf8');
  fs.writeFileSync(target, data, 'utf8');
  console.log('Copied successfully via Node.');
} catch (e) {
  console.error('Error copying:', e.message);
}
