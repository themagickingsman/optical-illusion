const fs = require('fs');
const text = fs.readFileSync('./src/lib/particles/GPUParticleSystem.ts', 'utf8');
const lines = text.split('\n');
for (let i = 85; i < 95; i++) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
}
