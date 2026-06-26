const fs = require('fs');
const path = require('path');

const chunks = [
  'chunk1.tsx',
  'chunk2.tsx',
  'chunk3.tsx',
  'chunk4.tsx',
  'chunk5.tsx',
  'chunk6.tsx',
  'chunk7.tsx',
  'chunk8.tsx'
];

let res = '';
for (const c of chunks) {
  res += fs.readFileSync(path.join(__dirname, c), 'utf8');
}

fs.writeFileSync(path.join(__dirname, 'src', 'components', 'library', 'TerrainGenerator.tsx'), res, 'utf8');
console.log('Done!');
