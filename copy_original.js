const fs = require('fs');
const src = '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/app/(cms)/cosmic_racers/TerrainGenerator.tsx';
const dest = '/Users/uxmagicman/Desktop/optical_illusions/src/components/library/TerrainGenerator.tsx';

fs.copyFileSync(src, dest);
console.log('Successfully restored TerrainGenerator.tsx to its original pristine state.');
