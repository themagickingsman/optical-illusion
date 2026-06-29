const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('git show HEAD:src/components/library/TerrainGenerator.tsx', { encoding: 'utf-8' });
  fs.writeFileSync('/Users/uxmagicman/Desktop/optical_illusions/scratch/old_tg.tsx', output);
  console.log('Successfully wrote old file');
} catch (e) {
  console.error(e);
}
