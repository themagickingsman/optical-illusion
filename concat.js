const fs = require('fs');

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

let fullContent = '';
for (const chunk of chunks) {
  fullContent += fs.readFileSync(chunk, 'utf8');
}

fs.writeFileSync('temp_terrain.tsx', fullContent, 'utf8');
console.log('Concatenated successfully to temp_terrain.tsx.');
