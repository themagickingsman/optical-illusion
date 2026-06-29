const { execSync } = require('child_process');

try {
  const output = execSync('git diff src/components/library/TerrainGenerator.tsx', { encoding: 'utf-8' });
  console.log(output);
} catch (e) {
  console.error(e);
}
