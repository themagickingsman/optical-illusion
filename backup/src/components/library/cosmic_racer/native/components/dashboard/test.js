const fs = require('fs');
const file = '/Users/uxmagicman/Desktop/ARN/web_portal/src/app/science/dashboard/components/AcousticPrintingSimulator.tsx';
const content = fs.readFileSync(file, 'utf8');

const tStart = content.indexOf('{/* Top Controls - Component Selection & Settings */}');
const tDivStart = content.lastIndexOf('<div', tStart);
const canvasStart = content.indexOf('{/* Massive Simulation Canvas Viewport */}');
const tEnd = content.lastIndexOf('</div>', canvasStart) + 6;

console.log('tStart:', tStart);
console.log('tDivStart:', tDivStart);
console.log('canvasStart:', canvasStart);
console.log('tEnd:', tEnd);

const topControls = content.substring(tDivStart, tEnd);
console.log('Length of topControls:', topControls.length);
