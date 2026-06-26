const fs = require('fs');

let main_file = './src/components/library/TerrainGenerator.tsx';
let scratch_file = './scratch_sidebar.tsx';

let main = fs.readFileSync(main_file, 'utf8').split('\n');
let scratch = fs.readFileSync(scratch_file, 'utf8').split('\n');

let start_s = scratch.findIndex(l => l.includes('{/* ── Apple Inspector Panel'));
let end_s = scratch.findIndex((l, i) => l.trim() === ');' && i > start_s);
let new_content = scratch.slice(start_s, end_s).join('\n');

let start_m = main.findIndex(l => l.includes('{/* ── Right sidebar'));
let end_m = main.findIndex((l, i) => l.includes('end layoutTab ===') && i > start_m);

main.splice(start_m, end_m - start_m + 3, new_content);

fs.writeFileSync(main_file, main.join('\n'));
console.log('Replaced successfully!');
